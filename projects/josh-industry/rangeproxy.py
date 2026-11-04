"""Local relay for Drive files: turns open-ended Range requests into bounded 4 MB ones fetched with curl
(Drive refuses open-ended ranges once a file's download quota is hit). Retries with backoff; checks every block's length.
   python3 rangeproxy.py <port>     then GET http://127.0.0.1:<port>/<drive-file-id>"""
import http.server, socketserver, subprocess, sys, re, time
SIZES, BLOCK = {}, 256 << 10
def url(fid): return f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
def up(fid, a, b):
    for i in range(10):
        if i: time.sleep(min(30, 2 ** i))
        r = subprocess.run(["curl", "-sSL", "-m", "120", "-r", f"{a}-{b}", url(fid)], capture_output=True)
        if r.returncode == 0 and len(r.stdout) == b - a + 1:
            return r.stdout
    raise IOError(f"upstream failed {a}-{b}")
def size(fid):
    if fid not in SIZES:
        for i in range(10):
            r = subprocess.run(["curl", "-sSL", "-m", "60", "-r", "0-0", "-D", "-", "-o", "/dev/null", url(fid)], capture_output=True, text=True)
            m = re.search(r"content-range: bytes 0-0/(\d+)", r.stdout, re.I)
            if m:
                SIZES[fid] = int(m.group(1)); break
            time.sleep(min(30, 2 ** (i + 1)))
    return SIZES[fid]
class H(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_HEAD(self): self.go(False)
    def do_GET(self): self.go(True)
    def go(self, body):
        fid = self.path.strip("/"); n = size(fid)
        m = re.match(r"bytes=(\d*)-(\d*)", self.headers.get("Range", ""))
        a = int(m.group(1)) if m and m.group(1) else 0
        b = min(n - 1, int(m.group(2))) if m and m.group(2) else n - 1
        self.send_response(206); self.send_header("Content-Type", "video/mp4"); self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {a}-{b}/{n}"); self.send_header("Content-Length", str(b - a + 1)); self.end_headers()
        if not body: return
        try:
            p = a
            while p <= b:
                q = min(b, p + BLOCK - 1)
                self.wfile.write(up(fid, p, q)); p = q + 1
        except (BrokenPipeError, ConnectionResetError):
            pass
class T(socketserver.ThreadingMixIn, http.server.HTTPServer): daemon_threads = True
T(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
