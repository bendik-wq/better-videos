#!/usr/bin/env python3
import json, os, shutil, sys

def fmt(val):
    rounded = round(val, 4)
    if rounded == 0:
        rounded = 0.0
    return f"{rounded:.4f}"

def generate_shot_html(shot, width, height, fps, comps_dir):
    shot_index = shot["index"]
    shot_id = f"shot_{shot_index}"
    start = shot["start"]
    end = shot["end"]
    local_frames = end - start
    plate = shot["plate"]
    origin = shot["origin"]
    camera = shot["camera"]
    layers = shot["layers"]

    html = []
    html.append("<template>")
    html.append(f"<style>#{shot_id}-root{{position:absolute;inset:0;overflow:hidden}} #{shot_id}-root img{{position:absolute;left:0;top:0;transform-origin:0 0;}}</style>")
    html.append(f"<div id={shot_id}-root data-composition-id={shot_id} data-width={width} data-height={height}>")
    html.append(f"  <img id={shot_id}-plate src=assets/{plate}>")

    for layer in layers:
        layer_id = layer["id"]
        poses = layer["poses"]
        for idx, pose_name in enumerate(poses):
            html.append(f"  <img id={shot_id}-{layer_id}-p{idx} src=assets/{pose_name} style=\"opacity:0\">")
    html.append("</div>")
    html.append("<script>")
    html.append("(()=>{")
    html.append("const tl=gsap.timeline({paused:true});")

    # Plate
    plate_target = f"#{shot_id}-plate"
    x0, y0 = origin
    prev_plate_x = None
    prev_plate_y = None
    for i in range(local_frames):
        dx, dy = camera[i]
        desired_x = -(x0 + dx)
        desired_y = -(y0 + dy)
        if i == 0 or desired_x != prev_plate_x or desired_y != prev_plate_y:
            time = i / fps
            html.append(f"tl.set('{plate_target}', {{x:{desired_x}, y:{desired_y}}}, {time});")
            prev_plate_x = desired_x
            prev_plate_y = desired_y

    # Layers
    for layer in layers:
        layer_id = layer["id"]
        poses = layer["poses"]
        frames = layer["frames"]
        state = []
        for _ in poses:
            state.append({'opacity': 0, 'transform': None})

        for i in range(local_frames):
            time = i / fps
            frame_entry = frames.get(str(i))
            active_pose = frame_entry["pose"] if frame_entry else None

            for j in range(len(poses)):
                target = f"#{shot_id}-{layer_id}-p{j}"
                desired_opacity = 1 if active_pose == j else 0
                desired_transform = None
                if active_pose == j:
                    M = frame_entry["M"]
                    a, b, tx = M[0][0], M[0][1], M[0][2]
                    c, d, ty = M[1][0], M[1][1], M[1][2]
                    desired_transform = f"matrix({fmt(a)}, {fmt(c)}, {fmt(b)}, {fmt(d)}, {fmt(tx)}, {fmt(ty)})"

                props = {}
                if desired_opacity != state[j]['opacity']:
                    props['opacity'] = desired_opacity
                if active_pose == j and desired_transform != state[j]['transform']:
                    props['transform'] = desired_transform

                if props:
                    prop_strs = []
                    if 'opacity' in props:
                        prop_strs.append(f"opacity:{props['opacity']}")
                    if 'transform' in props:
                        prop_strs.append(f"transform:'{props['transform']}'")
                    html.append(f"tl.set('{target}', {{{', '.join(prop_strs)}}}, {time});")
                    if 'opacity' in props:
                        state[j]['opacity'] = props['opacity']
                    if 'transform' in props:
                        state[j]['transform'] = props['transform']

    html.append("tl.progress(1).progress(0);")
    html.append(f"window.__timelines['{shot_id}']=tl;")
    html.append("})();")
    html.append("</script>")
    html.append("</template>")

    filepath = os.path.join(comps_dir, f"{shot_id}.html")
    with open(filepath, 'w') as f:
        f.write("\n".join(html))

def generate_index_html(scene, shots, fps, total_frames, project_dir):
    width = scene["width"]
    height = scene["height"]
    total_duration = total_frames / fps

    html = []
    html.append("<!DOCTYPE html>")
    html.append("<html>")
    html.append("<head>")
    html.append("<meta charset=\"utf-8\">")
    html.append("<title>HyperFrames Project</title>")
    html.append("</head>")
    html.append("<body>")
    html.append(f"<div id=root data-composition-id=main data-start=0 data-duration={total_duration} data-width={width} data-height={height} data-fps={fps}>")

    for shot in shots:
        shot_id = f"shot_{shot['index']}"
        start = shot["start"]
        end = shot["end"]
        start_time = start / fps
        duration = (end - start) / fps
        html.append(f"  <div id={shot_id} data-composition-id={shot_id} data-composition-src=compositions/{shot_id}.html data-start={start_time} data-duration={duration} data-track-index=1 data-width={width} data-height={height}></div>")

    if scene.get("_has_audio"):  # the original soundtrack, extracted to a real audio file
        html.append(f"  <audio id=src-sound class=clip src=assets/source_audio.m4a data-start=0 data-duration={total_duration} data-track-index=9 data-volume=1></audio>")
    html.append("</div>")
    html.append("<script src=gsap.min.js></script>")
    html.append("<script>")
    html.append("const tl=gsap.timeline({paused:true});")
    html.append("window.__timelines['main']=tl;")
    html.append("</script>")
    html.append("</body>")
    html.append("</html>")

    filepath = os.path.join(project_dir, "index.html")
    with open(filepath, 'w') as f:
        f.write("\n".join(html))

def generate_readme(scene, shots, project_dir):
    lines = []
    lines.append("# HyperFrames Project")
    lines.append("")
    lines.append("## Shots")
    for shot in shots:
        lines.append(f"- shot_{shot['index']}: frames {shot['start']}–{shot['end']}, plate {shot['plate']}")
        for layer in shot["layers"]:
            lines.append(f"  - layer {layer['id']}: poses: {', '.join(layer['poses'])}")
    lines.append("")
    lines.append("## Fitted Eases")
    lines.append("| Shot | Layer | Prop | Frames | From → To | Ease | RMSE |")
    lines.append("|---|---|---|---|---|---|---|")
    for shot in shots:
        shot_id = f"shot_{shot['index']}"
        for layer in shot["layers"]:
            layer_id = layer["id"]
            fits = layer.get("fits")
            if not fits:
                continue
            for prop, fit_list in fits.items():
                for fit in fit_list:
                    f0 = fit["f0"]
                    f1 = fit["f1"]
                    v0 = fit.get("v0")
                    v1 = fit.get("v1")
                    ease = fit.get("ease", "")
                    rmse = fit.get("rmse", "")
                    note = fit.get("note", "")
                    lines.append(f"| {shot_id} | {layer_id} | {prop} | {f0}–{f1} | {v0} → {v1} | {ease} | {rmse} |")
    lines.append("")
    lines.append("## Note")
    lines.append("Fits with rmse < 0.03 can replace the per-frame keys with one tl.fromTo using that ease.")
    filepath = os.path.join(project_dir, "README.md")
    with open(filepath, 'w') as f:
        f.write("\n".join(lines))

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 emit_hf.py <out_dir>", file=sys.stderr)
        sys.exit(1)
    out_dir = sys.argv[1]
    scene_path = os.path.join(out_dir, "scene.json")
    with open(scene_path, 'r') as f:
        scene = json.load(f)

    project_dir = os.path.join(out_dir, "project")
    if os.path.exists(project_dir):
        shutil.rmtree(project_dir)
    os.makedirs(project_dir)
    comps_dir = os.path.join(project_dir, "compositions")
    os.makedirs(comps_dir)
    assets_dir = os.path.join(project_dir, "assets")
    os.makedirs(assets_dir)

    src_assets = os.path.join(out_dir, "assets")
    if os.path.exists(src_assets):
        shutil.copytree(src_assets, assets_dir, dirs_exist_ok=True)
    else:
        print("Warning: assets directory not found", file=sys.stderr)

    source = scene.get("source")
    if source:
        src_path = os.path.join(out_dir, source) if not os.path.isabs(source) else source
        if os.path.exists(src_path):
            ext = os.path.splitext(source)[1].lstrip('.')
            if not ext:
                ext = "mp4"
            import subprocess  # soundtrack only (HyperFrames wants an audio file for <audio>)
            r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src_path, "-vn", "-c:a", "aac", "-b:a", "192k",
                                os.path.join(assets_dir, "source_audio.m4a")], capture_output=True)
        else:
            print(f"Warning: source video not found: {src_path}", file=sys.stderr)

    gsap_path = os.environ.get("GSAP_JS")
    if gsap_path:
        if os.path.exists(gsap_path):
            shutil.copy2(gsap_path, os.path.join(project_dir, "gsap.min.js"))
        else:
            print(f"Warning: GSAP_JS path not found: {gsap_path}", file=sys.stderr)
    else:
        print("Warning: GSAP_JS not set; gsap.min.js not copied", file=sys.stderr)

    width = scene["width"]
    height = scene["height"]
    fps = scene["fps"]
    total_frames = scene["frames"]
    shots = scene["shots"]

    for shot in shots:
        generate_shot_html(shot, width, height, fps, comps_dir)

    _m = os.path.join(assets_dir, 'source_audio.m4a')
    scene['_has_audio'] = os.path.exists(_m) and os.path.getsize(_m) > 1000
    generate_index_html(scene, shots, fps, total_frames, project_dir)
    generate_readme(scene, shots, project_dir)

    print(f"Project written to {project_dir}")

if __name__ == "__main__":
    main()