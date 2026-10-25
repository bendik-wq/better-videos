"""Local relay for Drive files: turns open-ended Range requests into bounded 4 MB ones (Drive refuses open-ended ones on quota).
   python3 rangeproxy.py <port>     then GET http://127.0.0.1:<port>/<drive-file-id>"""
import http.server, socketserver, ssl, sys, urllib.request, re, os
ctx = ssl.create_default_context(cafile="/root/.ccr/ca-bundle.crt")
opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx), urllib.request.ProxyHandler())
SIZES, BLOCK = {}, 4 << 20
def up(fid, a, b):
    u = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
    for _ in range(5):
        try:
            r = opener.open(urllib.request.Request(u, headers={"Range": f"bytes={a}-{b}"}), timeout=60)
            if r.headers.get("Content-Type", "").startswith("video") or r.status == 206:
                return r
        except Exception as e:
            err = e
    raise IOError(f"upstream failed {a}-{b}")
def size(fid):
    if fid not in SIZES:
        SIZES[fid] = int(up(fid, 0, 0).headers["Content-Range"].split("/")[1])
    return SIZES[fid]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_HEAD(self): self.go(False)
    def do_GET(self): self.go(True)
    def go(self, body):
        fid = self.path.strip("/"); n = size(fid)
        m = re.match(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        a = int(m.group(1)) if m and m.group(1) else 0
        b = int(m.group(2)) if m and m.group(2) else n - 1
        self.send_response(206); self.send_header("Content-Type", "video/mp4"); self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {a}-{b}/{n}"); self.send_header("Content-Length", str(b - a + 1)); self.end_headers()
        if not body: return
        try:
            p = a
            while p <= b:
                q = min(b, p + BLOCK - 1)
                data = up(fid, p, q).read()
                self.wfile.write(data); p += len(data)
                if not data: break
        except (BrokenPipeError, ConnectionResetError):
            pass
class T(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True
T(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
