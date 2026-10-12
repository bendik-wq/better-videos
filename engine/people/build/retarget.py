# Offline retargeter: CMU mocap BVH (Bruce Hahne's MotionBuilder-friendly conversion, frame 0 is a
# T-pose) -> engine/people skeleton (MPFB "game_engine" rig, identity-rest convention) -> GLB clips.
#
#   python3 engine/people/build/retarget.py <ref-character.glb> <bvh-dir> <out.glb> [clip,clip]
#
# Per bone: W_t(f) = S(f) S(0)^T C, where S is the source bone's world rotation and C the shortest
# arc taking the target's rest bone direction onto the source's T-pose direction. Hips translation
# scales by leg length. Then: contacts are detected per foot, the pelvis is settled so planted feet
# touch the ground, planted ankles are pinned with two-bone IK (no sliding), and the clip is cut
# to its best self-similar loop and cross-faded so it repeats seamlessly. Locomotion is made
# in-place (forward speed and stride are stored, so the engine can walk it along a path at the
# exact speed the feet expect).
import sys, os, json, struct
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from bvh import BVH
from skel import Skeleton
from qmath import q2m, m2q, min_arc, rot_y, continuous, slerp, axis_angle
from clips import CLIPS

MAP = {'pelvis': 'Hips', 'spine_01': 'LowerBack', 'spine_02': 'Spine', 'spine_03': 'Spine1', 'neck_01': 'Neck', 'head': 'Head'}
for s, S in (('l', 'Left'), ('r', 'Right')):
    MAP.update({f'clavicle_{s}': f'{S}Shoulder', f'upperarm_{s}': f'{S}Arm', f'lowerarm_{s}': f'{S}ForeArm', f'hand_{s}': f'{S}Hand',
                f'thigh_{s}': f'{S}UpLeg', f'calf_{s}': f'{S}Leg', f'foot_{s}': f'{S}Foot', f'ball_{s}': f'{S}ToeBase'})
# bone -> child used for its direction, in target and source
TDIR = {'spine_01': 'spine_02', 'spine_02': 'spine_03', 'spine_03': 'neck_01', 'neck_01': 'head'}
SDIR = {'LowerBack': 'Spine', 'Spine': 'Spine1', 'Spine1': 'Neck1', 'Neck': 'Head'}
for s, S in (('l', 'Left'), ('r', 'Right')):
    TDIR.update({f'clavicle_{s}': f'upperarm_{s}', f'upperarm_{s}': f'lowerarm_{s}', f'lowerarm_{s}': f'hand_{s}', f'hand_{s}': f'middle_01_{s}',
                 f'thigh_{s}': f'calf_{s}', f'calf_{s}': f'foot_{s}', f'foot_{s}': f'ball_{s}'})
    SDIR.update({f'{S}Shoulder': f'{S}Arm', f'{S}Arm': f'{S}ForeArm', f'{S}ForeArm': f'{S}Hand', f'{S}Hand': f'{S}HandIndex1',
                 f'{S}UpLeg': f'{S}Leg', f'{S}Leg': f'{S}Foot', f'{S}Foot': f'{S}ToeBase'})
FINGERS = ['index', 'middle', 'ring', 'pinky']
# finger curl per segment (radians) for hand shapes; thumb separately
HANDS = {'relaxed': ([0.28, 0.42, 0.30], [0.10, 0.15, 0.10]), 'typing': ([0.45, 0.55, 0.35], [0.10, 0.20, 0.10]),
         'fist': ([1.35, 1.55, 1.0], [0.35, 0.55, 0.45]), 'grip': ([1.15, 1.3, 0.9], [0.4, 0.45, 0.35]),
         'point': ([0.0, 0.05, 0.05], [0.35, 0.5, 0.3]), 'open': ([0.08, 0.1, 0.08], [0.0, 0.05, 0.05]),
         'cup': ([0.35, 0.45, 0.35], [0.05, 0.1, 0.08])}


def smooth(x, sigma):
    """Gaussian smoothing along axis 0 (edge-padded)."""
    if sigma <= 0: return x
    r = int(3 * sigma) + 1; k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2); k /= k.sum()
    pad = np.concatenate([np.repeat(x[:1], r, 0), x, np.repeat(x[-1:], r, 0)], 0)
    return np.stack([np.tensordot(k, pad[i:i + 2 * r + 1], axes=(0, 0)) for i in range(len(x))])


class Retargeter:
    def __init__(self, ref_glb):
        self.sk = Skeleton(ref_glb); sk = self.sk
        self.J = len(sk.names)
        self.leg_t = sk.chain_len(['thigh_l', 'calf_l', 'foot_l'])
        # rest ground heights of heel (ankle joint) and ball
        self.hA = sk.rest[sk.idx['foot_l'], 1]; self.hB = sk.rest[sk.idx['ball_l'], 1]

    def palm_normal(self, side):
        sk = self.sk; R = sk.rest; i = sk.idx
        d = R[i[f'middle_01_{side}']] - R[i[f'hand_{side}']]; across = R[i[f'index_01_{side}']] - R[i[f'pinky_01_{side}']]
        n = np.cross(d, across) if side == 'l' else np.cross(across, d); return n / np.linalg.norm(n)

    def finger_locals(self, side, shape):
        """Constant local rotations for the finger joints of one hand (identity-rest convention)."""
        sk = self.sk; R = sk.rest; i = sk.idx
        hand = R[i[f'hand_{side}']]; mid = R[i[f'middle_01_{side}']]
        across = R[i[f'index_01_{side}']] - R[i[f'pinky_01_{side}']]
        d = (mid - hand) / np.linalg.norm(mid - hand)
        n = np.cross(d, across) if side == 'l' else np.cross(across, d)  # palm normal (towards the palm)
        n /= np.linalg.norm(n)
        out = {}
        curl, thumb = HANDS[shape]
        for f in FINGERS:
            fd = R[i[f'{f}_02_{side}']] - R[i[f'{f}_01_{side}']]; ax = np.cross(fd, n); ax /= np.linalg.norm(ax)
            for s in range(3): out[f'{f}_0{s + 1}_{side}'] = axis_angle(ax, curl[s])
        td = R[i[f'thumb_02_{side}']] - R[i[f'thumb_01_{side}']]; ax = np.cross(td, n); ax /= np.linalg.norm(ax)
        for s in range(3): out[f'thumb_0{s + 1}_{side}'] = axis_angle(ax, thumb[s])
        return out

    def from_bvh(self, b, t0, t1, fps):
        """World rotations (F,J,3,3) and pelvis translation (F,3) for seconds [t0, t1) of a BVH."""
        sk = self.sk
        n = len(b.motion); step = b.fps / fps
        idx = np.clip(np.round(1 + np.arange(t0 * b.fps, min(t1 * b.fps, n - 1), step)).astype(int), 1, n - 1)
        Rs, Ps = b.fk(np.concatenate([[0], idx]))
        R0, P0 = Rs[0], Ps[0]; Rs, Ps = Rs[1:], Ps[1:]
        leg_s = sum(np.linalg.norm(P0[b.idx[y]] - P0[b.idx[x]]) for x, y in (('LeftUpLeg', 'LeftLeg'), ('LeftLeg', 'LeftFoot')))
        leg_t = sk.chain_len(['thigh_l', 'calf_l', 'foot_l'])
        k = leg_t / leg_s
        F = len(idx); W = np.tile(np.eye(3), (F, self.J, 1, 1))
        C = {}
        for tb, sb in MAP.items():
            j = sk.idx[tb]; s = b.idx[sb]
            if tb in TDIR and not tb.startswith(('spine', 'neck', 'clavicle')):
                dt = sk.rest[sk.idx[TDIR[tb]]] - sk.rest[j]; ds = P0[b.idx[SDIR[sb]]] - P0[s]
                C[tb] = min_arc(dt, ds)
            elif tb.startswith('ball'): C[tb] = C['foot' + tb[-2:]]
            else: C[tb] = np.eye(3)
            W[:, j] = Rs[:, s] @ R0[s].T @ C[tb]
        # palms: Hahne's T-poses are palms-down. Twist the whole arm about its axis so the target's
        # palm normal, carried into the T-pose by C, points down too (else hanging hands pronate).
        for s_ in 'lr':
            n = self.palm_normal(s_)
            n1 = C[f'hand_{s_}'] @ n
            for part in ('upperarm', 'lowerarm', 'hand'):
                tb = f'{part}_{s_}'; j = sk.idx[tb]; sb = MAP[tb]
                ax = P0[b.idx[SDIR[sb]]] - P0[b.idx[sb]]; ax /= np.linalg.norm(ax)
                a_ = n1 - np.dot(n1, ax) * ax; want = np.array([0, -1.0, 0]); want = want - np.dot(want, ax) * ax
                ang = np.arctan2(np.dot(np.cross(a_, want), ax), np.dot(a_, want))
                tw = q2m(axis_angle(ax, ang)); C[tb] = tw @ C[tb]
                W[:, j] = Rs[:, b.idx[sb]] @ R0[b.idx[sb]].T @ C[tb]
        # unmapped bones (fingers) follow their parent rigidly here; hand shapes are applied later
        for j, p in enumerate(sk.parent):
            if sk.names[j] not in MAP and p >= 0: W[:, j] = W[:, p]
        hips = Ps[:, b.idx['Hips']]
        pel = np.zeros((F, 3)); pel[:, [0, 2]] = (hips[:, [0, 2]] - hips[0, [0, 2]]) * k
        pel[:, 1] = sk.rest[sk.idx['pelvis'], 1] + (hips[:, 1] - P0[b.idx['Hips'], 1]) * k
        return W, pel

    # ---- locals <-> world
    def to_local(self, W):
        sk = self.sk; L = np.empty_like(W)
        for j, p in enumerate(sk.parent): L[:, j] = W[:, j] if p < 0 else np.swapaxes(W[:, p], -1, -2) @ W[:, j]
        return L

    def to_world(self, L):
        sk = self.sk; W = np.empty_like(L)
        for j, p in enumerate(sk.parent): W[:, j] = L[:, j] if p < 0 else W[:, p] @ L[:, j]
        return W

    def ik_leg(self, W, P, side, target, wgt):
        """Two-bone IK: move the ankle towards target (F,3) with weight wgt (F,), knee stays in its plane."""
        sk = self.sk; i = sk.idx
        th, ca, fo = i[f'thigh_{side}'], i[f'calf_{side}'], i[f'foot_{side}']
        for f in np.nonzero(wgt > 1e-4)[0]:
            H, Kn, A = P[f, th], P[f, ca], P[f, fo]
            T = A + (target[f] - A) * wgt[f]
            l1, l2 = np.linalg.norm(Kn - H), np.linalg.norm(A - Kn)
            d = T - H; L = np.clip(np.linalg.norm(d), abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4); d = d / np.linalg.norm(d)
            pole = Kn - H - np.dot(Kn - H, d) * d
            if np.linalg.norm(pole) < 1e-6: pole = W[f, th] @ np.array([0, 0, 1.0])
            pole /= np.linalg.norm(pole)
            a = (l1 * l1 + L * L - l2 * l2) / (2 * l1 * L); a = np.clip(a, -1, 1)
            K2 = H + d * l1 * a + pole * l1 * np.sqrt(1 - a * a)
            T2 = H + d * L
            Rth = min_arc(Kn - H, K2 - H)            # thigh swings the knee onto K2
            Rca = min_arc(Rth @ (A - Kn), T2 - K2)   # then the shin aims the ankle at T2
            W[f, th] = Rth @ W[f, th]
            W[f, ca] = Rca @ Rth @ W[f, ca]
            # the foot keeps its world rotation (its local changes), so the sole stays flat
        return W

    def build(self, spec, bvhdir):
        fps = spec.get('fps', 30)
        b = BVH(os.path.join(bvhdir, spec['src'] + '.bvh'))
        t0, t1 = spec.get('range', (0, 1e9))
        W, pel = self.from_bvh(b, t0, t1, fps)
        sk = self.sk; i = sk.idx
        if 'upper' in spec:  # layer another clip's upper body (local rotations) over this one
            u = spec['upper']; bu = BVH(os.path.join(bvhdir, u['src'] + '.bvh'))
            Wu, _ = self.from_bvh(bu, *u.get('range', (0, 1e9)), fps)
            n = min(len(W), len(Wu)); W, pel, Wu = W[:n], pel[:n], Wu[:n]
            L, Lu = self.to_local(W), self.to_local(Wu)
            sub = set(); root = i[u.get('from', 'spine_02')]
            for j, p in enumerate(sk.parent):
                if j == root or p in sub: sub.add(j)
            for j in sub: L[:, j] = Lu[:, j]
            W = self.to_world(L)
        F = len(W)
        P = sk.fk(W, {i['pelvis']: pel})
        # ---- ground: CMU takes float or sink a little; put the clip's planted feet on y = 0
        hmin = np.minimum.reduce([P[:, i[f'foot_{s}'], 1] - self.hA for s in 'lr'] + [P[:, i[f'ball_{s}'], 1] - self.hB for s in 'lr'])
        pel[:, 1] -= np.percentile(hmin, 3)
        P = sk.fk(W, {i['pelvis']: pel})
        # ---- contacts: a foot is planted when its heel or ball is near the ground and slow
        contacts = {}
        for s in 'lr':
            A, B = P[:, i[f'foot_{s}']], P[:, i[f'ball_{s}']]
            h = np.minimum(A[:, 1] - self.hA, B[:, 1] - self.hB)
            v = np.linalg.norm(np.gradient(np.where((A[:, 1] - self.hA < B[:, 1] - self.hB)[:, None], A, B)[:, [0, 2]], axis=0), axis=1) * fps
            c = (h < spec.get('contact_h', 0.06)) & (v < spec.get('contact_v', 0.45))
            # close 1-2 frame gaps, drop 1-2 frame blips
            c = c.astype(float); c = smooth(c[:, None], 1.0)[:, 0] > 0.5
            contacts[s] = c
        # ---- settle the pelvis: planted feet touch the ground
        if spec.get('ground', True):
            err = np.full(F, np.nan)
            for s in 'lr':
                A, B = P[:, i[f'foot_{s}']], P[:, i[f'ball_{s}']]
                h = np.minimum(A[:, 1] - self.hA, B[:, 1] - self.hB)
                e = np.where(contacts[s], h, np.nan)
                err = np.where(np.isnan(err), e, np.where(np.isnan(e), err, np.minimum(err, e)))
            if np.all(np.isnan(err)): err[:] = 0
            idx = np.arange(F); good = ~np.isnan(err)
            err = np.interp(idx, idx[good], err[good])
            pel[:, 1] -= smooth(err[:, None], 2.5)[:, 0]
            P = sk.fk(W, {i['pelvis']: pel})
        # ---- foot lock: pin each planted ankle to its mean position over the contact (IK, eased)
        if spec.get('footlock', True):
            for s in 'lr':
                c = contacts[s]; A = P[:, i[f'foot_{s}']]
                target = A.copy(); wgt = np.zeros(F)
                f = 0
                while f < F:
                    if not c[f]: f += 1; continue
                    g = f
                    while g < F and c[g]: g += 1
                    pin = A[f:g].mean(0); pin[1] = A[f:g, 1].mean()
                    target[max(0, f - 3):min(F, g + 3)] = pin
                    ramp = np.ones(g - f)
                    wgt[f:g] = 1
                    for r in range(1, 4):
                        if f - r >= 0: wgt[f - r] = max(wgt[f - r], 1 - r / 4)
                        if g - 1 + r < F: wgt[g - 1 + r] = max(wgt[g - 1 + r], 1 - r / 4)
                    f = g
                wgt = 0.5 - 0.5 * np.cos(np.pi * np.clip(wgt, 0, 1))
                W = self.ik_leg(W, P, s, target, wgt)
                P = sk.fk(W, {i['pelvis']: pel})
        # ---- hands
        L = self.to_local(W)
        for s in 'lr':
            shape = spec.get('hands', {}).get(s, spec.get('hand', 'relaxed'))
            for name, q in self.finger_locals(s, shape).items(): L[:, i[name]] = q2m(q)
        # ---- loop: best self-similar window, cross-faded
        Q = continuous(m2q(L))  # (F,J,4)
        loop = spec.get('loop', True)
        a, n = 0, F
        if loop:
            a, n = self.find_loop(Q, pel, fps, spec, 0)
        # ---- heading: travel direction over the loop (locomotion) or mean facing, onto +Z
        if spec.get('kind') == 'cycle':
            d = pel[min(a + n, F - 1)] - pel[a]; yaw = np.arctan2(d[0], d[2])
            speed = float(np.hypot(d[0], d[2]) / (n / fps))
        else:
            fwd = W[a:a + n, i['pelvis']] @ np.array([0, 0, 1.0]); m = fwd.mean(0); yaw = np.arctan2(m[0], m[2]); speed = 0.0
        Ry = rot_y(-yaw - np.radians(spec.get('face', 0)))
        W = np.einsum('ij,fkjl->fkil', Ry, W); pel = pel @ Ry.T
        L[:, i['pelvis']] = np.einsum('ij,fjl->fil', Ry, L[:, i['pelvis']])
        Q = continuous(m2q(L))
        B = int(spec.get('blend', 0.35) * fps)
        B = min(B, a)
        idx = np.arange(a, a + n)
        Qo = Q[idx].copy(); po = pel[idx].copy()
        t = (np.arange(n)) / fps
        if spec.get('kind') == 'cycle':
            po[:, 2] -= speed * t; po[:, 0] -= np.linspace(po[0, 0], po[-1, 0] + (po[-1, 0] - po[-2, 0]), n)  # in place, straight
        cl = {k: v[idx].copy() for k, v in contacts.items()}
        if loop and B > 0:
            for u in range(n - B, n):
                w = (u - (n - B)) / B; w = 0.5 - 0.5 * np.cos(np.pi * w)
                src = a + u - n  # same phase, one period earlier
                Qo[u] = slerp(Qo[u], Q[src], w)
                pp = pel[src].copy()
                if spec.get('kind') == 'cycle': pp[2] -= speed * ((src - a) / fps); pp[0] = po[u, 0]
                po[u] = po[u] * (1 - w) + pp * w
        if not spec.get('kind') == 'cycle' and spec.get('anchor', True):
            po[:, [0, 2]] -= po[0, [0, 2]] if not loop else po[:, [0, 2]].mean(0)
        return dict(q=Qo, pel=po, fps=fps, speed=float(speed), loop=bool(loop),
                    contacts={k: ''.join('1' if x else '0' for x in v) for k, v in cl.items()})

    def find_loop(self, Q, pel, fps, spec, speed):
        F = len(Q); B = int(spec.get('blend', 0.35) * fps)
        lo, hi = [int(x * fps) for x in spec.get('period', (0.9, 1.5) if spec.get('kind') == 'cycle' else (3.0, 12.0))]
        hi = min(hi, F - 1 - B)
        best = (1e9, 0, F)
        body = [j for j, nm in enumerate(self.sk.names) if not any(nm.startswith(f) for f in FINGERS + ['thumb'])]
        vel = np.gradient(pel, axis=0) * fps
        for n in range(max(lo, 2), hi + 1):
            for a in range(B, F - n):
                d = np.abs(np.sum(Q[a, body] * Q[a + n, body], -1)); e = np.sum(1 - d)
                e += 2.0 * abs(pel[a, 1] - pel[a + n, 1]) + 0.2 * np.linalg.norm(vel[a] - vel[a + n])
                if spec.get('kind') != 'cycle': e += 0.5 * np.linalg.norm(pel[a, [0, 2]] - pel[a + n, [0, 2]])
                e -= spec.get('prefer_long', 0.002) * n  # longer loops repeat less obviously
                if e < best[0]: best = (e, a, n)
        return best[1], best[2]


def write_glb(path, sk, clips):
    """A skeleton-only glTF with one animation per clip; per-clip metadata in animation.extras."""
    nodes = []
    for k, (nm, p) in enumerate(zip(sk.names, sk.parent)):
        nd = {'name': nm, 'translation': [float(x) for x in sk.offset[k]] if p >= 0 else [float(x) for x in sk.rest[k]]}
        ch = [c for c, pp in enumerate(sk.parent) if pp == k]
        if ch: nd['children'] = ch
        nodes.append(nd)
    blob = bytearray(); views, accs, anims = [], [], []
    def add(arr, typ, minmax=False):
        arr = np.ascontiguousarray(arr, dtype=np.float32); off = len(blob); blob.extend(arr.tobytes())
        while len(blob) % 4: blob.append(0)
        views.append({'buffer': 0, 'byteOffset': off, 'byteLength': arr.nbytes})
        a = {'bufferView': len(views) - 1, 'componentType': 5126, 'count': len(arr), 'type': typ}
        if minmax: a['min'] = [float(arr.min())]; a['max'] = [float(arr.max())]
        accs.append(a); return len(accs) - 1
    for name, c in clips.items():
        n = len(c['q']); times = np.arange(n) / c['fps']
        ti = add(times, 'SCALAR', True)
        samplers, channels = [], []
        for j, nm in enumerate(sk.names):
            q = c['q'][:, j]
            if np.all(np.abs(q - q[0]).max(0) < 1e-5) and nm != 'pelvis':
                # constant: still keyed (two samples) so a clip fully defines the pose
                samplers.append({'input': add(times[[0, -1]] if n > 1 else times, 'SCALAR', True), 'output': add(q[[0, -1]] if n > 1 else q, 'VEC4'), 'interpolation': 'LINEAR'})
            else:
                samplers.append({'input': ti, 'output': add(q, 'VEC4'), 'interpolation': 'LINEAR'})
            channels.append({'sampler': len(samplers) - 1, 'target': {'node': j, 'path': 'rotation'}})
        samplers.append({'input': ti, 'output': add(c['pel'], 'VEC3'), 'interpolation': 'LINEAR'})
        channels.append({'sampler': len(samplers) - 1, 'target': {'node': sk.idx['pelvis'], 'path': 'translation'}})
        anims.append({'name': name, 'samplers': samplers, 'channels': channels,
                      'extras': {k: c[k] for k in ('fps', 'speed', 'loop', 'contacts', 'kind', 'src', 'desc', 'stride', 'duration')}})
    gl = {'asset': {'version': '2.0', 'generator': 'better-videos engine/people/build/retarget.py'},
          'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': nodes, 'animations': anims,
          'buffers': [{'byteLength': len(blob)}], 'bufferViews': views, 'accessors': accs,
          'extras': {'skeleton': 'mpfb-game_engine', 'convention': 'identity-rest, Y up, +Z forward',
                     'legLength': float(sk.chain_len(['thigh_l', 'calf_l', 'foot_l'])),
                     'source': 'CMU Graphics Lab Motion Capture Database (mocap.cs.cmu.edu), BVH conversion by B. Hahne (cgspeed)'}}
    js = json.dumps(gl, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
    open(path, 'wb').write(out)


if __name__ == '__main__':
    ref, bvhdir, outp = sys.argv[1:4]
    only = sys.argv[4].split(',') if len(sys.argv) > 4 else None
    rt = Retargeter(ref); res = {}
    for name, spec in CLIPS.items():
        if only and name not in only: continue
        c = rt.build(spec, bvhdir)
        dur = len(c['q']) / c['fps']
        c.update(kind=spec.get('kind', 'idle'), src=f"CMU {spec['src']}" + (f" + {spec['upper']['src']}" if 'upper' in spec else ''),
                 desc=spec.get('desc', ''), duration=dur, stride=c['speed'] * dur)
        res[name] = c
        print(f"[clip] {name:16s} {dur:5.2f}s speed {c['speed']:.2f} m/s  L {c['contacts']['l'].count('1')}/{len(c['q'])}  R {c['contacts']['r'].count('1')}")
    write_glb(outp, rt.sk, res)
    print('[glb]', outp, os.path.getsize(outp))
