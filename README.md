# Fancy Clothes 👕

<div dir="rtl">

یه سایت فروشگاه لباس با یه رگال لباس متحرک. روی هر لباس که کلیک کنی، بزرگ می‌شه و جزئیاتش رو نشون می‌ده.

[English guide below ⬇️](#english)

## چطوری اجراش کنم؟ (۳ قدم)

### قدم ۱: دانلود

بالای همین صفحه روی دکمهٔ سبز **`<> Code`** بزن و بعد **`Download ZIP`** رو انتخاب کن.
فایل دانلودشده رو باز کن (Unzip) تا یه پوشه بشه.

### قدم ۲: نصب پایتون (فقط یه بار)

- **مک:** معمولاً از قبل نصبه. برو قدم ۳.
- **ویندوز:** از [python.org/downloads](https://www.python.org/downloads/) دانلود و نصبش کن.
  ⚠️ موقع نصب حتماً تیک **`Add Python to PATH`** رو بزن.

### قدم ۳: اجرا

توی پوشه‌ای که باز کردی:

- **مک:** روی فایل **`start-mac.command`** دوبار کلیک کن.
- **ویندوز:** روی فایل **`start-windows.bat`** دوبار کلیک کن.

سایت خودش توی مرورگر باز می‌شه. 🎉
اگه باز نشد، این آدرس رو توی مرورگر بزن: **http://localhost:8080**

برای بستن سایت، پنجرهٔ سیاه (ترمینال) رو ببند.

## مشکل داری؟

| مشکل | راه‌حل |
|---|---|
| مک می‌گه «نمی‌شه بازش کرد چون از یه توسعه‌دهندهٔ ناشناسه» | روی فایل **راست‌کلیک** کن، **Open** رو بزن، بعد دوباره **Open**. |
| ویندوز می‌گه `python` پیدا نشد | پایتون رو دوباره نصب کن و این بار تیک `Add Python to PATH` رو بزن. |
| می‌گه پورت 8080 درگیره | یه بار دیگه سایت بازه. اون پنجره رو ببند و دوباره امتحان کن. |

## روش دستی (برای کسایی که با ترمینال کار می‌کنن)

</div>

```bash
python3 serve.py
```

<div dir="rtl">

روی ویندوز به جای `python3` بنویس `python`.
اگه می‌خوای روی یه پورت دیگه اجرا بشه: `python3 serve.py 3000`

</div>

---

<a id="english"></a>

## English

A clothing store website with an animated clothes rack. Click any item to see it up close.

### How to run it (3 steps)

1. **Download:** click the green **`<> Code`** button at the top of this page → **`Download ZIP`**, then unzip it.
2. **Install Python (one time only):**
   - **Mac:** usually already installed, so skip this step.
   - **Windows:** install it from [python.org/downloads](https://www.python.org/downloads/). ⚠️ Tick **`Add Python to PATH`** during setup.
3. **Run:** in the unzipped folder, double-click
   - **Mac:** `start-mac.command`
   - **Windows:** `start-windows.bat`

The site opens in your browser by itself. If it doesn't, go to **http://localhost:8080**.
To stop the site, close the black terminal window.

**Mac says the file is from an unidentified developer?** Right-click the file → **Open** → **Open**.

**Prefer the terminal?**

```bash
python3 serve.py
```

### What's inside

| File / folder | What it is |
|---|---|
| `site/` | The website itself |
| `serve.py` | A tiny local server that runs the site. Nothing to install: it only needs Python. |
| `start-mac.command` | Double-click to run on Mac |
| `start-windows.bat` | Double-click to run on Windows |


## Adding products

Run the existing local server, then open **http://localhost:8080/add** (or **/add-product.html**).
Enter a name and upload front and side images; a back image and colour are optional.
Use transparent PNG or WebP images showing the garment and hanger, with consistent framing.
The optional hanger alignment fields control where the image attaches to the rail.
All uploaded images must be exactly 1086 x 1448 pixels; other sizes are rejected. Each view is
fitted within the built-in product's height and width without stretching, including previously
saved products. Images are converted to WebP and saved with the product in browser localStorage
under `fancy-clothes:products:v1`. Products appear on the main rack after opening or refreshing it.
They are specific to the browser and origin (including port), are not uploaded to a server, and
will be lost if browser site data is cleared. Storage-full errors preserve existing products.
The page also lists locally added products and allows deleting them after confirmation.

The main page contains only the animated rack. Product details retain a close control.
`site/catalog.js` adapts custom products to the saved rack bundle. Since this repository contains
compiled Next.js files, the rack bundle includes a small catalog integration and its bootstrap
uses client rendering instead of hydrating a fixed product snapshot.
These changes must be retained if replacing the saved bundles.

The built-in product is always shown on the rack and cannot be hidden. Delete all added products requires confirmation and removes only locally added products; other applications' localStorage is preserved. Open rack tabs refresh when added products change in another tab.


## Deploy to Vercel

The production build is static; Python is only the local development server.
Run `npm run build` to create `dist/`. The build copies the site (including the
built-in product images in `site/products/`) and updates the saved Next Image
loader to use the static files directly.
No dependencies or environment variables are needed.

1. Commit and push the project to GitHub. Include package.json, vercel.json,
   image-manifest.json and scripts/build-static.cjs, as well as the site files.
2. In Vercel, choose Add New > Project and import the repository.
3. Use Framework Preset Other, Root Directory ./ (repository root),
   Build Command npm run build, Output Directory dist.
4. Deploy. The rack is at / and the editor is at /add (also /add-product.html).

Do not select Next.js: this is a saved static copy, not an original Next.js project.
The built-in product's three images are included in the deployment. Added
products remain in browser localStorage and are separate for every origin.
Localhost uploads do not migrate to the deployed domain, and edits are not shared
with other visitors. Original missing back images retain their front-image fallback.
