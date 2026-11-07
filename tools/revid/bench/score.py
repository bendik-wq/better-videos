#!/usr/bin/env python3
"""Benchmark scorer for revid. Run from the repository root.

For each synthetic benchmark it runs revid.run, parses the report and scene.json,
compares against reverse/bench/<name>.json, prints one markdown table row per scene,
then prints a single SCORE line. It is a report; failures are noted and do not make the
process exit non-zero.
"""
import json
import os
import sys
from pathlib import Path

ROOT = str(Path(__file__).resolve().parents[3])
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from tools.revid import revid  # noqa: E402


EASE_MAP = {
    "easeoutcubic": "power2.out",
    "easeinoutcubic": "power2.inout",
    "easeoutback": "back.out",
    "easeinquad": "power1.in",
    "linear": "linear",
}


def to_number(value):
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            return None
    if isinstance(value, (list, tuple)) and len(value) > 0:
        return to_number(value[0])
    return None


def ease_family(value):
    """Return the ease family, ignoring any parenthesised parameters."""
    return str(value or "").lower().split("(")[0].strip()


def expected_ease(truth_ease):
    family = ease_family(truth_ease)
    return EASE_MAP.get(family, family)


def truth_moves_for_element(element):
    """Extract ground-truth x and scale moves for one element.

    Ground truth keyframes are objects with prop, f0, f1, v0, v1 and easing.
    A move counts when prop is 'x' or 'scale' and v0 != v1.
    """
    moves = []
    if not isinstance(element, dict):
        return moves

    element_id = element.get("id", element.get("name", "?"))
    keyframes = element.get("keyframes")
    if not isinstance(keyframes, list):
        return moves

    for kf in keyframes:
        if not isinstance(kf, dict):
            continue

        prop = kf.get("prop")
        if prop not in ("x", "scale"):
            continue

        f0 = to_number(kf.get("f0"))
        f1 = to_number(kf.get("f1"))
        v0 = to_number(kf.get("v0"))
        v1 = to_number(kf.get("v1"))
        if f0 is None or f1 is None or v0 is None or v1 is None:
            continue
        if abs(v1 - v0) <= 1e-9:
            continue

        ease = kf.get("easing", kf.get("ease", "") or "")
        moves.append(
            {
                "element_id": element_id,
                "prop": prop,
                "f0": int(f0),
                "f1": int(f1),
                "v0": v0,
                "v1": v1,
                "ease": str(ease).strip() or "linear",
            }
        )

    return moves


def collect_fitted_tweens(shot, prop):
    """Collect all fitted tweens of a given prop (x or scale) in one shot."""
    if not isinstance(shot, dict):
        return []
    fitted = []
    for layer in shot.get("layers", []):
        if not isinstance(layer, dict):
            continue
        fits = layer.get("fits", {})
        if not isinstance(fits, dict):
            continue
        segments = fits.get(prop, [])
        if not isinstance(segments, list):
            continue
        for segment in segments:
            if isinstance(segment, dict) and segment.get("kind") == "tween":
                fitted.append(segment)
    return fitted


def match_truth_moves(truth_moves, fitted_by_prop):
    """For each ground-truth move, pick the fitted tween of the same prop with the
    closest v1 and report |f0 diff|, |f1 diff| and ease-family match."""
    results = []
    for move in truth_moves:
        segments = fitted_by_prop.get(move["prop"], [])
        best = None
        best_distance = None
        for segment in segments:
            try:
                v1 = float(segment.get("v1"))
            except (TypeError, ValueError):
                continue
            distance = abs(v1 - move["v1"])
            if best is None or distance < best_distance:
                best = segment
                best_distance = distance

        if best is None:
            results.append(
                {
                    "truth": move,
                    "fitted": None,
                    "f0_diff": None,
                    "f1_diff": None,
                    "ease_match": False,
                    "match": False,
                }
            )
            continue

        try:
            f0_diff = abs(int(best.get("f0", 0)) - int(move["f0"]))
            f1_diff = abs(int(best.get("f1", 0)) - int(move["f1"]))
        except (TypeError, ValueError):
            f0_diff = 9999
            f1_diff = 9999

        actual = ease_family(best.get("ease"))
        expected = expected_ease(move["ease"])
        ease_ok = actual == expected
        matched = f0_diff <= 2 and f1_diff <= 4 and ease_ok

        results.append(
            {
                "truth": move,
                "fitted": best,
                "f0_diff": f0_diff,
                "f1_diff": f1_diff,
                "ease_match": ease_ok,
                "match": matched,
            }
        )
    return results


def normalize_scenes(truth_data):
    if isinstance(truth_data, list):
        return truth_data
    if not isinstance(truth_data, dict):
        return []
    for key in ("scenes", "shots"):
        if key in truth_data and isinstance(truth_data[key], list):
            return truth_data[key]
    return [truth_data]


def extract_camera_dx(data):
    if not isinstance(data, dict):
        return None

    camera = data.get("camera")

    if isinstance(camera, dict):
        for key in ("dx", "total_dx", "pan", "pan_x", "x"):
            if key in camera and isinstance(camera[key], (int, float)):
                return float(camera[key])

    if isinstance(camera, list) and camera:
        first, last = camera[0], camera[-1]
        if isinstance(first, (list, tuple)) and len(first) >= 1 and isinstance(last, (list, tuple)) and len(last) >= 1:
            return float(last[0]) - float(first[0])
        if isinstance(first, (int, float)) and isinstance(last, (int, float)):
            return float(last) - float(first)

    for key in ("camera_dx", "camera_pan", "pan_dx", "total_dx", "pan", "dx"):
        if key in data and isinstance(data[key], (int, float)):
            return float(data[key])

    if isinstance(camera, (int, float)):
        return float(camera)

    return None


def shot_camera_dx(shot):
    """Total camera dx inside a revid shot (last camera offset x minus first)."""
    if not isinstance(shot, dict):
        return 0.0
    camera = shot.get("camera")
    if not isinstance(camera, list) or not camera:
        return 0.0
    first, last = camera[0], camera[-1]
    if (
        isinstance(first, (list, tuple))
        and len(first) >= 1
        and isinstance(last, (list, tuple))
        and len(last) >= 1
    ):
        return float(last[0]) - float(first[0])
    if isinstance(first, (int, float)) and isinstance(last, (int, float)):
        return float(last) - float(first)
    return 0.0


def parse_d_b_line(report_text, prefix):
    """Parse the first value in a report table line such as '| rebuild ... | 99.0 dB |...'."""
    for raw_line in report_text.splitlines():
        line = raw_line.strip()
        if line.startswith(prefix):
            for token in line.split("|"):
                token = token.strip()
                if token.endswith("dB"):
                    try:
                        return float(token[:-2].strip())
                    except ValueError:
                        return 0.0
    return 0.0


def scene_elements(scene):
    if not isinstance(scene, dict):
        return []
    for key in ("elements", "layers", "sprites", "shapes", "objects"):
        if key in scene and isinstance(scene[key], list):
            return scene[key]
    return []


def main():
    names = ["slide", "scale_rot", "multi", "pan", "typed", "blob", "cuts"]
    out_base = "/tmp/revid-score"
    os.makedirs(out_base, exist_ok=True)

    rows = []
    scene_scores = []
    unmatched_lines = []

    for name in names:
        video_path = os.path.join("reverse", "bench", f"{name}.mp4")
        truth_path = os.path.join("reverse", "bench", f"{name}.json")
        out_dir = os.path.join(out_base, name)
        try:
            revid.run(video_path, out_dir)

            with open(os.path.join(out_dir, "scene.json"), "r", encoding="utf-8") as handle:
                revid_scene = json.load(handle)
            with open(os.path.join(out_dir, "report.md"), "r", encoding="utf-8") as handle:
                report_text = handle.read()
            with open(truth_path, "r", encoding="utf-8") as handle:
                truth_data = json.load(handle)

            rebuild_psnr = parse_d_b_line(report_text, "| rebuild")
            model_psnr = parse_d_b_line(report_text, "| model only")
            explained, baked = revid.understanding(out_dir)
            if explained + baked > 0:
                understanding_pct = 100.0 * explained / (explained + baked)
            else:
                understanding_pct = 0.0

            top_cuts = truth_data.get("cuts") if isinstance(truth_data, dict) else None
            scenes = normalize_scenes(truth_data)
            if not scenes:
                scenes = [{}]

            for scene_index, truth_scene in enumerate(scenes):
                shot = (
                    revid_scene["shots"][scene_index]
                    if scene_index < len(revid_scene.get("shots", []))
                    else {}
                )

                # Cuts: compare revid's global cut list with the ground-truth list.
                found_cuts = revid_scene.get("cuts", [])
                truth_cuts = truth_scene.get("cuts") if isinstance(truth_scene, dict) else None
                if truth_cuts is None and top_cuts is not None:
                    truth_cuts = top_cuts
                if truth_cuts is None:
                    truth_cuts = []
                cuts_ok = list(found_cuts) == list(truth_cuts)
                cuts_cell = "ok" if cuts_ok else f"no (found {found_cuts}, truth {truth_cuts})"

                found_camera_dx = shot_camera_dx(shot)
                if name == "pan":
                    truth_camera_dx = extract_camera_dx(truth_scene)
                    if truth_camera_dx is None and isinstance(truth_data, dict):
                        truth_camera_dx = extract_camera_dx(truth_data)
                    if truth_camera_dx is None:
                        truth_camera_dx = 0.0
                else:
                    truth_camera_dx = 0.0

                layers = len(shot.get("layers", [])) if isinstance(shot, dict) else 0

                truth_moves = []
                for element in scene_elements(truth_scene):
                    truth_moves.extend(truth_moves_for_element(element))

                fitted_by_prop = {
                    "x": collect_fitted_tweens(shot, "x"),
                    "scale": collect_fitted_tweens(shot, "scale"),
                }
                matches = match_truth_moves(truth_moves, fitted_by_prop)
                matched_count = sum(1 for match in matches if match["match"])
                total_moves = len(truth_moves)

                if total_moves == 0:
                    x_cell = "-"
                else:
                    x_cell = f"{matched_count}/{total_moves}"

                rows.append(
                    f"| {name}:{scene_index} | {cuts_cell} | "
                    f"{found_camera_dx:.1f}/{truth_camera_dx:.1f} | {layers} | "
                    f"{understanding_pct:.0f}% | {rebuild_psnr:.2f} dB | "
                    f"{model_psnr:.2f} dB | {x_cell} |"
                )

                for match in matches:
                    if match["match"]:
                        continue
                    move = match["truth"]
                    prop = move["prop"]
                    fitted_segments = fitted_by_prop.get(prop, [])
                    if fitted_segments:
                        fitted_text = ", ".join(
                            f"{segment.get('f0', '?')}-{segment.get('f1', '?')} {segment.get('ease', '')}"
                            for segment in fitted_segments
                        )
                    else:
                        fitted_text = "(none)"
                    expected = expected_ease(move["ease"])
                    unmatched_lines.append(
                        f"UNMATCHED {name}:{scene_index} element {move['element_id']} {prop} "
                        f"{move['f0']}-{move['f1']} expected {expected}; fitted: {fitted_text}"
                    )

                x_fraction = 1.0 if total_moves == 0 else matched_count / max(1, total_moves)
                scene_score = (
                    40.0 * (1.0 if rebuild_psnr >= 90.0 else 0.0)
                    + 30.0 * (understanding_pct / 100.0)
                    + 30.0 * x_fraction
                )
                scene_scores.append(scene_score)

        except Exception as exc:  # noqa: BLE001 - report failures and continue
            rows.append(f"| {name} | error: {exc} | - | - | - | - | - | - |")
            scene_scores.append(0.0)

    print("| scene | cuts | camera dx | layers | understanding % | rebuild PSNR | model PSNR | x-moves |")
    print("|---:|---|---:|---:|---:|---:|---:|---|")
    for row in rows:
        print(row)

    if unmatched_lines:
        print()
        for line in unmatched_lines:
            print(line)

    overall = sum(scene_scores) / len(scene_scores) if scene_scores else 0.0
    print(f"SCORE {overall:.1f}")


if __name__ == "__main__":
    main()

