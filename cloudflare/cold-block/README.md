# Cold Block on Cloudflare

Hosts the multiplayer game at your own `*.workers.dev` URL (or a custom domain).

- `src/worker.js` serves the game page and routes `/ws` to one Durable Object (`GameRoom`)
  that relays each player's state to everyone else over WebSockets.
- The page is `../../games/cold-block/index.html`, the same file that is published as a
  claude.ai artifact. Inside claude.ai it uses the artifact `room` capability; anywhere else
  it connects to `/ws` on the host it was loaded from.
- Durable Objects on the SQLite backend run on the Workers free plan.
- `soldier.json` + `soldier_0.jpg`/`soldier_1.jpg` (next to the page) is the rigged, motion-captured soldier from the three.js examples
  (`examples/models/gltf/Soldier.glb`, originally from Mixamo). If it fails to load, players fall back
  to simple box figures.

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
