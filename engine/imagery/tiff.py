"""Minimal GeoTIFF / COG reader (pure Python + numpy + zlib). No GDAL needed.

Supports what the bakers need: little/big-endian classic TIFF and BigTIFF, strips or tiles,
compression none (1), deflate (8, 32946) and LZW (5), horizontal predictor (2) and the floating
point predictor (3), chunky (interleaved) samples of uint8/uint16/int16/float32. Reads either a local
file or an http(s) URL with Range requests, so a cloud-optimised GeoTIFF window costs only the
tiles it touches. Geo-keys: ModelPixelScale + ModelTiepoint (north-up rasters) and the EPSG code.
"""
import struct, zlib, urllib.request, numpy as np

TYPES = {1: ('B', 1), 2: ('c', 1), 3: ('H', 2), 4: ('I', 4), 5: ('II', 8), 6: ('b', 1), 7: ('B', 1), 8: ('h', 2),
         9: ('i', 4), 10: ('ii', 8), 11: ('f', 4), 12: ('d', 8), 16: ('Q', 8), 17: ('q', 8), 18: ('Q', 8)}


class Source:
    def __init__(self, src):
        self.src = src; self.remote = src.startswith('http'); self.cache = {}
        if not self.remote: self.f = open(src, 'rb')
        self.head = self.read(0, 65536)

    def read(self, off, n):
        if not self.remote:
            self.f.seek(off); return self.f.read(n)
        if hasattr(self, 'head') and off + n <= len(self.head): return self.head[off:off + n]
        req = urllib.request.Request(self.src, headers={'Range': f'bytes={off}-{off + n - 1}', 'User-Agent': 'better-videos-imagery/1'})
        for k in range(4):
            try:
                with urllib.request.urlopen(req, timeout=120) as r: return r.read()
            except Exception as e:
                if k == 3: raise
                print('[tiff] retry', e, flush=True)


def lzw_decode(data):
    out = bytearray(); tab = [bytes([i]) for i in range(256)] + [b'', b'']; bits = 9; pos = 0; prev = None; n = len(data) * 8
    while pos + bits <= n:
        i = pos >> 3; chunk = int.from_bytes(data[i:i + 4].ljust(4, b'\0'), 'big'); code = (chunk >> (32 - (pos & 7) - bits)) & ((1 << bits) - 1); pos += bits
        if code == 256: tab = tab[:258]; bits = 9; prev = None; continue
        if code == 257: break
        if prev is None: e = tab[code]; out += e; prev = e; continue
        e = tab[code] if code < len(tab) else prev + prev[:1]
        out += e; tab.append(prev + e[:1]); prev = e
        if len(tab) + 1 >= (1 << bits) and bits < 12: bits += 1
    return bytes(out)


class Tiff:
    def __init__(self, src):
        s = self.s = Source(src); h = s.head
        self.e = '<' if h[:2] == b'II' else '>'
        magic = struct.unpack(self.e + 'H', h[2:4])[0]
        self.big = magic == 43
        off = struct.unpack(self.e + 'Q', h[8:16])[0] if self.big else struct.unpack(self.e + 'I', h[4:8])[0]
        self.ifds = []
        while off and len(self.ifds) < 32:
            ifd, off = self._ifd(off); self.ifds.append(ifd)
        self.ifds = [i for i in self.ifds if not (i.get(254, 0) & 4)]  # drop masks

    def _ifd(self, off):
        e, s = self.e, self.s
        if self.big:
            n = struct.unpack(e + 'Q', s.read(off, 8))[0]; raw = s.read(off + 8, n * 20 + 8); esz, cnt_fmt, vsz = 20, 'Q', 8
        else:
            n = struct.unpack(e + 'H', s.read(off, 2))[0]; raw = s.read(off + 2, n * 12 + 4); esz, cnt_fmt, vsz = 12, 'I', 4
        tags = {}
        for i in range(n):
            b = raw[i * esz:(i + 1) * esz]
            tag, typ = struct.unpack(e + 'HH', b[:4]); cnt = struct.unpack(e + cnt_fmt, b[4:4 + vsz])[0]
            fmt, sz = TYPES.get(typ, ('B', 1)); total = sz * cnt; val = b[4 + vsz:]
            if total > vsz: val = s.read(struct.unpack(e + cnt_fmt, val)[0], total)
            if typ == 2: tags[tag] = val[:total].rstrip(b'\0').decode('latin1'); continue
            k = len(fmt); vals = struct.unpack(e + fmt[0] * (cnt * k), val[:total])
            tags[tag] = vals[0] if cnt * k == 1 else list(vals)
        nxt = struct.unpack(e + cnt_fmt, raw[n * esz:n * esz + vsz])[0]
        return tags, nxt

    def info(self, level=0):
        t = self.ifds[level]
        bps = t.get(258, 8); bps = bps[0] if isinstance(bps, list) else bps
        fmt = t.get(339, 1); fmt = fmt[0] if isinstance(fmt, list) else fmt
        dt = {(8, 1): np.uint8, (16, 1): np.uint16, (16, 2): np.int16, (32, 1): np.uint32, (32, 2): np.int32, (32, 3): np.float32, (64, 3): np.float64}[(bps, fmt)]
        return dict(w=t[256], h=t[257], spp=t.get(277, 1), dtype=np.dtype(dt).newbyteorder(self.e), comp=t.get(259, 1), pred=t.get(317, 1),
                    tw=t.get(322), th=t.get(323), rps=t.get(278, t[257]), offs=t.get(324, t.get(273)), cnts=t.get(325, t.get(279)), planar=t.get(284, 1))

    def geo(self):
        t = self.ifds[0]; sc = t.get(33550); tp = t.get(33922); epsg = None
        gk = t.get(34735)
        if gk:
            for i in range(4, len(gk), 4):
                if gk[i] in (3072, 2048) and gk[i + 1] == 0: epsg = gk[i + 3] if gk[i] == 3072 else (epsg or gk[i + 3])
        nodata = t.get(42113)
        return dict(sx=sc[0], sy=sc[1], x0=tp[3] - tp[0] * sc[0], y0=tp[4] + tp[1] * sc[1], epsg=epsg, nodata=float(nodata) if nodata not in (None, '') else None)

    def _decode(self, I, raw, w, h):
        c = I['comp']
        if c in (8, 32946): raw = zlib.decompress(raw)
        elif c == 5: raw = lzw_decode(raw)
        elif c != 1: raise ValueError(f'unsupported TIFF compression {c}')
        spp, dt = I['spp'], I['dtype']
        if I['pred'] == 3:  # floating point predictor: byte-shuffled, horizontally differenced bytes
            nb = dt.itemsize; a = np.frombuffer(raw, np.uint8)[:w * h * spp * nb].reshape(h, w * spp * nb).copy()
            for x in range(1, a.shape[1]): a[:, x] += a[:, x - 1]
            a = a.reshape(h, nb, w * spp).transpose(0, 2, 1)
            a = a[..., ::-1] if True else a  # stored big-endian byte order
            return np.ascontiguousarray(a).view(np.dtype(dt.str[1:]).newbyteorder('<')).reshape(h, w, spp)
        a = np.frombuffer(raw, dt)[:w * h * spp].reshape(h, w, spp).astype(dt.newbyteorder('='))
        if I['pred'] == 2: a = np.cumsum(a, axis=1, dtype=a.dtype)
        return a

    def window(self, x0, y0, x1, y1, level=0):
        """Pixels [y0:y1, x0:x1] of an overview level as (h, w, spp), clipped to the image (outside = 0)."""
        I = self.info(level); W, H = I['w'], I['h']
        out = np.zeros((y1 - y0, x1 - x0, I['spp']), I['dtype'].newbyteorder('='))
        if I['tw']:
            tw, th = I['tw'], I['th']; nx = (W + tw - 1) // tw
            for ty in range(max(0, y0 // th), min((H - 1) // th, (y1 - 1) // th) + 1):
                for tx in range(max(0, x0 // tw), min((W - 1) // tw, (x1 - 1) // tw) + 1):
                    i = ty * nx + tx; n = I['cnts'][i] if isinstance(I['cnts'], list) else I['cnts']
                    if not n: continue
                    off = I['offs'][i] if isinstance(I['offs'], list) else I['offs']
                    a = self._decode(I, self.s.read(off, n), tw, th)
                    ax0, ay0 = tx * tw, ty * th
                    sx0, sy0 = max(x0, ax0), max(y0, ay0); sx1, sy1 = min(x1, ax0 + tw, W), min(y1, ay0 + th, H)
                    if sx1 > sx0 and sy1 > sy0: out[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = a[sy0 - ay0:sy1 - ay0, sx0 - ax0:sx1 - ax0]
        else:
            rps = I['rps']; offs = I['offs'] if isinstance(I['offs'], list) else [I['offs']]; cnts = I['cnts'] if isinstance(I['cnts'], list) else [I['cnts']]
            for si in range(max(0, y0 // rps), min(len(offs) - 1, (y1 - 1) // rps) + 1):
                rh = min(rps, H - si * rps); a = self._decode(I, self.s.read(offs[si], cnts[si]), W, rh)
                ay0 = si * rps; sy0, sy1 = max(y0, ay0), min(y1, ay0 + rh); sx0, sx1 = max(0, x0), min(W, x1)
                if sy1 > sy0 and sx1 > sx0: out[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = a[sy0 - ay0:sy1 - ay0, sx0:sx1]
        return out

    def read(self, level=0):
        I = self.info(level); return self.window(0, 0, I['w'], I['h'], level)
