/**
 * Export manager using dom-to-image-more (foreignObject-based).
 *
 * Uses the browser's native rendering engine via SVG <foreignObject>,
 * which correctly handles CSS Grid, custom properties, object-fit, etc.
 */

const DIMS = {
  square:     { w: 1080, h: 1080 },
  vertical:   { w: 1080, h: 1920 },
  horizontal: { w: 1200, h: 628 },
};

export class ExportManager {
  /**
   * Export a single variant as PNG or JPEG.
   * @param {HTMLElement} canvasElement — the .ad-canvas DOM element (must be in the DOM)
   * @param {Object} variant — the DesignVariant object (for filename / format)
   * @param {string} imageFormat — 'png' or 'jpeg'/'jpg'
   */
  async exportSingle(canvasElement, variant, imageFormat = 'png') {
    const dims = DIMS[variant.format] || DIMS.square;
    const isJpeg = imageFormat === 'jpeg' || imageFormat === 'jpg';
    const ext = isJpeg ? 'jpg' : 'png';

    const captureOpts = {
      width: dims.w,
      height: dims.h,
      style: { transform: 'none', transformOrigin: 'top left' },
      cacheBust: true,
    };

    let blob;
    if (isJpeg) {
      const canvas = await window.domtoimage.toCanvas(canvasElement, captureOpts);
      blob = await this._canvasToBlob(canvas, 'image/jpeg', 0.95);
    } else {
      blob = await window.domtoimage.toBlob(canvasElement, captureOpts);
    }

    const filename = `gridads-${variant.format || 'export'}-variant${variant.id}.${ext}`;
    this._download(blob, filename);
  }

  /**
   * Export multiple variants as a ZIP file.
   * Each item must have { canvasElement (in the DOM), variant, cleanup }.
   * @param {Array} items
   * @param {string} imageFormat
   */
  async exportBatch(items, imageFormat = 'png') {
    const zip = new window.JSZip();
    const isJpeg = imageFormat === 'jpeg' || imageFormat === 'jpg';
    const ext = isJpeg ? 'jpg' : 'png';

    for (const { canvasElement, variant } of items) {
      const dims = DIMS[variant.format] || DIMS.square;
      const captureOpts = {
        width: dims.w,
        height: dims.h,
        style: { transform: 'none', transformOrigin: 'top left' },
        cacheBust: true,
      };

      let blob;
      if (isJpeg) {
        const canvas = await window.domtoimage.toCanvas(canvasElement, captureOpts);
        blob = await this._canvasToBlob(canvas, 'image/jpeg', 0.95);
      } else {
        blob = await window.domtoimage.toBlob(canvasElement, captureOpts);
      }

      const filename = `gridads-${variant.format || 'export'}-variant${variant.id}.${ext}`;
      zip.file(filename, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this._download(zipBlob, `gridads-export-${Date.now()}.zip`);
  }

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  _canvasToBlob(canvas, type, quality) {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality));
  }
}
