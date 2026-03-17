import { applyPalette } from '../engine/colors.js';
import { applyTypography, applyBrandFont } from '../engine/typography.js';
import { getOverlayCSS, validateDesign } from '../engine/rules.js';
import { fitTextElements } from '../utils/text-fit.js';

const FORMATS = {
  square:     { width: 1080, height: 1080, aspect: 1 },
  vertical:   { width: 1080, height: 1920, aspect: 0.5625 },
  horizontal: { width: 1200, height: 628,  aspect: 1.91 },
};

const CARD_WIDTH = 260;

export class Gallery {
  /**
   * @param {function} onPreview — called with a variant when its card is clicked
   * @param {function} onExportSelected — called with an array of selected variants
   */
  constructor(onPreview, onExportSelected) {
    this.onPreview = onPreview;
    this.onExportSelected = onExportSelected;
    this.variants = [];
    this.selectedIds = new Set();

    this._gallery = document.getElementById('gallery');
    this._grid = document.getElementById('gallery-grid');
    this._emptyState = document.getElementById('empty-state');
    this._variantCount = document.getElementById('variant-count');
    this._btnGenerateMore = document.getElementById('btn-generate-more');
    this._btnExportAll = document.getElementById('btn-export-all');
  }

  init() {
    this._btnGenerateMore.addEventListener('click', () => {
      this._gallery.dispatchEvent(
        new CustomEvent('gallery:generate-more', { bubbles: true })
      );
    });

    this._btnExportAll.addEventListener('click', () => {
      const selected = this.getSelected();
      if (selected.length) {
        this.onExportSelected(selected);
      }
    });
  }

  /**
   * Display variants in the gallery grid.
   * @param {Array} variants — array of DesignVariant objects
   * @param {boolean} append — if true, add to existing; if false, replace
   */
  show(variants, append = false) {
    if (!append) {
      this._grid.innerHTML = '';
      this.variants = [];
      this.selectedIds.clear();
    }

    this.variants.push(...variants);

    for (const variant of variants) {
      this._grid.appendChild(this._createCard(variant));
    }

    this._variantCount.textContent = this.variants.length;
    this._gallery.removeAttribute('hidden');
    if (this._emptyState) this._emptyState.setAttribute('hidden', '');
  }

  clear() {
    this._grid.innerHTML = '';
    this.variants = [];
    this.selectedIds.clear();
    this._variantCount.textContent = '0';
    this._gallery.setAttribute('hidden', '');
    if (this._emptyState) this._emptyState.removeAttribute('hidden');
  }

  /** Return array of currently-selected variant objects. */
  getSelected() {
    return this.variants.filter(v => this.selectedIds.has(v.id));
  }

  // ── private ──────────────────────────────────────────────

  _createCard(variant) {
    const fmt = FORMATS[variant.format] || FORMATS.square;
    const scale = CARD_WIDTH / fmt.width;

    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.variantId = variant.id;
    card.style.setProperty('--card-aspect', fmt.aspect);

    // Select checkbox
    const selectDiv = document.createElement('div');
    selectDiv.className = 'gallery-card__select';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'gallery-card__checkbox';
    checkbox.checked = this.selectedIds.has(variant.id);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        this.selectedIds.add(variant.id);
      } else {
        this.selectedIds.delete(variant.id);
      }
    });
    selectDiv.appendChild(checkbox);

    // Render container
    const renderDiv = document.createElement('div');
    renderDiv.className = 'gallery-card__render';
    renderDiv.style.overflow = 'hidden';
    renderDiv.style.height = `${fmt.height * scale}px`;
    this._renderThumbnail(renderDiv, variant, scale);

    // Meta
    const metaDiv = document.createElement('div');
    metaDiv.className = 'gallery-card__meta';
    const ratioLabel = variant.format === 'square' ? '1:1'
      : variant.format === 'vertical' ? '9:16' : '1.91:1';
    const infoSpan = document.createElement('span');
    infoSpan.textContent = `Variant #${variant.id} · ${ratioLabel}`;
    const layoutSpan = document.createElement('span');
    layoutSpan.textContent = `Layout: ${variant.layout.name}`;
    metaDiv.appendChild(infoSpan);
    metaDiv.appendChild(layoutSpan);

    card.appendChild(selectDiv);
    card.appendChild(renderDiv);
    card.appendChild(metaDiv);

    // Click → preview (but not when clicking the checkbox)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-card__select')) return;
      this.onPreview(variant);
    });

    return card;
  }

  _renderThumbnail(container, variant, scale) {
    const { format, layout, content, palette, fontPairing } = variant;

    const validated = validateDesign({ palette, layout, format });
    const correctedPalette = validated.palette;

    const canvas = document.createElement('div');
    canvas.className = `ad-canvas ad-canvas--${format} ad-canvas--thumb`;
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top left';

    applyPalette(canvas, correctedPalette);
    applyTypography(canvas, fontPairing, format);
    if (variant.brandFont) {
      applyBrandFont(canvas, variant.brandFont);
    }

    if (layout.hasOverlay) {
      this._buildOverlayLayout(canvas, layout, content, correctedPalette);
    } else {
      this._buildGridLayout(canvas, layout, content, correctedPalette);
    }

    container.appendChild(canvas);
    requestAnimationFrame(() => {
      this._fitTextElements(canvas);
      document.fonts?.ready?.then(() => this._fitTextElements(canvas));
    });
  }

  _buildOverlayLayout(canvas, layout, content, palette) {
    // Full-bleed background image
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

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = getOverlayCSS(layout.overlayType);
    Object.assign(overlay.style, {
      position: 'absolute', inset: '0',
      display: 'grid',
    });

    // Grid inside overlay
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
      // Skip image area inside overlay grids — it's behind the overlay
      if (isOverlay && area === 'image') continue;

      const el = this._createElement(area, content, palette);
      if (el) {
        el.style.gridArea = area;
        grid.appendChild(el);
      }
    }
  }

  _createElement(area, content, palette) {
    switch (area) {
      case 'image':
        return this._makeImage(content.image, 'ad-el-image');
      case 'image2':
        return this._makeImage(content.image2, 'ad-el-image');
      case 'logo':
        return this._makeImage(content.logo, 'ad-el-logo');
      case 'headline':
        return this._makeText('ad-el-headline', content.headline);
      case 'subheadline':
        return this._makeText('ad-el-subheadline', content.subheadline);
      case 'cta':
        return this._makeCta(content.cta);
      case 'social':
        return this._makeText('ad-el-social-proof', content.socialProof);
      case 'offer':
        return this._makeOffer(content.offer);
      case 'stripe':
        return this._makeStripe(palette);
      default:
        return null;
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
    const span = document.createElement('span');
    span.textContent = text;
    div.appendChild(span);
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
    fitTextElements(canvas);
  }
}
