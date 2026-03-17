import { applyPalette } from '../engine/colors.js';
import { applyTypography, applyBrandFont } from '../engine/typography.js';
import { getOverlayCSS, validateDesign } from '../engine/rules.js';

const CANVAS_DIMS = {
  square:     { w: 1080, h: 1080 },
  vertical:   { w: 1080, h: 1920 },
  horizontal: { w: 1200, h: 628 },
};

export class Preview {
  constructor(onExport) {
    this.onExport = onExport;
    this.currentVariant = null;
    this.currentCanvas = null;
  }

  init() {
    this.modal     = document.getElementById('preview-modal');
    this.backdrop  = document.getElementById('preview-backdrop');
    this.title     = document.getElementById('preview-title');
    this.body      = document.getElementById('preview-body');
    this.btnClose  = document.getElementById('btn-close-preview');
    this.btnPng    = document.getElementById('btn-export-single');
    this.btnJpg    = document.getElementById('btn-export-jpg');

    this.btnClose.addEventListener('click', () => this.hide());
    this.backdrop.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.hidden) this.hide();
    });

    this.btnPng.addEventListener('click', () => {
      if (this.currentVariant) this.onExport(this.currentVariant, 'png');
    });
    this.btnJpg.addEventListener('click', () => {
      if (this.currentVariant) this.onExport(this.currentVariant, 'jpg');
    });
  }

  show(variant) {
    this.currentVariant = variant;
    this.title.textContent = `Variant #${variant.id} · ${variant.format}`;
    this.body.innerHTML = '';

    const canvas = this._renderFullSize(variant);
    this.currentCanvas = canvas;
    this.body.appendChild(this._wrapScaled(canvas, variant.format));
    requestAnimationFrame(() => this._fitTextElements(canvas));

    this.modal.hidden = false;
  }

  hide() {
    this.modal.hidden = true;
    this.body.innerHTML = '';
    this.currentCanvas = null;
    this.currentVariant = null;
  }

  getCanvasElement() {
    return this.currentCanvas;
  }

  /** Render a full-size canvas for a variant (public API for batch export). */
  renderFullSize(variant) {
    return this._renderFullSize(variant);
  }

  /**
   * Render a full-size canvas for export: mounted to DOM with text fitting applied.
   * Returns { canvas, cleanup } — call cleanup() when done capturing.
   */
  renderForExport(variant) {
    const canvas = this._renderFullSize(variant);
    const dims = CANVAS_DIMS[variant.format] || CANVAS_DIMS.square;

    // Mount offscreen so the browser computes layout (needed for dom-to-image)
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      left: '-99999px',
      top: '0',
      width: dims.w + 'px',
      height: dims.h + 'px',
      overflow: 'hidden',
    });
    container.appendChild(canvas);
    document.body.appendChild(container);

    // Run text fitting synchronously (element is in DOM, layout is computed)
    this._fitTextElements(canvas);

    const cleanup = () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    return { canvas, cleanup };
  }

  // ---------------------------------------------------------------------------
  // Full-size rendering
  // ---------------------------------------------------------------------------

  _renderFullSize(variant) {
    const { format, layout, content, palette, fontPairing } = variant;

    const validated = validateDesign({ palette, layout, format });
    const correctedPalette = validated.palette;

    const canvas = document.createElement('div');
    canvas.className = `ad-canvas ad-canvas--${format}`;

    applyPalette(canvas, correctedPalette);
    applyTypography(canvas, fontPairing, format);
    if (variant.brandFont) {
      applyBrandFont(canvas, variant.brandFont);
    }

    if (layout.hasOverlay) {
      this._buildOverlayLayout(canvas, layout, content, correctedPalette);
    } else {
      canvas.style.backgroundColor = correctedPalette.surface;
      this._buildGridLayout(canvas, layout, content, correctedPalette);
    }

    return canvas;
  }

  _buildOverlayLayout(canvas, layout, content, palette) {
    if (content.image) {
      const bg = document.createElement('img');
      const imgData = typeof content.image === 'object' ? content.image : { url: content.image };
      bg.src = imgData.url;
      bg.alt = '';
      let fx = imgData.focalX ?? 50;
      let fy = imgData.focalY ?? 33;
      if (imgData.focalX2 != null && imgData.focalY2 != null) {
        fx = Math.round((fx + imgData.focalX2) / 2);
        fy = Math.round((fy + imgData.focalY2) / 2);
      }
      Object.assign(bg.style, {
        position: 'absolute', inset: '0',
        width: '100%', height: '100%', objectFit: 'cover',
        objectPosition: `${fx}% ${fy}%`,
      });
      canvas.appendChild(bg);
    }

    const overlay = document.createElement('div');
    overlay.className = getOverlayCSS(layout.overlayType);
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0',
      display: 'grid',
    });

    const grid = document.createElement('div');
    grid.className = `ad-grid ${layout.cssClass}`;
    this._placeElements(grid, layout, content, palette, true);
    overlay.appendChild(grid);
    canvas.appendChild(overlay);
  }

  _buildGridLayout(canvas, layout, content, palette) {
    const grid = document.createElement('div');
    grid.className = `ad-grid ${layout.cssClass}`;
    this._placeElements(grid, layout, content, palette, false);
    canvas.appendChild(grid);
  }

  _placeElements(grid, layout, content, palette, isOverlay) {
    for (const area of layout.areas) {
      if (isOverlay && area === 'image') continue;

      const el = this._createElement(area, content, palette);
      if (el) {
        el.style.gridArea = area;
        grid.appendChild(el);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Element factories
  // ---------------------------------------------------------------------------

  _createElement(area, content, palette) {
    switch (area) {
      case 'image':      return this._makeImage(content.image, 'ad-el-image');
      case 'image2':     return this._makeImage(content.image2, 'ad-el-image');
      case 'logo':       return this._makeImage(content.logo, 'ad-el-logo');
      case 'headline':   return this._makeText('ad-el-headline', content.headline);
      case 'subheadline':return this._makeText('ad-el-subheadline', content.subheadline);
      case 'cta':        return this._makeCta(content.cta);
      case 'social':     return this._makeText('ad-el-social-proof', content.socialProof);
      case 'offer':      return this._makeOffer(content.offer);
      case 'stripe':     return this._makeStripe(palette);
      default:           return null;
    }
  }

  _makeImage(src, className) {
    if (!src) return null;
    const wrap = document.createElement('div');
    wrap.className = className;
    const img = document.createElement('img');
    if (typeof src === 'object' && src.url) {
      img.src = src.url;
      let fx = src.focalX ?? 50;
      let fy = src.focalY ?? 33;
      if (src.focalX2 != null && src.focalY2 != null) {
        fx = Math.round((fx + src.focalX2) / 2);
        fy = Math.round((fy + src.focalY2) / 2);
      }
      img.style.objectPosition = `${fx}% ${fy}%`;
    } else {
      img.src = src;
    }
    img.alt = '';
    wrap.appendChild(img);
    return wrap;
  }

  _makeText(className, text) {
    if (!text) return null;
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    return div;
  }

  _makeCta(text) {
    if (!text) return null;
    const div = document.createElement('div');
    div.className = 'ad-el-cta';
    const btn = document.createElement('span');
    btn.className = 'ad-el-cta__button';
    btn.textContent = text;
    div.appendChild(btn);
    return div;
  }

  _makeOffer(text) {
    if (!text) return null;
    const div = document.createElement('div');
    div.className = 'ad-el-offer';
    const badge = document.createElement('span');
    badge.className = 'ad-el-offer__badge';
    badge.textContent = text;
    div.appendChild(badge);
    return div;
  }

  _makeStripe(palette) {
    const div = document.createElement('div');
    div.style.backgroundColor = palette.primary;
    return div;
  }

  /**
   * Reduce text font-size until it fits within its grid cell.
   * Called after the ad DOM is built and appended.
   */
  _fitTextElements(canvas) {
    for (const selector of ['.ad-el-headline', '.ad-el-subheadline']) {
      const el = canvas.querySelector(selector);
      if (!el) continue;

      const computedStyle = getComputedStyle(el);
      let fontSize = parseFloat(computedStyle.fontSize);
      if (!fontSize || fontSize <= 0) continue;

      const minFontSize = fontSize * 0.4;
      let iterations = 0;

      while (fontSize > minFontSize && iterations < 15) {
        if (el.scrollHeight <= el.clientHeight + 2 &&
            el.scrollWidth <= el.clientWidth + 2) {
          break;
        }
        fontSize *= 0.9;
        el.style.fontSize = `${fontSize}px`;
        iterations++;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Viewport scaling
  // ---------------------------------------------------------------------------

  _wrapScaled(canvas, format) {
    const dims = CANVAS_DIMS[format];
    const maxW = window.innerWidth * 0.8;
    const maxH = window.innerHeight * 0.75;
    const scale = Math.min(maxW / dims.w, maxH / dims.h, 1);

    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top left';

    const wrapper = document.createElement('div');
    wrapper.className = 'preview-wrapper';
    Object.assign(wrapper.style, {
      width:    `${dims.w * scale}px`,
      height:   `${dims.h * scale}px`,
      overflow: 'hidden',
    });
    wrapper.appendChild(canvas);
    return wrapper;
  }
}
