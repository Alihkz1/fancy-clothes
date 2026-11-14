'use strict';
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'site');
const output = path.join(root, 'dist');
// Only clean this project's generated output, never a supplied or computed input.
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid output directory.');
fs.rmSync(output, { recursive: true, force: true });
fs.cpSync(source, output, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(root, 'image-manifest.json'), 'utf8'));
const products = path.join(output, 'products');
fs.mkdirSync(products, { recursive: true });
for (const [slug, [front, , side]] of Object.entries(manifest)) {
  for (const view of ['front', 'side', 'back']) {
    // Preserve the saved copy's existing fallback for missing back/side images.
    const name = view === 'side' ? side || front : front;
    fs.copyFileSync(path.join(source, '_next', `${name}.html`), path.join(products, `${slug}-${view}.webp`));
  }
}
fs.copyFileSync(path.join(source, '_next', 'image.html'), path.join(products, 'logo.webp'));

const imagePath = url => url === '/snug-wrld-logo.png' ? '/products/logo.webp' : url;
const htmlFile = path.join(output, 'index.html');
let html = fs.readFileSync(htmlFile, 'utf8');
html = html.replace(/\/_next\/image\?url=([^&"'<>\s]+)(?:(?:&amp;|&)w=\d+)?(?:(?:&amp;|&)q=\d+)?/g,
  (_, url) => imagePath(decodeURIComponent(url)));
fs.writeFileSync(htmlFile, html);

// The saved Next Image loader is the sole runtime dependency on serve.py.
const bundleFile = path.join(output, '_next', 'static', 'chunks', '3blbtxmnfr2k9.js');
let bundle = fs.readFileSync(bundleFile, 'utf8');
const loader = /return `\$\{t\.path\}\?url=\$\{encodeURIComponent\(e\)\}[^\r\n]+/g;
const matches = [...bundle.matchAll(loader)];
if (matches.length !== 1) throw new Error('Saved image loader changed; static build needs updating.');
bundle = bundle.replace(loader, 'return e === "/snug-wrld-logo.png" ? "/products/logo.webp" : e');
fs.writeFileSync(bundleFile, bundle);
console.log(`Static site built in dist/ with ${Object.keys(manifest).length * 3 + 1} image files. No Python runtime required.`);
