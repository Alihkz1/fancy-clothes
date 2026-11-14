(() => {
  'use strict';
  const form = document.querySelector('#product-form');
  const message = document.querySelector('#message');
  const previews = new Map();
  const settingsMessage = document.querySelector('#settings-message');
  function settingsNotify(text, error = false) {
    settingsMessage.textContent = text;
    settingsMessage.dataset.error = String(error);
  }
  document.querySelector('#delete-all').addEventListener('click', () => {
    if (!confirm('Delete all added products? Added products cannot be recovered.')) return;
    try {
      localStorage.removeItem(ClothingCatalog.key);
      render();
      settingsNotify('All added products deleted.');
    } catch { settingsNotify('Could not delete all items. Browser storage is unavailable.', true); }
  });
  function notify(text, error = false) {
    message.textContent = text;
    message.dataset.error = String(error);
  }
  function render() {
    const products = ClothingCatalog.read();
    document.querySelector('#empty').hidden = products.length > 0;
    document.querySelector('#saved-products').replaceChildren(...products.map(product => {
      const row = document.createElement('li');
      const image = document.createElement('img');
      image.src = product.images.front.src;
      image.alt = '';
      const name = document.createElement('span');
      name.textContent = product.name + (product.colour ? ` · ${product.colour}` : '');
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete ${product.name}`);
      remove.onclick = () => {
        if (!confirm(`Delete “${product.name}” from the rack?`)) return;
        try {
          localStorage.setItem(ClothingCatalog.key, JSON.stringify(ClothingCatalog.read().filter(item => item.id !== product.id)));
          render();
          notify('Product removed.');
        } catch { notify('Could not remove the product. Browser storage is unavailable.', true); }
      };
      row.append(image, name, remove);
      return row;
    }));
  }
  for (const input of form.querySelectorAll('[type=file]')) {
    input.addEventListener('change', () => {
      const old = previews.get(input.name);
      if (old) URL.revokeObjectURL(old);
      const image = input.parentElement.querySelector('img');
      const file = input.files[0];
      image.hidden = !file;
      image.nextElementSibling.hidden = !!file;
      if (file) { const url = URL.createObjectURL(file); previews.set(input.name, url); image.src = url; }
      else { image.removeAttribute('src'); previews.delete(input.name); }
    });
  }
  async function prepare(file, alignment) {
    if (!['image/png', 'image/webp', 'image/jpeg'].includes(file.type)) throw new Error('Use PNG, WebP, or JPEG images.');
    if (file.size > 15 * 1024 * 1024) throw new Error('Each image must be smaller than 15 MB.');
    const bitmap = await createImageBitmap(file);
    try {
      if (bitmap.width !== 1086 || bitmap.height !== 1448) {
        throw new Error(`${file.name}: upload an image exactly 1086 × 1448 pixels (width × height). This image is ${bitmap.width} × ${bitmap.height}.`);
      }
      const canvas = document.createElement('canvas');
      const width = canvas.width = 1086;
      const height = canvas.height = 1448;
      const context = canvas.getContext('2d');
      context.drawImage(bitmap, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      let x0 = width, y0 = height, x1 = 0, y1 = 0;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (pixels[(y * width + x) * 4 + 3] > 30) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      }
      if (x1 <= x0 || y1 <= y0) throw new Error('An uploaded image is empty.');
      const hookX = width * alignment.x / 100, hookY = height * alignment.y / 100;
      if (y1 <= height * alignment.neck / 100) throw new Error(`${file.name}: the garment must extend below the neck alignment position.`);
      return { src: canvas.toDataURL('image/webp', .86), metadata: {
        width, height, hookApexX: hookX, hookApexY: Math.max(0, hookY - height * .015),
        loopTopY: Math.max(0, hookY - height * .015), loopCenterX: hookX,
        loopInnerTopY: hookY - height * .005, loopInnerBottomY: hookY + height * .005,
        neckY: height * alignment.neck / 100, garmentTopY: y0, garmentBottomY: y1,
        shoulderY: height * .38, shoulderX0: x0, shoulderX1: x1, garmentX0: x0, garmentX1: x1
      } };
    } finally { bitmap.close(); }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    notify('Preparing images…');
    try {
      const data = new FormData(form);
      const name = String(data.get('name')).trim();
      if (!name) throw new Error('Enter a product name.');
      const alignment = { x: Number(data.get('hookX')), y: Number(data.get('hookY')), neck: Number(data.get('neckY')) };
      if (alignment.neck <= alignment.y) throw new Error('The neck position must be below the hook opening.');
      const images = {};
      for (const view of ['front', 'side', 'back']) {
        const file = data.get(view);
        if (file?.size) images[view] = await prepare(file, alignment);
      }
      if (!images.front || !images.side) throw new Error('Choose both front and side images.');
      const products = ClothingCatalog.read();
      products.push({ id: `custom-${crypto.randomUUID()}`, name, colour: String(data.get('colour')).trim(), images });
      localStorage.setItem(ClothingCatalog.key, JSON.stringify(products));
      form.reset();
      for (const input of form.querySelectorAll('[type=file]')) input.dispatchEvent(new Event('change'));
      render();
      notify('Product added. Open the rack to see it.');
    } catch (error) {
      notify(error.name === 'QuotaExceededError' ? 'Browser storage is full. Use smaller images or remove an added product. Your existing products have been kept.' : error.message || 'Could not save this product.', true);
    } finally { submit.disabled = false; }
  });
  window.addEventListener('storage', event => { if ([ClothingCatalog.key, null].includes(event.key)) { try { render(); } catch { notify('Saved products could not be read.', true); } } });
  try { render(); } catch { notify('Browser storage is unavailable or saved products could not be read. Existing data has not been changed.', true); }
})();
