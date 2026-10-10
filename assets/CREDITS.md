# Asset credits

Every third-party asset in `assets/` and `engine/vendor/`, with its licence and source. Add a line
whenever you add an asset. CC0 and PD items need no on-screen credit; the rest say so.

## Models

| File | What | Author | Licence | Source |
|---|---|---|---|---|
| `models/UAL_Mannequin.glb` | Rigged humanoid "Mannequin" (65-joint UE5-style skeleton) with 43 animation clips: idle, walk, jog, sprint, crouch, sit, talk, push, pick up, fixing, interact, death and others. File `Unreal-Godot/UAL1_Standard.glb` from the pack, unmodified. | Quaternius | CC0 1.0 (`License.txt` in the pack) | Universal Animation Library [Standard], https://quaternius.itch.io/universal-animation-library (free download, no login), downloaded 2026-10-10. sha256 `69591853d817488edaa8fd9bf8fc1d821eaeaf789f8627b3cd23b41c4ed67997` |
| `models/Soldier.glb`, `models/Xbot.glb` | three.js example characters (Mixamo-derived) | three.js examples / Mixamo | ⚠️ Adobe Mixamo terms; see `docs/research/asset-sources.md`. Prefer `UAL_Mannequin`. | three.js repo `examples/models/gltf/` |

## Code (engine/vendor)

| File | Licence | Source |
|---|---|---|
| `engine/vendor/postprocessing-6.39.5.js` | Zlib (`postprocessing-LICENSE.md`) | npm `postprocessing@6.39.5`, `build/index.js`, pmndrs |
| `engine/vendor/n8ao-2.0.1.js` | CC0 1.0 (`n8ao-LICENSE`; package.json says ISC) | npm `n8ao@2.0.1`, `dist/N8AO.js`, N8python |

## Models run offline (not shipped)

| What | Licence | Source |
|---|---|---|
| Depth Anything V2 **Small**, fp32 ONNX (`engine/depth.py`, cached in `.cache/models/`) | Apache-2.0. Base/Large/Giant are CC-BY-NC-4.0 and must not be used. | https://huggingface.co/onnx-community/depth-anything-v2-small |

## Archive photos

Archive photos live in `projects/<p>/assets/archive/` with their own `SOURCES.md`.
