#!/usr/bin/env python3
"""Serve the saved snugwrld.netlify.app copy locally.

The saved copy stores Next.js optimized images under hashed filenames, so
/_next/image?url=... requests are mapped back to those files here. Images
saved as real files under site/ (such as the built-in product) are served
from their own paths instead.
Usage: python3 serve.py [port]   (default 8080)
"""
import os
import json
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site")
MANIFEST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "image-manifest.json")

# (large front, small front, side) — None falls back to the next available image
with open(MANIFEST, encoding="utf-8") as manifest:
    PRODUCTS = json.load(manifest)

CONTENT_TYPES = {
    ".png": "image/png",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
}

# Friendly routes mapped to the saved HTML files.
REWRITES = {
    "/add": "/add-product.html",
    "/add/": "/add-product.html",
}


def local_file(url):
    """Return a real file path for a URL under site/, or None."""
    path = os.path.normpath(os.path.join(ROOT, url.lstrip("/")))
    if not path.startswith(ROOT + os.sep) or not os.path.isfile(path):
        return None
    return path


def resolve_image(url, width):
    # Images saved as real files are served directly, at any requested width.
    local = local_file(url)
    if local:
        return local
    if url == "/snug-wrld-logo.png":
        return os.path.join(ROOT, "_next", "image.html")
    name = os.path.basename(url).rsplit(".", 1)[0]
    for slug, (large, small, side) in PRODUCTS.items():
        if name.startswith(slug + "-"):
            view = name[len(slug) + 1:]
            front = small if (small and width <= 512) else large
            if view == "side":
                return os.path.join(ROOT, "_next", (side or front) + ".html")
            return os.path.join(ROOT, "_next", front + ".html")  # "front", and "back" which wasn't saved
    return None


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # Revalidate editable pages and scripts instead of keeping old rack code.
        if urlparse(self.path).path.endswith((".html", ".js", ".css")) or self.path == "/":
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/_next/image":
            qs = parse_qs(parsed.query)
            width = int(qs.get("w", ["0"])[0] or 0)
            path = resolve_image(qs.get("url", [""])[0], width)
            if not path or not os.path.exists(path):
                return self.send_error(404)
            with open(path, "rb") as f:
                data = f.read()
            content_type = CONTENT_TYPES.get(os.path.splitext(path)[1].lower())
            if content_type is None:
                # Saved Next image wrappers (.html) contain WebP data.
                content_type = "image/webp" if path.startswith(os.path.join(ROOT, "_next")) else "application/octet-stream"
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "public, max-age=3600")
            self.end_headers()
            self.wfile.write(data)
            return
        self.path = REWRITES.get(parsed.path, parsed.path)  # drop query strings like ?favicon...
        super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    url = f"http://localhost:{port}"
    print(f"Site is running at {url}  (press Ctrl+C to stop)")
    if os.environ.get("NO_BROWSER") != "1":
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
