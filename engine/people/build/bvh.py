# BVH parsing + forward kinematics (numpy only). Offline tool for engine/people.
import numpy as np


def rot(axis, deg):
    a = np.radians(deg); c, s = np.cos(a), np.sin(a)
    n = len(a)
    R = np.zeros((n, 3, 3)); R[:, 0, 0] = R[:, 1, 1] = R[:, 2, 2] = 1
    i, j = {'X': (1, 2), 'Y': (2, 0), 'Z': (0, 1)}[axis]
    R[:, i, i] = c; R[:, j, j] = c; R[:, i, j] = -s; R[:, j, i] = s
    return R


class BVH:
    def __init__(self, path):
        tok = open(path).read().split()
        self.names, self.parent, self.offset, self.channels, self.ends = [], [], [], [], {}
        stack, i = [], 0
        while tok[i] != 'MOTION':
            t = tok[i]
            if t in ('ROOT', 'JOINT'):
                self.names.append(tok[i + 1]); self.parent.append(stack[-1] if stack else -1)
                self.offset.append(None); self.channels.append([]); i += 2
            elif t == 'End':
                # End Site: remember its offset as the bone tip of the current joint
                j = stack[-1]; k = tok.index('OFFSET', i)
                self.ends[j] = np.array([float(x) for x in tok[k + 1:k + 4]])
                i = tok.index('}', k) + 1
            elif t == '{':
                stack.append(len(self.names) - 1); i += 1
            elif t == '}':
                stack.pop(); i += 1
            elif t == 'OFFSET':
                self.offset[-1] = np.array([float(x) for x in tok[i + 1:i + 4]]); i += 4
            elif t == 'CHANNELS':
                n = int(tok[i + 1]); self.channels[-1] = tok[i + 2:i + 2 + n]; i += 2 + n
            else:
                i += 1
        n = int(tok[i + 2]); self.dt = float(tok[i + 5])
        vals = np.array(tok[i + 6:], dtype=float)
        nch = sum(len(c) for c in self.channels)
        self.motion = vals[:n * nch].reshape(n, nch)
        self.idx = {n: k for k, n in enumerate(self.names)}

    @property
    def fps(self):
        return 1 / self.dt

    def fk(self, frames=None):
        """World rotations (F,J,3,3) and positions (F,J,3) for the given frame indices."""
        M = self.motion if frames is None else self.motion[frames]
        F, J = len(M), len(self.names)
        Rw = np.zeros((F, J, 3, 3)); Pw = np.zeros((F, J, 3))
        c = 0
        for j in range(J):
            ch = self.channels[j]; R = np.tile(np.eye(3), (F, 1, 1)); pos = np.zeros((F, 3))
            for k, name in enumerate(ch):
                v = M[:, c + k]
                if name.endswith('position'): pos[:, 'XYZ'.index(name[0])] = v
                else: R = R @ rot(name[0], v)
            c += len(ch)
            p = self.parent[j]
            if p < 0:
                Rw[:, j] = R; Pw[:, j] = pos + self.offset[j]
            else:
                Rw[:, j] = Rw[:, p] @ R; Pw[:, j] = Pw[:, p] + np.einsum('fij,j->fi', Rw[:, p], self.offset[j])
        return Rw, Pw
