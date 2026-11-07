import sys
import os
import json
import subprocess
import math
import bisect
import numpy as np
import cv2

def resolve(base, p):
    if p is None:
        return None
    if os.path.isabs(p):
        return p
    a = os.path.join(base, 'assets', p)
    return a if os.path.exists(a) else os.path.join(base, p)

def get_key(d, loc):
    if loc in d:
        return d[loc]
    if str(loc) in d:
        return d[str(loc)]
    return None

def parse_M(M):
    if M is None:
        return None
    arr = np.array(M, dtype=np.float32)
    if arr.shape == (2, 3):
        return arr
    if arr.shape == (3, 3):
        return arr[:2, :]
    return None

def draw_text(img, text, org, font_scale=0.45, color=(255, 255, 255), thickness=1):
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, font_scale,
                (0, 0, 0), thickness + 2, cv2.LINE_AA)
    cv2.putText(img, text, org, cv2.FONT_HERSHEY_SIMPLEX, font_scale,
                color, thickness, cv2.LINE_AA)

class VideoReader:
    def __init__(self, path, w, h):
        self.w = w
        self.h = h
        self.bytes = w * h * 3
        cmd = ['ffmpeg', '-v', 'error', '-nostdin', '-i', path,
               '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-']
        self.proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    def read(self):
        data = self.proc.stdout.read(self.bytes)
        if not data or len(data) < self.bytes:
            return None
        return np.frombuffer(data, np.uint8).reshape((self.h, self.w, 3)).copy()

    def close(self):
        try:
            self.proc.stdout.close()
            self.proc.stderr.close()
            self.proc.wait(timeout=1)
        except Exception:
            pass

def find_shot(shots, gf):
    if not shots:
        return None
    starts = [s['start'] for s in shots]
    idx = bisect.bisect_right(starts, gf) - 1
    if idx < 0:
        return None
    shot = shots[idx]
    if shot['start'] <= gf < shot['end']:
        return shot
    return None

def get_camera(shot, loc):
    cam = shot.get('camera', [])
    if isinstance(cam, list) and loc < len(cam):
        c = cam[loc]
        if c is not None and len(c) >= 2:
            return float(c[0]), float(c[1])
    return 0.0, 0.0

def resolve_pose_path(out_dir, layer, pose_val):
    poses = layer.get('poses', [])
    name = None
    if isinstance(pose_val, int):
        if 0 <= pose_val < len(poses):
            name = poses[pose_val]
        else:
            name = str(pose_val)
    elif isinstance(pose_val, str):
        if pose_val in poses:
            name = pose_val
        elif pose_val.isdigit() and int(pose_val) < len(poses):
            name = poses[int(pose_val)]
        else:
            name = pose_val
    else:
        name = str(pose_val)
    return resolve(out_dir, name)

pose_cache = {}
def get_pose_image(path):
    if path not in pose_cache:
        img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
        if img is None:
            pose_cache[path] = None
        else:
            if img.ndim == 2:
                img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGRA)
            elif img.shape[2] == 3:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
            # else assume BGRA
            pose_cache[path] = img
    return pose_cache[path]

def load_plate(path, W, H):
    if path is None:
        return np.zeros((H, W, 3), np.uint8)
    img = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if img is None:
        return np.zeros((H, W, 3), np.uint8)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_BGRA2BGR)
    return img

def active_tweens_for(shot, loc):
    out = []
    for layer in shot.get('layers', []):
        fits = layer.get('fits', {})
        if not isinstance(fits, dict):
            continue
        lid = layer.get('id', '?')
        for prop, intervals in fits.items():
            if not isinstance(intervals, list):
                continue
            for fit in intervals:
                if not isinstance(fit, dict):
                    continue
                f0 = fit.get('f0', 0)
                f1 = fit.get('f1', 0)
                if f0 <= loc <= f1:
                    ease = fit.get('ease', '')
                    out.append((lid, prop, ease, f0, f1))
    return out

PALETTE = [
    (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0),
    (255, 0, 255), (0, 255, 255), (128, 0, 0), (0, 128, 0),
    (0, 0, 128), (128, 128, 0), (128, 0, 128), (0, 128, 128),
    (255, 128, 0), (128, 255, 0), (0, 128, 255), (255, 0, 128)
]
layer_colors = {}
def get_color(layer_id):
    if layer_id not in layer_colors:
        layer_colors[layer_id] = PALETTE[len(layer_colors) % len(PALETTE)]
    return layer_colors[layer_id]

def transform_points(points, M):
    pts = np.hstack([points, np.ones((len(points), 1), dtype=np.float32)])
    return (M @ pts.T).T

def build_panel3(out_dir, shot, dx, dy, layers_meta, tweens, W, H, panel_w, panel_h):
    base = np.zeros((H, W, 3), np.uint8)
    plate_path = resolve(out_dir, shot.get('plate'))
    plate = load_plate(plate_path, W, H)
    origin = shot.get('origin', [0, 0])
    x0 = float(origin[0])
    y0 = float(origin[1])
    M_plate = np.float32([[1, 0, -(x0 + dx)],
                          [0, 1, -(y0 + dy)]])
    plate_view = cv2.warpAffine(plate, M_plate, (W, H), borderMode=cv2.BORDER_REPLICATE)
    plate_view = (plate_view.astype(np.float32) * 0.45).astype(np.uint8)
    base = plate_view.copy()

    overlays = []
    for meta in layers_meta:
        pose_path = meta['pose_path']
        img = get_pose_image(pose_path)
        if img is None:
            continue
        M = meta['M']
        warped = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
        alpha = warped[:, :, 3:4].astype(np.float32) / 255.0
        base = base.astype(np.float32) * (1.0 - alpha) + warped[:, :, :3].astype(np.float32) * alpha
        base = np.clip(base, 0, 255).astype(np.uint8)

        h_img, w_img = img.shape[:2]
        corners = np.float32([[0, 0], [w_img, 0], [w_img, h_img], [0, h_img]])
        pts = transform_points(corners, M)
        overlays.append((pts, meta['color'], meta['label']))

    panel = cv2.resize(base, (panel_w, panel_h), interpolation=cv2.INTER_AREA)
    sx = panel_w / W
    sy = panel_h / H
    for pts, color, label in overlays:
        pts_panel = (pts * np.array([sx, sy])).astype(np.int32)
        cv2.polylines(panel, [pts_panel], True, color, 2, cv2.LINE_AA)
        minx = int(pts_panel[:, 0].min())
        miny = int(pts_panel[:, 1].min())
        org = (max(0, minx), max(14, miny - 5))
        draw_text(panel, label, org, 0.4, color, 1)

    lines = []
    if abs(dx) > 1e-6 or abs(dy) > 1e-6:
        lines.append(f"camera dx={dx:.2f} dy={dy:.2f}")
    if tweens:
        tween_str = " | ".join(
            f"{lid} {prop} {ease} f{int(float(f0))}-{int(float(f1))}"
            for lid, prop, ease, f0, f1 in tweens
        )
        lines.append(tween_str)

    y = panel_h - 10
    for line in reversed(lines):
        draw_text(panel, line, (4, y), 0.4, (255, 255, 255), 1)
        y -= 18
    return panel

def build_panel4(orig, edited_frame, trace_points, panel_w, panel_h, W, H):
    if edited_frame is not None:
        return cv2.resize(edited_frame, (panel_w, panel_h), interpolation=cv2.INTER_AREA)

    base = (orig.astype(np.float32) * 0.4).clip(0, 255).astype(np.uint8)
    panel = cv2.resize(base, (panel_w, panel_h), interpolation=cv2.INTER_AREA)
    sx = panel_w / W
    sy = panel_h / H
    for lid, pts in trace_points.items():
        if not pts:
            continue
        color = get_color(lid)
        pts_panel = np.array([[int(round(x * sx)), int(round(y * sy))] for _, x, y in pts], np.int32)
        if len(pts_panel) > 1:
            cv2.polylines(panel, [pts_panel], False, color, 2, cv2.LINE_AA)
        if len(pts_panel) >= 1:
            cv2.circle(panel, tuple(pts_panel[-1]), 5, color, -1, cv2.LINE_AA)
    return panel

def lugar_panel(canvas, x, y, panel_w, panel_h, label_h, panel_img, label):
    canvas[y:y + label_h, x:x + panel_w] = 17
    draw_text(canvas, label, (x + 4, y + 18), 0.55, (255, 255, 255), 1)
    canvas[y + label_h:y + label_h + panel_h, x:x + panel_w] = panel_img

def main():
    args = sys.argv[1:]
    if len(args) < 2:
        raise SystemExit("usage: demo.py <out_dir> <demo.mp4> [--edited path.mp4]")
    out_dir = args[0]
    output_path = args[1]
    edited_path = None
    if '--edited' in args[2:]:
        i = args.index('--edited')
        if i + 1 < len(args):
            edited_path = args[i + 1]

    scene_path = os.path.join(out_dir, 'scene.json')
    with open(scene_path, 'r') as f:
        scene = json.load(f)

    W = int(scene['width'])
    H = int(scene['height'])
    fps = float(scene.get('fps', 30))
    total_frames = int(scene.get('frames', 0))
    source_path = resolve(out_dir, scene.get('source'))
    model_path = resolve(out_dir, 'model.mp4')
    edited_path = (edited_path if os.path.exists(edited_path) else resolve(out_dir, edited_path)) if edited_path else None

    orig_reader = VideoReader(source_path, W, H)
    model_reader = VideoReader(model_path, W, H)
    edited_reader = VideoReader(edited_path, W, H) if edited_path else None

    OUT_W = 1280
    GUTTER = 8
    LABEL_H = 26
    PANEL_W = (OUT_W - 3 * GUTTER) // 2
    panel_h = max(2, int(round(PANEL_W * H / W / 2.0) * 2))
    OUT_H = 2 * LABEL_H + 2 * panel_h + 3 * GUTTER

    x0 = GUTTER
    x1 = GUTTER * 2 + PANEL_W
    y0 = GUTTER
    y1 = GUTTER * 2 + LABEL_H + panel_h

    os.makedirs(os.path.dirname(os.path.abspath(output_path)) or '.', exist_ok=True)

    cmd = [
        'ffmpeg', '-y', '-v', 'error', '-nostdin',
        '-f', 'rawvideo', '-pix_fmt', 'bgr24',
        '-video_size', f'{OUT_W}x{OUT_H}', '-framerate', str(fps), '-i', '-',
        '-i', source_path,
        '-map', '0:v', '-map', '1:a?',
        '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        '-shortest', '-r', str(fps),
        output_path
    ]
    writer = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    trace_points = {}

    for gf in range(total_frames):
        orig = orig_reader.read()
        if orig is None:
            break
        model = model_reader.read()
        if model is None:
            break
        edited_frame = None
        if edited_reader is not None:
            edited_frame = edited_reader.read()

        shot = find_shot(scene.get('shots', []), gf)
        if shot is None:
            loc = 0
            dx = dy = 0.0
            layers_meta = []
            tweens = []
        else:
            loc = gf - shot['start']
            dx, dy = get_camera(shot, loc)
            layers_meta = []
            for layer in shot.get('layers', []):
                entry = get_key(layer.get('frames', {}), loc)
                if entry is None:
                    continue
                M = parse_M(entry.get('M'))
                if M is None:
                    continue
                pose_val = entry.get('pose')
                pose_path = resolve_pose_path(out_dir, layer, pose_val)
                lid = layer.get('id', '?')
                layers_meta.append({
                    'layer': layer,
                    'entry': entry,
                    'M': M,
                    'pose_path': pose_path,
                    'label': f"{lid} pose {pose_val}",
                    'color': get_color(lid)
                })

            # update trace for current frame
            for meta in layers_meta:
                img = get_pose_image(meta['pose_path'])
                if img is None:
                    continue
                h_img, w_img = img.shape[:2]
                pt = meta['M'] @ np.float32([w_img / 2.0, h_img / 2.0, 1.0])
                lid = meta['layer'].get('id', '?')
                trace_points.setdefault(lid, []).append((gf, float(pt[0]), float(pt[1])))

            tweens = active_tweens_for(shot, loc)

        panel1 = cv2.resize(orig, (PANEL_W, panel_h), interpolation=cv2.INTER_AREA)

        panel2 = cv2.resize(model, (PANEL_W, panel_h), interpolation=cv2.INTER_AREA)
        mse = float(np.mean((orig.astype(np.float32) - model.astype(np.float32)) ** 2))
        if mse == 0:
            psnr_text = "PSNR inf dB"
        else:
            psnr = 10.0 * math.log10(255.0 ** 2 / mse)
            psnr_text = f"PSNR {psnr:.1f} dB"
        (tw, th), _ = cv2.getTextSize(psnr_text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        draw_text(panel2, psnr_text, (PANEL_W - tw - 4, 18), 0.5, (255, 255, 255), 1)

        panel3 = build_panel3(out_dir, shot if shot is not None else {'plate': None, 'origin': [0, 0]},
                              dx, dy, layers_meta, tweens, W, H, PANEL_W, panel_h)

        panel4 = build_panel4(orig, edited_frame, trace_points, PANEL_W, panel_h, W, H)

        canvas = np.full((OUT_H, OUT_W, 3), 17, np.uint8)
        lugar_panel(canvas, x0, y0, PANEL_W, panel_h, LABEL_H, panel1, 'ORIGINAL')
        lugar_panel(canvas, x1, y0, PANEL_W, panel_h, LABEL_H, panel2, 'REBUILT FROM LAYERS')
        lugar_panel(canvas, x0, y1, PANEL_W, panel_h, LABEL_H, panel3, 'WHAT IT FOUND')
        if edited_frame is not None:
            label4 = 'EDITED'
        else:
            label4 = 'MOTION TRACE'
        lugar_panel(canvas, x1, y1, PANEL_W, panel_h, LABEL_H, panel4, label4)

        writer.stdin.write(canvas.tobytes())

    writer.stdin.close()
    writer.wait()
    orig_reader.close()
    model_reader.close()
    if edited_reader is not None:
        edited_reader.close()

    print(output_path)

if __name__ == '__main__':
    main()