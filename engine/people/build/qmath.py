# Small rotation toolkit (numpy). Quaternions are [x, y, z, w] like glTF / three.js.
import numpy as np


def q2m(q):
    q = np.asarray(q, float); x, y, z, w = np.moveaxis(q, -1, 0)
    M = np.empty(q.shape[:-1] + (3, 3))
    M[..., 0, 0] = 1 - 2 * (y * y + z * z); M[..., 0, 1] = 2 * (x * y - z * w); M[..., 0, 2] = 2 * (x * z + y * w)
    M[..., 1, 0] = 2 * (x * y + z * w); M[..., 1, 1] = 1 - 2 * (x * x + z * z); M[..., 1, 2] = 2 * (y * z - x * w)
    M[..., 2, 0] = 2 * (x * z - y * w); M[..., 2, 1] = 2 * (y * z + x * w); M[..., 2, 2] = 1 - 2 * (x * x + y * y)
    return M


def m2q(M):
    M = np.asarray(M, float); sh = M.shape[:-2]; M = M.reshape(-1, 3, 3); out = np.empty((len(M), 4))
    for i, m in enumerate(M):
        t = np.trace(m)
        if t > 0:
            s = np.sqrt(t + 1) * 2; out[i] = [(m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s, 0.25 * s]
        elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
            s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; out[i] = [0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s, (m[2, 1] - m[1, 2]) / s]
        elif m[1, 1] > m[2, 2]:
            s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; out[i] = [(m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s, (m[0, 2] - m[2, 0]) / s]
        else:
            s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; out[i] = [(m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s, (m[1, 0] - m[0, 1]) / s]
    out /= np.linalg.norm(out, axis=1, keepdims=True)
    return out.reshape(sh + (4,))


def qmul(a, b):
    ax, ay, az, aw = np.moveaxis(a, -1, 0); bx, by, bz, bw = np.moveaxis(b, -1, 0)
    return np.stack([aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx,
                     aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz], -1)


def qinv(q):
    return q * np.array([-1, -1, -1, 1])


def axis_angle(axis, ang):
    axis = np.asarray(axis, float); axis = axis / (np.linalg.norm(axis) + 1e-12)
    return np.concatenate([axis * np.sin(ang / 2), [np.cos(ang / 2)]])


def min_arc(a, b):
    """Rotation matrix taking unit vector a onto unit vector b (shortest arc)."""
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b); v = np.cross(a, b); c = np.dot(a, b)
    if c < -0.999999:
        ax = np.cross(a, [1, 0, 0]);
        if np.linalg.norm(ax) < 1e-6: ax = np.cross(a, [0, 1, 0])
        return q2m(axis_angle(ax, np.pi))
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + K + K @ K / (1 + c)


def rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def continuous(q):
    """Flip quaternion signs along axis 0 so consecutive samples stay in one hemisphere."""
    q = q.copy()
    for i in range(1, len(q)):
        d = np.sum(q[i] * q[i - 1], -1)
        q[i][d < 0] *= -1
    return q


def slerp(a, b, t):
    """Per-element slerp of quaternion arrays (..., 4) with weight t (broadcast)."""
    d = np.sum(a * b, -1, keepdims=True); b = np.where(d < 0, -b, b); d = np.abs(d)
    t = np.asarray(t, float)[..., None] if np.ndim(t) else t
    th = np.arccos(np.clip(d, -1, 1)); s = np.sin(th)
    small = s < 1e-6
    wa = np.where(small, 1 - t, np.sin((1 - t) * th) / np.where(small, 1, s))
    wb = np.where(small, t, np.sin(t * th) / np.where(small, 1, s))
    r = wa * a + wb * b
    return r / np.linalg.norm(r, axis=-1, keepdims=True)
