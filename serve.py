#!/usr/bin/env python3
"""Local dev server for Fo Companion.
Serves index.html for any app path (SPA) and proxies /api/* to Wajo's Fo MCP
server, so the app talks to it same-origin: browsers block direct cross-origin
calls to the API, which is why Connect fails on static hosts like GitHub Pages.
"""
import http.server, socketserver, sys, urllib.request, urllib.error
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
UPSTREAM = "https://mcp.api.wajo.ai"
FWD = ["Authorization", "Content-Type", "Accept", "Mcp-Session-Id"]

class H(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split("?")[0].startswith("/api/"):
            return self.proxy()
        return super().do_GET()

    def do_POST(self):
        return self.proxy()

    def send_head(self):
        # SPA fallback: unknown app paths serve index.html (OAuth comes back to /)
        import os
        if not os.path.exists(self.translate_path(self.path.split("?")[0])):
            self.path = "/index.html"
        return super().send_head()

    def proxy(self):
        path = self.path[len("/api"):] or "/"
        if path.split("?")[0] == "/ping":
            data = b"ok"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            return self.wfile.write(data)
        req = urllib.request.Request(UPSTREAM + path, method=self.command)
        for h in FWD:
            v = self.headers.get(h)
            if v:
                req.add_header(h, v)
        if self.command not in ("GET", "HEAD"):
            n = int(self.headers.get("Content-Length") or 0)
            req.data = self.rfile.read(n) if n else None
        try:
            with urllib.request.urlopen(req) as r:
                code, body, headers = r.status, r.read(), r.headers
        except urllib.error.HTTPError as e:
            code, body, headers = e.code, e.read(), e.headers
        self.send_response(code)
        for h in ("Content-Type", "Mcp-Session-Id"):
            v = headers.get(h)
            if v:
                self.send_header(h, v)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        return self.wfile.write(body)

class S(socketserver.ThreadingTCPServer):
    allow_reuse_address = True

with S(("", PORT), H) as httpd:
    print(f"Fo Companion on http://localhost:{PORT}")
    httpd.serve_forever()
