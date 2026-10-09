// Cold Block on Cloudflare: serves the game page, runs one Durable Object per game server
// (players' state is batched and fanned out ~20 times a second), and one registry object that
// lists live servers and keeps the global leaderboard. The game file itself lives in
// games/cold-block/index.html (the same file published as a claude.ai artifact).

const MAX_MSG = 16 * 1024; // bytes per player update
const MAX_RATE = 60; // updates per second per player before we start dropping
const MAX_PLAYERS = 24; // humans per server; bots don't count
const TICK_MS = 50;

const cleanSrv = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20) || "main";
const json = (v, status = 200) => new Response(JSON.stringify(v), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const rid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const registry = (env) => env.REGISTRY.get(env.REGISTRY.idFromName("registry"));

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket upgrade", { status: 426 });
      const s = cleanSrv(url.searchParams.get("s"));
      return env.GAME.get(env.GAME.idFromName("srv:" + s)).fetch(new Request(`https://game/ws?s=${s}`, request));
    }
    if (url.pathname === "/api/servers") return registry(env).fetch("https://reg/list");
    if (url.pathname === "/api/lb") return registry(env).fetch(new Request("https://reg/lb", request));
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

// One game server. Each player's latest state is kept as a JSON string; changed states are sent to
// everyone as one batch per tick instead of one message per update per player.
export class GameRoom {
  constructor(state, env) {
    this.state = state; this.env = env;
    this.players = new Map(); // ws -> { peer, data, nm, g, dirty, windowStart, count }
    this.srv = null; this.timer = null; this.lastReport = 0; this.reported = "";
    for (const ws of state.getWebSockets()) this.adopt(ws);
  }
  adopt(ws) {
    const att = ws.deserializeAttachment() || {};
    if (att.srv) this.srv = att.srv;
    const p = { peer: att.peer || rid(), data: "{}", nm: "", g: false, dirty: false, windowStart: 0, count: 0 };
    this.players.set(ws, p);
    return p;
  }
  async fetch(request) {
    this.srv = cleanSrv(new URL(request.url).searchParams.get("s"));
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    if (this.players.size >= MAX_PLAYERS) {
      server.send('{"t":"full"}'); server.close(4000, "server full");
      return new Response(null, { status: 101, webSocket: client });
    }
    const peer = rid();
    server.serializeAttachment({ peer, srv: this.srv });
    const peers = [];
    for (const p of this.players.values()) peers.push(`{"peer":"${p.peer}","d":${p.data}}`);
    this.players.set(server, { peer, data: "{}", nm: "", g: false, dirty: false, windowStart: 0, count: 0 });
    server.send(`{"t":"hello","me":"${peer}","now":${Date.now()},"peers":[${peers.join(",")}]}`);
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (msg === '{"t":"ping"}') { try { ws.send(`{"t":"pong","now":${Date.now()}}`); } catch { /* closed */ } return; }
    const p = this.players.get(ws) || this.adopt(ws);
    if (typeof msg !== "string" || msg.length > MAX_MSG) return;
    const now = Date.now();
    if (now - p.windowStart > 1000) { p.windowStart = now; p.count = 0; }
    if (++p.count > MAX_RATE) return;
    let m;
    try { m = JSON.parse(msg); } catch { return; }
    if (!m || m.t !== "p" || typeof m.d !== "object" || m.d === null || Array.isArray(m.d)) return;
    p.data = JSON.stringify(m.d);
    const nm = typeof m.d.nm === "string" ? m.d.nm.slice(0, 16) : "", g = m.d.g === 1;
    const changed = nm !== p.nm || g !== p.g;
    p.nm = nm; p.g = g; p.dirty = true;
    if (changed) this.report(false);
    if (!this.timer) this.timer = setTimeout(() => { this.timer = null; this.flush(); }, TICK_MS);
  }
  flush() {
    const ups = [];
    for (const p of this.players.values()) if (p.dirty) { p.dirty = false; ups.push(`{"peer":"${p.peer}","d":${p.data}}`); }
    if (ups.length) this.broadcast(`{"t":"b","u":[${ups.join(",")}]}`);
    if (Date.now() - this.lastReport > 15000) this.report(true);
  }
  webSocketClose(ws) { this.drop(ws); }
  webSocketError(ws) { this.drop(ws); }
  drop(ws) {
    const p = this.players.get(ws);
    if (!p) return;
    this.players.delete(ws);
    this.broadcast(`{"t":"leave","peer":"${p.peer}"}`);
    try { ws.close(1000, "bye"); } catch { /* already closed */ }
    this.report(true);
  }
  broadcast(text) {
    for (const ws of this.players.keys()) {
      try { ws.send(text); } catch { this.players.delete(ws); }
    }
  }
  // Tell the registry who is playing here, so the menu can list live servers.
  report(force) {
    if (!this.srv) return;
    const names = [...this.players.values()].filter((p) => p.g).map((p) => p.nm || "Player");
    const key = names.join("|");
    const now = Date.now();
    if (!force && (key === this.reported || now - this.lastReport < 1500)) return;
    this.lastReport = now; this.reported = key;
    registry(this.env).fetch("https://reg/update", { method: "POST", body: JSON.stringify({ s: this.srv, names }) }).catch(() => {});
  }
}

// Live server list (in memory: servers re-report every 15 s) and the global leaderboard (stored).
export class Registry {
  constructor(state) { this.state = state; this.servers = new Map(); this.lb = null; }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/update" && request.method === "POST") {
      const b = await request.json().catch(() => ({}));
      const s = cleanSrv(b.s), names = Array.isArray(b.names) ? b.names.slice(0, 32).map((n) => String(n).slice(0, 16)) : [];
      if (names.length) this.servers.set(s, { names, t: Date.now() }); else this.servers.delete(s);
      return new Response("ok");
    }
    if (url.pathname === "/list") {
      const now = Date.now(), out = [];
      for (const [s, v] of this.servers) { if (now - v.t > 45000) { this.servers.delete(s); continue; } out.push({ s, names: v.names }); }
      out.sort((a, b) => b.names.length - a.names.length);
      return json(out.slice(0, 40));
    }
    if (url.pathname === "/lb") {
      if (!this.lb) this.lb = (await this.state.storage.get("lb")) || [];
      if (request.method === "POST") {
        const b = await request.json().catch(() => null);
        if (!b || typeof b.key !== "string" || b.key.length < 8 || b.key.length > 64) return json({ error: "bad request" }, 400);
        const n = (v, max) => (typeof v === "number" && isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);
        const row = { key: b.key, pub: String(b.pub || "").replace(/[^a-z0-9]/g, "").slice(0, 12), nm: String(b.nm || "Player").slice(0, 16), xp: n(b.xp, 1e9), lvl: n(b.lvl, 50), pr: n(b.pr, 10), k: n(b.k, 1e7), d: n(b.d, 1e7), w: n(b.w, 1e6), t: Date.now() };
        const i = this.lb.findIndex((r) => r.key === row.key);
        if (i >= 0) this.lb[i] = row; else this.lb.push(row);
        this.lb.sort((a, c) => c.pr - a.pr || c.xp - a.xp);
        this.lb = this.lb.slice(0, 200);
        await this.state.storage.put("lb", this.lb);
      }
      return json(this.lb.slice(0, 25).map(({ key, ...r }) => r));
    }
    return new Response("not found", { status: 404 });
  }
}
