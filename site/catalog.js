/* The saved rack bundle calls this adapter before calculating its layout. */
(() => {
  'use strict';
  const key = 'fancy-clothes:products:v1';
  const defaultsKey = 'fancy-clothes:show-defaults:v1';
  const showDefaults = () => localStorage.getItem(defaultsKey) !== 'false';
  function read() {
    const products = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(products)) throw new Error('Saved products could not be read.');
    return products;
  }
  window.ClothingCatalog = { key, defaultsKey, read, showDefaults };
  window.extendClothingRack = (products, metadata, scales) => {
    try {
      // Measure the original collection before appending custom products.
      // Image dimensions alone do not describe the size of the visible garment.
      const median = values => {
        values.sort((a, b) => a - b);
        const middle = Math.floor(values.length / 2);
        return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
      };
      const originals = products.filter(product => !product.slug.startsWith('custom-'));
      const sizes = {};
      for (const view of ['front', 'side', 'back']) {
        const references = originals.map(product => product[view] || product.front).filter(src => metadata[src]);
        sizes[view] = {
          height: median(references.map(src => {
            const image = metadata[src];
            const hookY = (image.loopInnerTopY + image.loopInnerBottomY) / 2;
            return (image.garmentBottomY - hookY) * (scales[src] ?? 1) / image.width;
          })),
          width: median(references.map(src => {
            const image = metadata[src];
            return (image.garmentX1 - image.garmentX0) * (scales[src] ?? 1) / image.width;
          }))
        };
      }
      // Keep the originals as sizing references even when they are hidden.
      if (!showDefaults()) products.splice(0, products.length);
      for (const product of read()) {
        if (typeof product.id !== 'string' || typeof product.name !== 'string' || !product.images?.front || !product.images?.side) continue;
        const valid = image => image?.metadata && ['width', 'height', 'loopCenterX', 'loopInnerTopY', 'loopInnerBottomY', 'neckY', 'garmentTopY', 'garmentBottomY', 'shoulderX0', 'shoulderX1', 'garmentX0', 'garmentX1'].every(key => Number.isFinite(image.metadata[key])) && image.metadata.width > 0 && image.metadata.height > 0 && image.metadata.garmentBottomY > image.metadata.garmentTopY;
        if (!valid(product.images.front) || !valid(product.images.side)) continue;
        const item = { slug: product.id, name: product.name, colour: product.colour || '', url: '#' };
        for (const view of ['front', 'side', 'back']) {
          const image = product.images[view];
          if (!valid(image) || !/^data:image\/(png|webp|jpeg);base64,/.test(image.src)) continue;
          item[view] = image.src;
          metadata[image.src] = image.metadata;
        }
        if (!item.front || !item.side) continue;
        for (const view of ['front', 'side', 'back']) {
          if (!item[view]) continue;
          const image = metadata[item[view]];
          // Fit the actual visible garment inside the original collection's
          // height AND width. In particular, a wide side upload must not turn
          // into a front-sized garment on the rail. Preserve image proportions.
          const hookY = (image.loopInnerTopY + image.loopInnerBottomY) / 2;
          const heightScale = sizes[view].height * image.width / Math.max(1, image.garmentBottomY - hookY);
          const widthScale = sizes[view].width * image.width / Math.max(1, image.garmentX1 - image.garmentX0);
          scales[item[view]] = Math.min(heightScale, widthScale);
        }
        products.push(item);
      }
      // Keep all items within the rail, including newly added products.
      const width = Math.min(22.5, 68 / (Math.max(1, products.length - 1) * .33 + 1.5));
      const style = document.createElement('style');
      style.textContent = `.rack{--iw:min(36vh,${width}vw)}`;
      document.head.append(style);
      window.addEventListener('storage', event => {
        if (event.key === key || event.key === defaultsKey || event.key === null) location.reload();
      });
    } catch (error) {
      console.error('Unable to load custom clothing products.', error);
    }
  };
})();
