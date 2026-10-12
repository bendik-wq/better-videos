# Target skeleton (MPFB "game_engine" rig, UE4-mannequin names) read from a built character GLB.
# Convention used by engine/people: every bone's REST rotation is identity in the character frame
# (Y up, facing +Z, origin between the feet). Clip quaternions are local rotations in that
# convention, so they transfer between bodies of any proportion with the same bone names.
import json, struct
import numpy as np
from qmath import q2m


def read_glb(path):
    b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n]); binstart = 20 + n + 8
    return j, b[binstart:]


class Skeleton:
    def __init__(self, glb):
        j, _ = read_glb(glb)
        nodes = j['nodes']; skin = j['skins'][0]
        joints = skin['joints']; jset = set(joints)
        parent = {}
        for i, nd in enumerate(nodes):
            for c in nd.get('children', []): parent[c] = i
        # world matrices from the scene root down
        W = {}
        def world(i):
            if i in W: return W[i]
            nd = nodes[i]; M = np.eye(4)
            if 'matrix' in nd: M = np.array(nd['matrix']).reshape(4, 4).T
            else:
                R = q2m(nd.get('rotation', [0, 0, 0, 1])); S = np.diag(nd.get('scale', [1, 1, 1]))
                M[:3, :3] = R @ S; M[:3, 3] = nd.get('translation', [0, 0, 0])
            W[i] = (world(parent[i]) @ M) if i in parent else M
            return W[i]
        order = []
        def visit(i):
            if i in jset: order.append(i)
            for c in nodes[i].get('children', []): visit(c)
        for r in j['scenes'][0]['nodes']: visit(r)
        self.names = [nodes[i]['name'] for i in order]
        self.idx = {n: k for k, n in enumerate(self.names)}
        self.parent = []
        for i in order:
            p = parent.get(i)
            while p is not None and p not in jset: p = parent.get(p)
            self.parent.append(self.idx[nodes[p]['name']] if p is not None else -1)
        self.rest = np.array([world(i)[:3, 3] for i in order])  # world rest joint positions
        self.offset = np.array([self.rest[k] - (self.rest[p] if p >= 0 else 0) for k, p in enumerate(self.parent)])

    def fk(self, Rw, trans):
        """Joint positions from world rotations (F,J,3,3); trans = {joint index: (F,3) world position}
        for translated joints (the pelvis). Identity-rest convention: child = parent + R_parent @ offset."""
        F, J = Rw.shape[:2]; P = np.zeros((F, J, 3))
        for k, p in enumerate(self.parent):
            if k in trans: P[:, k] = trans[k]
            elif p < 0: P[:, k] = self.rest[k]
            else: P[:, k] = P[:, p] + np.einsum('fij,j->fi', Rw[:, p], self.offset[k])
        return P

    def chain_len(self, names):
        return sum(np.linalg.norm(self.rest[self.idx[b]] - self.rest[self.idx[a]]) for a, b in zip(names, names[1:]))
