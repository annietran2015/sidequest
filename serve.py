#!/usr/bin/env python3
"""Simple SPA-aware static file server for Expo web export."""
import os, sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

DIST = os.path.join(os.path.dirname(__file__), 'dist')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8081

class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST, **kwargs)

    def do_GET(self):
        # Strip query string
        path = self.path.split('?')[0].split('#')[0]
        full = os.path.join(DIST, path.lstrip('/'))

        # Serve file if it exists
        if os.path.isfile(full):
            return super().do_GET()
        # Try with .html extension
        if os.path.isfile(full + '.html'):
            self.path = path + '.html'
            return super().do_GET()
        # Fallback to index.html for SPA routing
        self.path = '/index.html'
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass  # suppress logs

print(f'Serving SideQuest on http://localhost:{PORT}', flush=True)
HTTPServer(('', PORT), SPAHandler).serve_forever()
