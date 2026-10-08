// Cold Block on Cloudflare: serves the game page and runs one Durable Object that relays
// each player's state to everyone else over WebSockets. The game file itself lives in
// games/cold-block/index.html (the same file published as a claude.ai artifact).

const MAX_MSG = 16 * 1024; // bytes per player update
const MAX_RATE = 60; // updates per second per player before we start dropping

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket upgrade", { status: 426 });
      const stub = env.GAME.get(env.GAME.idFromName("global"));
      return stub.fetch(request);
    }
    if (url.pathname === "/favicon.ico") return new Response(null, { status: 204 });
    if (url.pathname === "/") {
      // The game file is written as an artifact body (no <html>/<head>), so wrap it in a proper document.
      const asset = await env.ASSETS.fetch(new Request(url, request));
      if (!asset.ok) return asset;
      const body = await asset.text();
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="theme-color" content="#0d0f0c"></head><body>${body}</body></html>`;
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
    }
    return env.ASSETS.fetch(request);
  },
};

export class GameRoom {
  constructor(state) {
    this.state = state;
    this.players = new Map(); // ws -> { peer, data, windowStart, count }
    // After hibernation, re-attach any sockets that are still open. Their state arrives with their next update.
    for (const ws of state.getWebSockets()) {
      const att = ws.deserializeAttachment() || {};
      this.players.set(ws, { peer: att.peer || crypto.randomUUID().slice(0, 12), data: "{}", windowStart: 0, count: 0 });
    }
  }

  async fetch() {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    const peer = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    server.serializeAttachment({ peer });
    const peers = [];
    for (const p of this.players.values()) peers.push(`{"peer":"${p.peer}","d":${p.data}}`);
    this.players.set(server, { peer, data: "{}", windowStart: 0, count: 0 });
    server.send(`{"t":"hello","me":"${peer}","peers":[${peers.join(",")}]}`);
    return new Response(null, { status: 101, webSocket: client });
  }

  webSocketMessage(ws, msg) {
    if (msg === '{"t":"ping"}') { try { ws.send('{"t":"pong"}'); } catch { /* closed */ } return; }
    let p = this.players.get(ws);
    if (!p) { // socket from before this object woke up from hibernation
      const att = ws.deserializeAttachment() || {};
      p = { peer: att.peer || crypto.randomUUID().replace(/-/g, "").slice(0, 12), data: "{}", windowStart: 0, count: 0 };
      this.players.set(ws, p);
    }
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    const now = Date.now();
    if (now - p.windowStart > 1000) { p.windowStart = now; p.count = 0; }
    if (++p.count > MAX_RATE) return;
    let m;
    try { m = JSON.parse(msg); } catch { return; }
    if (!m || m.t !== "p" || typeof m.d !== "object" || m.d === null || Array.isArray(m.d)) return;
    p.data = JSON.stringify(m.d);
    this.broadcast(`{"t":"p","peer":"${p.peer}","d":${p.data}}`, ws);
  }

  webSocketClose(ws) { this.drop(ws); }
  webSocketError(ws) { this.drop(ws); }

  drop(ws) {
    const p = this.players.get(ws);
    if (!p) return;
    this.players.delete(ws);
    this.broadcast(`{"t":"leave","peer":"${p.peer}"}`, ws);
    try { ws.close(1000, "bye"); } catch { /* already closed */ }
  }

  broadcast(text, except) {
    for (const ws of this.players.keys()) {
      if (ws === except) continue;
      try { ws.send(text); } catch { this.players.delete(ws); }
    }
  }
}
