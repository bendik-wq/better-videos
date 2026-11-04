"""Find frames where Josh's cigarette (orange filter) is visible in rendered face clips.

    python3 cigscan.py <face-dir> <parts.json> [--fps 5] [--sheet out.jpg]

parts.json maps part id -> {"in": source seconds, ...} (what face4k.py was given). Looks for compact
saturated-orange blobs away from the face: in the left 32% of the panel or its bottom 28% (his hand
is always on the left; lips and lit skin sit in the middle). Prints the hits as source-time spans.
"""
import json, sys
import cv2
import numpy as np

args = [a for a in sys.argv[1:] if not a.startswith("--")]
face_dir, parts_path = args[:2]
fps = int(sys.argv[sys.argv.index("--fps") + 1]) if "--fps" in sys.argv else 5
sheet = sys.argv[sys.argv.index("--sheet") + 1] if "--sheet" in sys.argv else None
parts = json.load(open(parts_path))
hits, tiles = [], []
for pid, p in parts.items():
    cap = cv2.VideoCapture(f"{face_dir}/{pid}.mp4")
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, 25 // fps)
    for k in range(0, n, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, k)
        ok, im = cap.read()
        if not ok:
            continue
        h, w = im.shape[:2]
        m = cv2.inRange(cv2.cvtColor(im, cv2.COLOR_BGR2HSV), (5, 150, 110), (22, 255, 255))
        roi = np.zeros_like(m)
        roi[:, : int(w * 0.32)] = 255
        roi[int(h * 0.72):, :] = 255
        m &= roi
        cnt, _, st, _ = cv2.connectedComponentsWithStats(m)
        area = max([st[i][4] for i in range(1, cnt) if 30 <= st[i][4] <= 5000], default=0)
        if area:
            t = round(p["in"] + k / 25, 2)
            hits.append([pid, round(k / 25, 2), t, int(area)])
            if sheet and len(tiles) < 96:
                tile = cv2.resize(im, (200, 200))
                cv2.putText(tile, f"{pid.replace('~ig', '')} {k / 25:.1f}", (3, 192), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)
                tiles.append(tile)
spans = []  # merge hits into source-time spans
for pid, rel, t, area in sorted(hits, key=lambda x: x[2]):
    if spans and t - spans[-1][1] <= 0.6:
        spans[-1][1] = t
    else:
        spans.append([t, t])
print(json.dumps({"hits": hits, "spans": spans}))
if sheet and tiles:
    rows = [np.hstack(tiles[i:i + 12] + [np.zeros_like(tiles[0])] * (12 - len(tiles[i:i + 12]))) for i in range(0, len(tiles), 12)]
    cv2.imwrite(sheet, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
