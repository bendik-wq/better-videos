# GLB texture packer for built characters (numpy + Pillow; run with python3 -I).
#   python3 -I engine/people/build/pack.py in.glb out.glb [--max 1024]
# 1. Bleeds every base-colour texture outward from its UV islands (push-pull fill), so mip-mapping
#    never pulls the white page around an island into the garment: no bright "seams" on edges.
# 2. Re-encodes opaque textures as JPEG (alpha ones stay PNG), capped at --max px.
import sys, json, struct, io
import numpy as np
from PIL import Image, ImageDraw

def read(path):
    b = open(path, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n]); o = 20 + n; m = struct.unpack('<I', b[o:o + 4])[0]
    return j, bytearray(b[o + 8:o + 8 + m])

def write(path, j, blob):
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    while len(blob) % 4: blob += b'\0'
    j['buffers'][0]['byteLength'] = len(blob)
    js = json.dumps(j, separators=(',', ':')).encode()
    while len(js) % 4: js += b' '
    out = struct.pack('<III', 0x46546C67, 2, 28 + len(js) + len(blob)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(blob), 0x004E4942) + bytes(blob)
    open(path, 'wb').write(out)

def accessor(j, blob, i):
    a = j['accessors'][i]; v = j['bufferViews'][a['bufferView']]
    comp = {5126: np.float32, 5125: np.uint32, 5123: np.uint16, 5121: np.uint8}[a['componentType']]
    n = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0); stride = v.get('byteStride', 0)
    if stride and stride != n * np.dtype(comp).itemsize:
        raw = np.frombuffer(bytes(blob[off:off + stride * a['count']]), np.uint8).reshape(a['count'], stride)[:, :n * np.dtype(comp).itemsize]
        return np.frombuffer(raw.tobytes(), comp).reshape(a['count'], n)
    return np.frombuffer(bytes(blob[off:off + a['count'] * n * np.dtype(comp).itemsize]), comp).reshape(a['count'], n)

def pushpull(rgb, mask):
    """Fill pixels where mask==0 from covered neighbours, coarse to fine."""
    levels = [(rgb * mask[..., None], mask.astype(np.float32))]
    while min(levels[-1][1].shape) > 1:
        c, w = levels[-1]; h2, w2 = c.shape[0] // 2, c.shape[1] // 2
        c = c[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2, 3).sum((1, 3)); w = w[:h2 * 2, :w2 * 2].reshape(h2, 2, w2, 2).sum((1, 3))
        levels.append((c, w))
    c, w = levels[-1]; fill = c / np.maximum(w, 1e-6)[..., None]
    for c, w in levels[-2::-1]:
        up = np.repeat(np.repeat(fill, 2, 0), 2, 1)
        up = np.pad(up, ((0, c.shape[0] - up.shape[0]), (0, c.shape[1] - up.shape[1]), (0, 0)), mode='edge')
        avg = c / np.maximum(w, 1e-6)[..., None]; k = np.clip(w, 0, 1)[..., None]
        fill = avg * k + up * (1 - k)
    return fill

# Per-garment texture repairs: (x0, y0, x1, y1) in UV-space fractions (y down, image space) to
# repaint with the garment's dominant colour. male_elegantsuit01 packs white shirt-cuff islands
# right against the sleeve islands; at our scale they bleed onto the shoulders as white flecks.
FIXES = {'male_elegantsuit01': [(0.305, 0.17, 0.385, 0.5)]}

def main(src, dst, cap=1024):
    j, blob = read(src)
    tex_uses = {}  # image index -> list of (positions-uv accessor, indices accessor)
    for mesh in j['meshes']:
        for p in mesh['primitives']:
            mat = j['materials'][p['material']]; bc = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
            if bc is None or 'TEXCOORD_0' not in p['attributes']: continue
            img = j['textures'][bc['index']]['source']
            tex_uses.setdefault(img, []).append((p['attributes']['TEXCOORD_0'], p.get('indices')))
    # images whose alpha is real (hair cards, brows, lashes); everything else is opaque cloth/skin
    alpha_imgs = set(); small_imgs = set()
    for mat in j['materials']:
        bc = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
        if bc is None: continue
        img = j['textures'][bc['index']]['source']; nm = mat.get('name', '').lower()
        if any(k in nm for k in ('hair', 'eyebrow', 'eyelash', 'short0', 'bob0', 'long0', 'ponytail', 'afro', 'braid')): alpha_imgs.add(img); small_imgs.add(img)
        if nm in ('human.body',) or 'low-poly' in nm or 'shoe' in nm or 'boot' in nm or 'flats' in nm or 'sneaker' in nm: small_imgs.add(img)
    new_imgs = {}
    for ii, im in enumerate(j.get('images', [])):
        v = j['bufferViews'][im['bufferView']]; data = bytes(blob[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']])
        I = Image.open(io.BytesIO(data)); I.load()
        has_alpha = ii in alpha_imgs and I.mode in ('RGBA', 'LA', 'P')
        if not has_alpha and I.mode in ('RGBA', 'LA', 'P'):
            a = np.asarray(I.convert('RGBA')).astype(np.float32); al = a[..., 3:] / 255
            mean = (a[..., :3] * al).sum((0, 1)) / max(al.sum(), 1)
            I = Image.fromarray(np.clip(a[..., :3] * al + mean * (1 - al), 0, 255).astype(np.uint8))
        cap_i = min(cap, 512) if ii in small_imgs else cap
        if max(I.size) > cap_i: I = I.resize((I.size[0] * cap_i // max(I.size), I.size[1] * cap_i // max(I.size)), Image.LANCZOS)
        if ii in tex_uses and not has_alpha:
            W, H = I.size; M = Image.new('L', (W, H), 0); d = ImageDraw.Draw(M)
            for uva, ia in tex_uses[ii]:
                uv = accessor(j, blob, uva); idx = accessor(j, blob, ia).reshape(-1, 3) if ia is not None else np.arange(len(uv)).reshape(-1, 3)
                px = np.stack([uv[:, 0] * W, uv[:, 1] * H], 1)
                for t in idx: d.polygon([tuple(px[k]) for k in t], fill=255, outline=255)
            mask = (np.asarray(M) > 0)
            # grow the mask by 1 px so the island edge itself is trusted
            rgb = np.asarray(I.convert('RGB')).astype(np.float32)
            if mask.mean() > 0.02:
                fill = pushpull(rgb, mask.astype(np.float32))
                rgb = np.where(mask[..., None], rgb, fill)
            for mat in j['materials']:
                bc = mat.get('pbrMetallicRoughness', {}).get('baseColorTexture')
                if bc is None or j['textures'][bc['index']]['source'] != ii: continue
                for key, rects in FIXES.items():
                    if key not in mat.get('name', ''): continue
                    med = np.median(rgb[mask].reshape(-1, 3), axis=0) if mask.any() else rgb.reshape(-1, 3).mean(0)
                    for x0, y0, x1, y1 in rects: rgb[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = med
            I = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
        buf = io.BytesIO()
        if has_alpha: I.save(buf, 'PNG', optimize=True); mt = 'image/png'
        else: I.convert('RGB').save(buf, 'JPEG', quality=86); mt = 'image/jpeg'
        new_imgs[ii] = (buf.getvalue(), mt)
    # rebuild the binary buffer: copy every bufferView, swapping image views
    img_view = {im['bufferView']: ii for ii, im in enumerate(j.get('images', []))}
    out = bytearray()
    for vi, v in enumerate(j['bufferViews']):
        if vi in img_view: data, mt = new_imgs[img_view[vi]]; j['images'][img_view[vi]]['mimeType'] = mt
        else: o = v.get('byteOffset', 0); data = bytes(blob[o:o + v['byteLength']])
        while len(out) % 4: out.append(0)
        v['byteOffset'] = len(out); v['byteLength'] = len(data); out.extend(data)
    write(dst, j, out)
    print('[pack]', src, '->', dst, len(out))

if __name__ == '__main__':
    a = sys.argv[1:]; cap = int(a[a.index('--max') + 1]) if '--max' in a else 1024
    main(a[0], a[1], cap)
