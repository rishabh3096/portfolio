#!/usr/bin/env python3
"""Tiny dev server: no-cache headers (so edits show on refresh) and correct .mjs MIME type.
Run:  python3 serve.py   ->  http://localhost:5173
"""
import http.server, mimetypes, os, sys

mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('image/webp', '.webp')
mimetypes.add_type('image/svg+xml', '.svg')

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        if code == 404 and os.path.exists('404.html'):
            body = open('404.html', 'rb').read()
            self.send_response(404)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            super().send_error(code, message, explain)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
