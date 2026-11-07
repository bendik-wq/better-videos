import os
import sys
import json
import subprocess
import argparse
import math

import numpy as np
import cv2

FPS = 30
W = 640
H = 360


def hex_bgr(h):
    h = h.lstrip('#')
    return (int(h[4:6], 16), int(h[2:4], 16), int(h[0:2], 16))


def ease(name, f, f0, f1, v0, v1):
    if f1 == f0:
        return v1
    t = (f - f0) / (f1 - f0)
    t = max(0.0, min(1.0, t))
    if name == 'linear':
        e = t
    elif name == 'easeInQuad':
        e = t * t
    elif name == 'easeOutCubic':
        e = 1.0 - (1.0 - t) ** 3
    elif name == 'easeInOutCubic':
        if t < 0.5:
            e = 4.0 * t ** 3
        else:
            e = 1.0 - (-2.0 * t + 2.0) ** 3 / 2.0
    elif name == 'easeOutBack':
        s = 1.70158
        u = t - 1.0
        e = 1.0 + (s + 1.0) * u ** 3 + s * u ** 2
    else:
        raise ValueError(name)
    return v0 + (v1 - v0) * e


def to_uint8(frame_f):
    return np.clip(np.round(frame_f), 0, 255).astype(np.uint8)


def rounded_rect_mask(w, h, radius):
    mask = np.zeros((h, w), np.uint8)
    r = max(0, min(int(radius), w // 2, h // 2))
    if r <= 0:
        cv2.rectangle(mask, (0, 0), (w - 1, h - 1), 255, -1)
        return mask
    cv2.rectangle(mask, (r, 0), (w - r - 1, h - 1), 255, -1)
    cv2.rectangle(mask, (0, r), (w - 1, h - r - 1), 255, -1)
    cv2.circle(mask, (r, r), r, 255, -1)
    cv2.circle(mask, (w - r - 1, r), r, 255, -1)
    cv2.circle(mask, (r, h - r - 1), r, 255, -1)
    cv2.circle(mask, (w - r - 1, h - r - 1), r, 255, -1)
    return mask


def rounded_rect_sprite(w, h, radius, fill_bgr, outline_bgr, outline_width):
    sprite = np.zeros((h, w, 4), np.uint8)
    outer = rounded_rect_mask(w, h, radius)
    sprite[outer > 0] = (fill_bgr[0], fill_bgr[1], fill_bgr[2], 255)
    if outline_width > 0:
        inner_w = max(1, w - 2 * outline_width)
        inner_h = max(1, h - 2 * outline_width)
        inner = rounded_rect_mask(inner_w, inner_h, max(0, radius - outline_width))
        inner_full = np.zeros((h, w), np.uint8)
        off = outline_width
        inner_full[off:off + inner_h, off:off + inner_w] = inner
        border = (outer > 0) & (inner_full == 0)
        sprite[border] = (outline_bgr[0], outline_bgr[1], outline_bgr[2], 255)
    return sprite


def composite_bgra(frame_f, sprite, top_left, opacity=1.0):
    x, y = top_left
    h_s, w_s = sprite.shape[:2]
    x0 = max(0, x)
    y0 = max(0, y)
    x1 = min(frame_f.shape[1], x + w_s)
    y1 = min(frame_f.shape[0], y + h_s)
    if x0 >= x1 or y0 >= y1:
        return frame_f
    sx0 = x0 - x
    sy0 = y0 - y
    sx1 = x1 - x
    sy1 = y1 - y
    sprite_region = sprite[sy0:sy1, sx0:sx1].astype(np.float32)
    alpha = sprite_region[..., 3:4] / 255.0 * opacity
    rgb = sprite_region[..., 0:3]
    frame_f[y0:y1, x0:x1] = frame_f[y0:y1, x0:x1] * (1.0 - alpha) + rgb * alpha
    return frame_f


def circle_sprite(size, radius, color_bgr):
    sprite = np.zeros((size, size, 4), np.uint8)
    cv2.circle(sprite, (size // 2, size // 2), int(radius),
               (color_bgr[0], color_bgr[1], color_bgr[2], 255), -1, lineType=cv2.LINE_AA)
    return sprite


def square_sprite(side, color_bgr):
    sprite = np.zeros((side, side, 4), np.uint8)
    cv2.rectangle(sprite, (0, 0), (side - 1, side - 1),
                  (color_bgr[0], color_bgr[1], color_bgr[2], 255), -1)
    return sprite


def triangle_points(cx, cy, side):
    h = side * math.sqrt(3.0) / 2.0
    return [(cx, cy - h * 0.5), (cx - side / 2.0, cy + h * 0.5), (cx + side / 2.0, cy + h * 0.5)]


def star_points(cx, cy, outer_r, inner_r, n=5, rotation=-90.0):
    pts = []
    for i in range(2 * n):
        ang = math.radians(rotation + i * 180.0 / n)
        r = outer_r if i % 2 == 0 else inner_r
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    return pts


def polygon_sprite(w, h, points, color_bgr):
    sprite = np.zeros((h, w, 4), np.uint8)
    pts = np.array(points, np.int32).reshape(-1, 1, 2)
    cv2.fillPoly(sprite, [pts], (color_bgr[0], color_bgr[1], color_bgr[2], 255), lineType=cv2.LINE_AA)
    return sprite


def write_video(path, frames, gt):
    w = gt['width']
    h = gt['height']
    fps = gt['fps']
    cmd = [
        'ffmpeg', '-y', '-v', 'error',
        '-f', 'rawvideo', '-vcodec', 'rawvideo',
        '-s', f'{w}x{h}', '-pix_fmt', 'bgr24', '-r', str(fps),
        '-i', '-',
        '-an', '-c:v', 'libx264', '-crf', '12', '-pix_fmt', 'yuv420p',
        path
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for frame in frames:
        proc.stdin.write(np.ascontiguousarray(frame).tobytes())
    proc.stdin.close()
    ret = proc.wait()
    if ret != 0:
        raise RuntimeError(f'ffmpeg failed for {path}')


def make_slide():
    frames = []
    bg_base = np.array(hex_bgr('#1e6fd9'), np.float32)
    grad = np.linspace(-12, 12, H).astype(np.float32).reshape(H, 1, 1)
    bg_f = np.clip(bg_base + grad, 0, 255)
    bg_f = np.repeat(bg_f, W, axis=1)
    fill = hex_bgr('#ffcc00')
    outline = tuple(int(c * 0.7) for c in fill)
    sprite = rounded_rect_sprite(120, 80, 10, fill, outline, 3)

    for f in range(90):
        x = ease('easeOutCubic', f, 15, 60, 60.0, 460.0)
        frame = bg_f.copy()
        composite_bgra(frame, sprite, (int(round(x)), 140), 1.0)
        frames.append(to_uint8(frame))

    gt = {
        'name': 'slide',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {
            'type': 'flat_with_gradient',
            'color': '#1e6fd9',
            'gradient': 'vertical +-12 levels'
        },
        'elements': [
            {
                'id': 'rect',
                'shape': 'rounded_rectangle',
                'colour': '#ffcc00',
                'size': [120, 80],
                'keyframes': [
                    {'prop': 'x', 'f0': 15, 'f1': 60, 'v0': 60, 'v1': 460, 'easing': 'easeOutCubic'},
                    {'prop': 'y', 'f0': 15, 'f1': 60, 'v0': 140, 'v1': 140, 'easing': 'linear'}
                ],
                'opacity_keyframes': [],
                'notes': 'rounded rect with 3 px darker outline; x/y are top-left'
            }
        ]
    }
    return frames, gt


def make_scale_rot():
    frames = []
    bg_f = np.full((H, W, 3), hex_bgr('#0b1020'), np.float32)
    sprite = np.zeros((200, 200, 4), np.uint8)
    cv2.circle(sprite, (100, 100), 40, (255, 255, 255, 255), -1, lineType=cv2.LINE_AA)
    cv2.circle(sprite, (115, 100), 8, (0, 0, 255, 255), -1, lineType=cv2.LINE_AA)

    for f in range(90):
        opacity = ease('linear', f, 10, 25, 0.0, 1.0)
        scale = ease('easeInOutCubic', f, 20, 70, 0.5, 1.5)
        angle = ease('easeOutBack', f, 30, 80, 0.0, 90.0)
        M = cv2.getRotationMatrix2D((100, 100), angle, scale)
        warped = cv2.warpAffine(sprite, M, (200, 200),
                                flags=cv2.INTER_LINEAR,
                                borderMode=cv2.BORDER_CONSTANT,
                                borderValue=(0, 0, 0, 0))
        frame = bg_f.copy()
        composite_bgra(frame, warped, (220, 80), opacity)
        frames.append(to_uint8(frame))

    gt = {
        'name': 'scale_rot',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {'type': 'flat', 'color': '#0b1020'},
        'elements': [
            {
                'id': 'circle',
                'shape': 'circle_with_offset_red_dot',
                'colour': '#ffffff',
                'size': [80, 80],
                'keyframes': [
                    {'prop': 'scale', 'f0': 20, 'f1': 70, 'v0': 0.5, 'v1': 1.5, 'easing': 'easeInOutCubic'},
                    {'prop': 'rotation', 'f0': 30, 'f1': 80, 'v0': 0.0, 'v1': 90.0, 'easing': 'easeOutBack'}
                ],
                'opacity_keyframes': [
                    {'prop': 'opacity', 'f0': 10, 'f1': 25, 'v0': 0.0, 'v1': 1.0, 'easing': 'linear'}
                ],
                'notes': 'red dot is offset 15 px right of centre to make rotation visible'
            }
        ]
    }
    return frames, gt


def make_multi():
    bg_u8 = np.full((H, W, 3), hex_bgr('#f2efe6'), np.uint8)
    grid_color = hex_bgr('#d8d2c4')
    for x in range(0, W, 40):
        cv2.line(bg_u8, (x, 0), (x, H - 1), grid_color, 2)
    for y in range(0, H, 40):
        cv2.line(bg_u8, (0, y), (W - 1, y), grid_color, 2)
    bg_f = bg_u8.astype(np.float32)

    tri = polygon_sprite(100, 100, triangle_points(50, 50, 80), hex_bgr('#e74c3c'))
    sq = square_sprite(70, hex_bgr('#2ecc71'))
    star = polygon_sprite(120, 120, star_points(60, 60, 50, 20), hex_bgr('#9b59b6'))

    frames = []
    for f in range(90):
        frame = bg_f.copy()
        if f >= 5:
            x = ease('easeOutBack', f, 5, 40, -80.0, 160.0)
            op = 1.0 - ease('linear', f, 70, 85, 0.0, 1.0)
            composite_bgra(frame, tri, (int(round(x - 50)), 130), op)
        if f >= 12:
            x = ease('easeOutBack', f, 12, 47, -80.0, 320.0)
            composite_bgra(frame, sq, (int(round(x - 35)), 145), 1.0)
        if f >= 19:
            x = ease('easeOutBack', f, 19, 54, -80.0, 480.0)
            composite_bgra(frame, star, (int(round(x - 60)), 120), 1.0)
        frames.append(to_uint8(frame))

    gt = {
        'name': 'multi',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {
            'type': 'flat_with_grid',
            'color': '#f2efe6',
            'grid': '2 px lines every 40 px, color #d8d2c4'
        },
        'elements': [
            {
                'id': 'triangle',
                'shape': 'triangle',
                'colour': '#e74c3c',
                'size': [100, 100],
                'keyframes': [
                    {'prop': 'x', 'f0': 5, 'f1': 40, 'v0': -80, 'v1': 160, 'easing': 'easeOutBack'},
                    {'prop': 'y', 'f0': 5, 'f1': 40, 'v0': 180, 'v1': 180, 'easing': 'linear'}
                ],
                'opacity_keyframes': [
                    {'prop': 'opacity', 'f0': 70, 'f1': 85, 'v0': 1.0, 'v1': 0.0, 'easing': 'linear'}
                ],
                'notes': 'enters from off-screen left with easeOutBack, then fades out'
            },
            {
                'id': 'square',
                'shape': 'square',
                'colour': '#2ecc71',
                'size': [70, 70],
                'keyframes': [
                    {'prop': 'x', 'f0': 12, 'f1': 47, 'v0': -80, 'v1': 320, 'easing': 'easeOutBack'},
                    {'prop': 'y', 'f0': 12, 'f1': 47, 'v0': 180, 'v1': 180, 'easing': 'linear'}
                ],
                'opacity_keyframes': [],
                'notes': 'enters from off-screen left with easeOutBack'
            },
            {
                'id': 'star',
                'shape': 'star',
                'colour': '#9b59b6',
                'size': [120, 120],
                'keyframes': [
                    {'prop': 'x', 'f0': 19, 'f1': 54, 'v0': -80, 'v1': 480, 'easing': 'easeOutBack'},
                    {'prop': 'y', 'f0': 19, 'f1': 54, 'v0': 180, 'v1': 180, 'easing': 'linear'}
                ],
                'opacity_keyframes': [],
                'notes': 'enters from off-screen left with easeOutBack'
            }
        ]
    }
    return frames, gt


def make_pan():
    rng = np.random.default_rng(4)
    W_bg = 1280
    bg = np.zeros((H, W_bg, 3), np.uint8)

    top = np.array(hex_bgr('#6bb5e0'), np.float32)
    bottom = np.array(hex_bgr('#d3ecf7'), np.float32)
    t = np.linspace(0, 1, H).reshape(H, 1, 1).astype(np.float32)
    grad = (top[None, None, :] * (1.0 - t) + bottom[None, None, :] * t).astype(np.uint8)
    bg[:, :] = np.repeat(grad, W_bg, axis=1)

    def draw_hill(base_y, amp, color):
        pts = [(0, H)]
        n = 16
        xs = np.linspace(0, W_bg - 1, n)
        ys = base_y + rng.uniform(-amp, amp, n)
        for x, y in zip(xs, ys):
            pts.append((int(round(x)), int(round(y))))
        pts.append((W_bg - 1, H))
        cv2.fillPoly(bg, [np.array(pts, np.int32)], hex_bgr(color))

    draw_hill(240, 40, '#8cb576')
    draw_hill(285, 30, '#6a9f58')

    tree_xs = rng.uniform(30, W_bg - 30, 12)
    for x in tree_xs:
        xi = int(round(x))
        cv2.rectangle(bg, (xi - 5, 280), (xi + 5, 300), hex_bgr('#6b4c2a'), -1)
        cv2.fillPoly(bg, [np.array([(xi, 255), (xi - 22, 290), (xi + 22, 290)], np.int32)],
                     hex_bgr('#2f6b2f'))

    bird = np.zeros((60, 80, 4), np.uint8)
    cv2.ellipse(bird, (35, 30), (22, 10), 0, 0, 360, (255, 255, 255, 255), -1, lineType=cv2.LINE_AA)
    cv2.ellipse(bird, (30, 22), (14, 7), -30, 0, 360, (220, 220, 220, 255), -1, lineType=cv2.LINE_AA)
    beak = np.array([(55, 27), (68, 30), (55, 33)], np.int32).reshape(-1, 1, 2)
    cv2.fillPoly(bird, [beak], (0, 165, 255, 255), lineType=cv2.LINE_AA)

    frames = []
    for f in range(90):
        offset = int(round(ease('easeInOutCubic', f, 0, 89, 0.0, 320.0)))
        crop = bg[:, offset:offset + W]
        frame_f = crop.astype(np.float32)
        bx = ease('easeOutCubic', f, 0, 89, 80.0, 560.0)
        by = ease('linear', f, 0, 89, 100.0, 220.0)
        composite_bgra(frame_f, bird, (int(round(bx - 40)), int(round(by - 30))), 1.0)
        frames.append(to_uint8(frame_f))

    camera = [
        {'frame': f, 'dx': int(round(ease('easeInOutCubic', f, 0, 89, 0.0, 320.0)))}
        for f in range(90)
    ]

    gt = {
        'name': 'pan',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {
            'type': 'procedural',
            'description': '1280x360 sky gradient, hills, 12 seeded trees'
        },
        'camera': camera,
        'elements': [
            {
                'id': 'bird',
                'shape': 'bird',
                'colour': 'white/gray/orange',
                'size': [80, 60],
                'keyframes': [
                    {'prop': 'x', 'f0': 0, 'f1': 89, 'v0': 80, 'v1': 560, 'easing': 'easeOutCubic'},
                    {'prop': 'y', 'f0': 0, 'f1': 89, 'v0': 100, 'v1': 220, 'easing': 'linear'}
                ],
                'opacity_keyframes': [],
                'notes': 'bird moves independently on top after camera crop'
            }
        ]
    }
    return frames, gt


def make_typed():
    bg_u8 = np.full((H, W, 3), hex_bgr('#0a1c3a'), np.uint8)
    bubble_x, bubble_y, bubble_w, bubble_h = 110, 90, 420, 140
    mask = rounded_rect_mask(bubble_w, bubble_h, 20)
    roi = bg_u8[bubble_y:bubble_y + bubble_h, bubble_x:bubble_x + bubble_w]
    roi[mask > 0] = (255, 255, 255)

    tail = np.array([(175, 230), (215, 230), (195, 258)], np.int32).reshape(-1, 1, 2)
    cv2.fillPoly(bg_u8, [tail], (255, 255, 255), lineType=cv2.LINE_AA)

    text = 'Every minute you spend'
    font = cv2.FONT_HERSHEY_SIMPLEX
    scale = 0.8
    thickness = 2
    color = hex_bgr('#1a1a1a')
    (tw, th), baseline = cv2.getTextSize(text, font, scale, thickness)
    text_x = bubble_x + (bubble_w - tw) // 2
    text_y = bubble_y + (bubble_h + th) // 2

    frames = []
    for f in range(90):
        frame = bg_u8.copy()
        if f >= 10:
            n = (f - 10) // 2 + 1
            n = min(n, len(text))
            if n > 0:
                cv2.putText(frame, text[:n], (text_x, text_y), font, scale, color, thickness,
                            lineType=cv2.LINE_AA)
        frames.append(frame)

    gt = {
        'name': 'typed',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {'type': 'flat', 'color': '#0a1c3a'},
        'elements': [
            {
                'id': 'speech_bubble',
                'shape': 'rounded_rectangle_with_tail',
                'colour': '#ffffff',
                'size': [420, 140],
                'keyframes': [],
                'opacity_keyframes': [],
                'notes': 'fixed speech bubble'
            }
        ],
        'text': [
            {
                'string': text,
                'first_frame_per_char': [10 + 2 * i for i in range(len(text))],
                'box': [text_x, text_y - th, tw, th + baseline]
            }
        ]
    }
    return frames, gt


def make_blob():
    bg = np.full((H, W, 3), hex_bgr('#101418'), np.uint8)
    rng = np.random.default_rng(6)
    grain = rng.normal(0, 3, (H, W, 3)).astype(np.float32)

    theta = np.linspace(0, 2 * np.pi, 240, endpoint=False)
    cost = np.cos(theta)
    sint = np.sin(theta)
    color = hex_bgr('#7a3cff')

    frames = []
    for f in range(90):
        frame = bg.copy()
        r = 60 + 15 * np.sin(3 * theta + f * 0.2) + 8 * np.sin(5 * theta - f * 0.13)
        xs = 320 + r * cost
        ys = 180 + r * sint
        pts = np.stack([xs, ys], axis=1).astype(np.int32).reshape(-1, 1, 2)
        cv2.fillPoly(frame, [pts], color, lineType=cv2.LINE_AA)
        out = np.clip(frame.astype(np.float32) + grain, 0, 255).astype(np.uint8)
        frames.append(out)

    gt = {
        'name': 'blob',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 90,
        'cuts': [],
        'background': {'type': 'flat', 'color': '#101418'},
        'elements': [
            {
                'id': 'blob',
                'shape': 'procedural_blob',
                'colour': '#7a3cff',
                'size': [],
                'keyframes': [],
                'opacity_keyframes': [],
                'notes': 'outline radius r(theta,t)=60+15*sin(3*theta+t*0.2)+8*sin(5*theta-t*0.13); t=frame index; centre (320,180); static gaussian noise sigma=3'
            }
        ]
    }
    return frames, gt


def make_cuts():
    red = hex_bgr('#e74c3c')
    green = hex_bgr('#2ecc71')
    yellow = hex_bgr('#f1c40f')
    circle = circle_sprite(80, 30, red)
    square = square_sprite(60, green)
    tri = polygon_sprite(100, 100, triangle_points(50, 50, 80), yellow)

    frames = []
    for f in range(120):
        if f < 40:
            bg = np.full((H, W, 3), hex_bgr('#2b2b2b'), np.float32)
            x = ease('linear', f, 0, 39, 60.0, 580.0)
            composite_bgra(bg, circle, (int(round(x - 40)), 140), 1.0)
        elif f < 80:
            bg = np.full((H, W, 3), hex_bgr('#e8e8e8'), np.float32)
            y = ease('linear', f, 40, 79, 40.0, 320.0)
            composite_bgra(bg, square, (290, int(round(y - 30))), 1.0)
        else:
            bg = np.full((H, W, 3), hex_bgr('#1f3a5f'), np.float32)
            x = ease('linear', f, 80, 119, 80.0, 560.0)
            y = ease('linear', f, 80, 119, 60.0, 300.0)
            composite_bgra(bg, tri, (int(round(x - 50)), int(round(y - 50))), 1.0)
        frames.append(to_uint8(bg))

    gt = {
        'name': 'cuts',
        'fps': FPS,
        'width': W,
        'height': H,
        'frames': 120,
        'cuts': [40, 80],
        'background': {
            'type': 'flat_colour_segments',
            'segments': [
                {'start': 0, 'end': 39, 'color': '#2b2b2b'},
                {'start': 40, 'end': 79, 'color': '#e8e8e8'},
                {'start': 80, 'end': 119, 'color': '#1f3a5f'}
            ]
        },
        'elements': [
            {
                'id': 'red_circle',
                'shape': 'circle',
                'colour': '#e74c3c',
                'size': [80, 80],
                'keyframes': [
                    {'prop': 'x', 'f0': 0, 'f1': 39, 'v0': 60, 'v1': 580, 'easing': 'linear'},
                    {'prop': 'y', 'f0': 0, 'f1': 39, 'v0': 180, 'v1': 180, 'easing': 'linear'}
                ],
                'opacity_keyframes': []
            },
            {
                'id': 'green_square',
                'shape': 'square',
                'colour': '#2ecc71',
                'size': [60, 60],
                'keyframes': [
                    {'prop': 'x', 'f0': 40, 'f1': 79, 'v0': 320, 'v1': 320, 'easing': 'linear'},
                    {'prop': 'y', 'f0': 40, 'f1': 79, 'v0': 40, 'v1': 320, 'easing': 'linear'}
                ],
                'opacity_keyframes': []
            },
            {
                'id': 'yellow_triangle',
                'shape': 'triangle',
                'colour': '#f1c40f',
                'size': [100, 100],
                'keyframes': [
                    {'prop': 'x', 'f0': 80, 'f1': 119, 'v0': 80, 'v1': 560, 'easing': 'linear'},
                    {'prop': 'y', 'f0': 80, 'f1': 119, 'v0': 60, 'v1': 300, 'easing': 'linear'}
                ],
                'opacity_keyframes': []
            }
        ]
    }
    return frames, gt


SCENES = {
    'slide': make_slide,
    'scale_rot': make_scale_rot,
    'multi': make_multi,
    'pan': make_pan,
    'typed': make_typed,
    'blob': make_blob,
    'cuts': make_cuts,
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('out_dir')
    parser.add_argument('--only', default=None)
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    if args.only:
        if args.only not in SCENES:
            print(f'Unknown scene: {args.only}', file=sys.stderr)
            sys.exit(1)
        names = [args.only]
    else:
        names = list(SCENES.keys())

    for name in names:
        frames, gt = SCENES[name]()
        video_path = os.path.join(args.out_dir, f'{name}.mp4')
        json_path = os.path.join(args.out_dir, f'{name}.json')
        write_video(video_path, frames, gt)
        with open(json_path, 'w') as f:
            json.dump(gt, f, indent=2)
        print(f'Wrote {name}.mp4 and {name}.json')


if __name__ == '__main__':
    main()