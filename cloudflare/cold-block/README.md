# Cold Block on Cloudflare

Hosts the multiplayer game at your own `*.workers.dev` URL (or a custom domain).

- `src/worker.js` serves the game page and routes `/ws` to one Durable Object (`GameRoom`)
  that relays each player's state to everyone else over WebSockets.
- The page is `../../games/cold-block/index.html`, the same file that is published as a
  claude.ai artifact. Inside claude.ai it uses the artifact `room` capability; anywhere else
  it connects to `/ws` on the host it was loaded from.
- Durable Objects on the SQLite backend run on the Workers free plan.
- `soldier.json` + `soldier_0.jpg` (next to the page): "Tactical Soldier Variant A", a modern soldier with
  helmet, balaclava and plate carrier, rigged with idle/walk/run captures, CC0 from the Summer Engine asset
  store (https://www.summerengine.com/asset-store/tactical-soldier-variant-a-200d9fd7). If it fails to load,
  players fall back to simple box figures.
- `guns/` holds the firearms: AK-47, M4A1, shotgun, sniper rifle, Makarov, Luger, M3 Grease Gun and Suomi
  KP/-31 from the CC0 "Free CC0 Guns & Explosives Pack" by 3DModelsCC0 (https://3dmodelscc0.itch.io/free-cc0-guns-explosives-pack),
  converted to one quantized mesh file (`guns.json`) plus colour, normal and roughness/metalness JPGs per gun.
- `sfx/` holds recorded gunshots (close and distant takes) from The Free Firearm Sound Library (CC0,
  https://opengameart.org/content/the-free-firearm-sound-library) and reloads by SpringySpringo (CC0,
  https://opengameart.org/content/gun-reload-sounds).
- `world/` holds the city's look:
  - facades, asphalt, paving, grass, gravel, concrete, bark and leaf textures from ambientCG (CC0, https://ambientcg.com);
  - the sky, `kloofendal_48d_partly_cloudy_puresky` from Poly Haven (CC0, https://polyhaven.com), which also lights the scene;
  - street props (jersey barriers, dumpsters, street lights, payphones, cones, benches, bins, AC units, water
    towers, electrical boxes, portaloos) from 3DModelsCC0's CC0 City Environment packs 1 and 2 on itch.io;
  - the sedan, "A red mid-sized four door sedan" by TopoSphere via Sloyd (CC BY 4.0,
    https://www.sloyd.ai/free-3d-models/model/a-red-mid-sized-four-door-sedan-1990s-to-early-2000s-04dtwkw5),
    repainted into six colours.

## Deploy

```bash
cd cloudflare/cold-block
npm install
npx wrangler login        # or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npx wrangler deploy
```

Wrangler prints the URL (`https://cold-block.<your-subdomain>.workers.dev`). Send it to friends;
everyone who enters the same server name plays together. No sign-in is needed.

A token for `CLOUDFLARE_API_TOKEN` can be made from the "Edit Cloudflare Workers" template at
dash.cloudflare.com → My Profile → API Tokens.

## Run locally

```bash
npx wrangler dev
```

Open http://localhost:8787 in two browser windows.
