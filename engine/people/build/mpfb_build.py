# Offline character builder (Blender 4.2 + MPFB2, run headless). Not shipped engine code:
# Blender (GPL) and MPFB (GPL) are offline tools here, like ffmpeg; their CC0/CC-BY assets are
# what ends up in assets/people/. Usage:
#   blender -b --factory-startup --python engine/people/build/mpfb_build.py -- <wardrobe-id|all> <outdir>
import bpy, sys, os, json, math
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
which = argv[0] if argv else 'suit'
outdir = argv[1] if len(argv) > 1 else '/tmp/people'
os.makedirs(outdir, exist_ok=True)
sys.path.insert(0, os.path.dirname(__file__))
from wardrobe import WARDROBE

import addon_utils
addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.exportservice import ExportService
from bl_ext.user_default.mpfb.services.objectservice import ObjectService

def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)

ARM_DROP = 25  # degrees: re-rest the arms closer to the body (A-pose -> relaxed), less LBS distortion

def lower_rest_arms(rig, deg):
    """Pose the upper arms down by `deg` and make that the rest pose (meshes follow). Most clips
    keep the arms down, so linear-blend skinning distorts the shoulders far less from here."""
    from mathutils import Matrix
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE')
    for side, sgn in (('l', 1), ('r', -1)):
        pb = rig.pose.bones[f'upperarm_{side}']; h = pb.head.copy()
        R = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg) * sgn, 4, 'Y') @ Matrix.Translation(-h)
        pb.matrix = R @ pb.matrix
        bpy.context.view_layer.update()
    bpy.ops.object.mode_set(mode='OBJECT')
    for o in bpy.data.objects:
        if o.type != 'MESH': continue
        mods = [m for m in o.modifiers if m.type == 'ARMATURE']
        if not mods: continue
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        name = mods[0].name
        bpy.ops.object.modifier_copy(modifier=name)
        bpy.ops.object.modifier_apply(modifier=name)
    bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')

def build(wid, spec):
    clear()
    info = HumanService._create_default_human_info_dict()
    ph = info['phenotype']; ph.update({k: v for k, v in spec['phenotype'].items() if k != 'race'})
    if 'race' in spec['phenotype']: ph['race'] = spec['phenotype']['race']
    info['rig'] = 'game_engine'
    info['eyebrows'] = spec.get('eyebrows', 'eyebrow001/eyebrow001.mhclo')
    info['eyelashes'] = spec.get('eyelashes', 'eyelashes01/eyelashes01.mhclo')
    info['eyes'] = spec.get('eyes', 'low-poly/low-poly.mhclo')
    info['hair'] = spec.get('hair', '')
    info['proxy'] = spec.get('proxy', '')
    info['clothes'] = spec['clothes']
    info['skin_mhmat'] = spec.get('skin', 'skins/middleage_caucasian_male/middleage_caucasian_male.mhmat')
    info['skin_material_type'] = 'MAKESKIN'
    info['clothes_material_type'] = 'MAKESKIN'
    st = HumanService.get_default_deserialization_settings()
    st['subdiv_levels'] = 0
    body = HumanService.deserialize_from_dict(info, st)
    from bl_ext.user_default.mpfb.services.targetservice import TargetService
    TargetService.bake_targets(body)
    # bake shape keys + delete-masks (body hidden under clothes) so the export is a plain skinned mesh
    ExportService.bake_modifiers_remove_helpers(body, bake_masks=True, bake_subdiv=False, remove_helpers=True, also_proxy=True)
    rig = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    rig.name = 'Armature'
    for o in bpy.data.objects:
        if o.type == 'MESH':
            # drop leftover shape keys (glTF morphs are not used)
            if o.data.shape_keys:  # apply the current mix (macro targets) and drop the keys
                bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
                bpy.context.view_layer.objects.active = o
                bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
            for m in list(o.modifiers):
                if m.type != 'ARMATURE': o.modifiers.remove(m)
            # heavy garments (boots at 15k, flats at 29k tris) are decimated: a CPU budget, and
            # invisible at documentary framing. Collapse keeps UV seams and interpolates weights.
            nf = len(o.data.polygons); cap = spec.get('face_cap', 6000)
            if nf > cap and not o.name.endswith('Human'):
                bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
                d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = cap / nf; d.use_collapse_triangulate = False
                bpy.ops.object.modifier_move_to_index(modifier='dec', index=0)
                bpy.ops.object.modifier_apply(modifier='dec')
    # textures: cap at 1024 px (cloth/skin) / 512 (small parts); CPU rendering never needs more
    for img in bpy.data.images:
        if img.size[0] == 0: continue
        cap = 1024 if max(img.size) >= 1024 else 512
        if max(img.size) > cap:
            k = cap / max(img.size); img.scale(int(img.size[0] * k), int(img.size[1] * k))
    if spec.get('arm_drop', ARM_DROP): lower_rest_arms(rig, spec.get('arm_drop', ARM_DROP))
    stats = {o.name: len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'}
    path = os.path.join(outdir, f'{wid}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', export_animations=False, export_skins=True,
        export_morph=False, export_yup=True, export_apply=False, export_image_format='AUTO', export_jpeg_quality=82,
        export_materials='EXPORT', export_texcoords=True, export_normals=True, export_tangents=False)
    print('[build]', wid, path, os.path.getsize(path), stats)
    # LOD1 for crowds: no face parts, every mesh decimated to ~2400 tris total, no images
    # (the engine reuses LOD0's materials by name).
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and any(k in o.name for k in ('eyebrow', 'eyelash', 'low-poly')): bpy.data.objects.remove(o)
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    total = sum(len(o.data.polygons) for o in meshes); ratio = min(1.0, spec.get('lod1_tris', 800) / max(1, total))
    for o in meshes:
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        d = o.modifiers.new('dec', 'DECIMATE'); d.ratio = max(ratio, 0.02)
        bpy.ops.object.modifier_move_to_index(modifier='dec', index=0); bpy.ops.object.modifier_apply(modifier='dec')
    p1 = os.path.join(outdir, f'{wid}_lod1.glb')
    bpy.ops.export_scene.gltf(filepath=p1, export_format='GLB', export_animations=False, export_skins=True, export_morph=False,
        export_yup=True, export_image_format='NONE', export_materials='EXPORT', export_texcoords=True, export_normals=True)
    print('[build]', wid + '_lod1', p1, os.path.getsize(p1), {o.name: len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH'})

ids = list(WARDROBE) if which == 'all' else which.split(',')
for w in ids: build(w, WARDROBE[w])
