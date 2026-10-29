#!/usr/bin/env python3
"""Local dev server: serves index.html for any path (SPA), so the OAuth
callback route works on http://localhost:8000 (a loopback redirect Wajo accepts)."""
import http.server, socketserver, sys
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        p = self.translate_path(self.path.split("?")[0])
        import os
        if not os.path.exists(p):
            self.path = "/index.html"
        return super().send_head()

with socketserver.TCPServer(("", PORT), H) as httpd:
    print(f"Fo Companion on http://localhost:{PORT}")
    httpd.serve_forever()
