import * as api from './api.js';

const FORMAT_DIMS = {
  square:   { w: 1080, h: 1080 },
  vertical: { w: 1080, h: 1920 },
  portrait: { w: 1080, h: 1350 },
};

class App {
  constructor() {
    this.variants = [];
    this.currentPreview = null;
  }

  async init() {
    this.bindPanels();
    this.bindBusinessPanel();
    this.bindImageLibrary();
    this.bindInspirationPanel();
    this.bindGenerate();
    this.bindGallery();
    this.bindPreview();

    await this.loadBusinessProfile();
    await this.loadImages();
    await this.loadTemplates();
    await this.loadVariants();
  }

  // ── Collapsible panels ──────────────────────────────────
  bindPanels() {
    document.querySelectorAll('.panel__header').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.panel').classList.toggle('panel--collapsed');
      });
    });
  }

  // ── Business Context (single textarea) ──────────────────
  bindBusinessPanel() {
    document.getElementById('btn-save-business').addEventListener('click', async () => {
      const context = document.getElementById('biz-context').value.trim();
      await api.saveBusinessProfile({ context_text: context });
      this.flash('btn-save-business', '✓ Saved');
    });
  }

  async loadBusinessProfile() {
    try {
      const p = await api.getBusinessProfile();
      if (p && p.context_text) {
        document.getElementById('biz-context').value = p.context_text;
      }
    } catch (e) { console.warn('Could not load business profile:', e); }
  }

  // ── Image Library ───────────────────────────────────────
  bindImageLibrary() {
    const dropzone = document.getElementById('image-dropzone');
    const input = document.getElementById('image-input');

    dropzone.addEventListener('click', () => input.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dropzone--active'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone--active'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dropzone--active');
      if (e.dataTransfer.files.length) this.uploadImages(e.dataTransfer.files);
    });
    input.addEventListener('change', () => {
      if (input.files.length) this.uploadImages(input.files);
      input.value = '';
    });
  }

  async uploadImages(files) {
    try {
      await api.uploadImages(files);
      await this.loadImages();
    } catch (e) { console.error('Upload failed:', e); }
  }

  async loadImages() {
    try {
      const images = await api.getImages();
      const grid = document.getElementById('image-grid');
      grid.innerHTML = '';
      for (const img of images) {
        const item = document.createElement('div');
        item.className = 'image-thumb';
        item.innerHTML = `
          <img src="/uploads/${img.path}" alt="${img.filename}">
          <button class="image-thumb__delete" data-id="${img.id}">&times;</button>
        `;
        item.querySelector('.image-thumb__delete').addEventListener('click', async (e) => {
          e.stopPropagation();
          await api.deleteImage(img.id);
          item.remove();
        });
        grid.appendChild(item);
      }
    } catch (e) { console.warn('Could not load images:', e); }
  }

  // ── Inspiration Templates (no format picker) ────────────
  bindInspirationPanel() {
    document.getElementById('btn-save-template').addEventListener('click', async () => {
      const code = document.getElementById('template-code').value.trim();
      if (!code) return;
      await api.saveTemplate({ name: `Template ${Date.now()}`, html_css: code });
      document.getElementById('template-code').value = '';
      await this.loadTemplates();
      this.flash('btn-save-template', '✓ Saved');
    });
  }

  async loadTemplates() {
    try {
      const templates = await api.getTemplates();
      const list = document.getElementById('template-list');
      list.innerHTML = '';
      for (const t of templates) {
        const item = document.createElement('div');
        item.className = 'template-item';
        const preview = (t.html_css || '').substring(0, 60).replace(/</g, '&lt;');
        item.innerHTML = `
          <span class="template-item__name" title="${preview}">${t.name || 'Template'}</span>
          <button class="template-item__delete" data-id="${t.id}">&times;</button>
        `;
        item.querySelector('.template-item__delete').addEventListener('click', async () => {
          await api.deleteTemplate(t.id);
          item.remove();
        });
        list.appendChild(item);
      }
    } catch (e) { console.warn('Could not load templates:', e); }
  }

  // ── Generation (multi-format) ───────────────────────────
  bindGenerate() {
    document.getElementById('btn-generate').addEventListener('click', () => this.generate());
  }

  getSelectedFormats() {
    const checks = document.querySelectorAll('.format-checks input[type="checkbox"]:checked');
    return Array.from(checks).map(c => c.value);
  }

  async generate() {
    const formats = this.getSelectedFormats();
    if (formats.length === 0) {
      alert('Select at least one format');
      return;
    }

    const btn = document.getElementById('btn-generate');
    document.getElementById('loading-state').hidden = false;
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    try {
      for (const format of formats) {
        const newVariants = await api.generateVariants(format);
        this.variants.push(...newVariants);
        this.renderGallery();
      }
    } catch (e) {
      console.error('Generation failed:', e);
      alert('Generation failed: ' + e.message);
    } finally {
      document.getElementById('loading-state').hidden = true;
      btn.disabled = false;
      btn.textContent = '🔮 Generate Variants';
    }
  }

  // ── Gallery ─────────────────────────────────────────────
  bindGallery() {
    document.getElementById('btn-clear-variants').addEventListener('click', async () => {
      for (const v of this.variants) {
        await api.deleteVariant(v.id);
      }
      this.variants = [];
      this.renderGallery();
    });
  }

  async loadVariants() {
    try {
      this.variants = await api.getVariants();
      this.renderGallery();
    } catch (e) { console.warn('Could not load variants:', e); }
  }

  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    const emptyHint = document.getElementById('gallery-empty');
    document.getElementById('variant-count').textContent = this.variants.length;

    emptyHint.hidden = this.variants.length > 0;
    grid.innerHTML = '';
    for (const variant of this.variants) {
      grid.appendChild(this.createCard(variant));
    }
  }

  createCard(variant) {
    const dims = FORMAT_DIMS[variant.format] || FORMAT_DIMS.square;
    const card = document.createElement('div');
    card.className = 'gallery-card';
    if (variant.rating === 'liked') card.classList.add('gallery-card--liked');
    if (variant.rating === 'disliked') card.classList.add('gallery-card--disliked');

    // Iframe preview
    const iframeWrap = document.createElement('div');
    iframeWrap.className = 'gallery-card__preview';
    const scale = 280 / dims.w;
    iframeWrap.style.height = `${dims.h * scale}px`;

    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-same-origin';
    iframe.className = 'gallery-card__iframe';
    iframe.style.width = `${dims.w}px`;
    iframe.style.height = `${dims.h}px`;
    iframe.style.transform = `scale(${scale})`;
    iframe.srcdoc = this.buildSrcdoc(variant);
    iframeWrap.appendChild(iframe);

    // Actions bar
    const actions = document.createElement('div');
    actions.className = 'gallery-card__actions';

    const formatLabel = { square: '1:1', vertical: '9:16', portrait: '4:5' }[variant.format] || variant.format;
    actions.innerHTML = `
      <span class="gallery-card__label">${formatLabel}</span>
      <div class="gallery-card__buttons">
        <button class="btn-rate btn-rate--like ${variant.rating === 'liked' ? 'active' : ''}" title="Like">❤️</button>
        <button class="btn-rate btn-rate--dislike ${variant.rating === 'disliked' ? 'active' : ''}" title="Dislike">👎</button>
        <button class="btn-rate btn-rate--delete" title="Delete">🗑️</button>
      </div>
    `;

    actions.querySelector('.btn-rate--like').addEventListener('click', e => {
      e.stopPropagation();
      this.rateVariant(variant, variant.rating === 'liked' ? 'unrated' : 'liked');
    });
    actions.querySelector('.btn-rate--dislike').addEventListener('click', e => {
      e.stopPropagation();
      this.rateVariant(variant, variant.rating === 'disliked' ? 'unrated' : 'disliked');
    });
    actions.querySelector('.btn-rate--delete').addEventListener('click', e => {
      e.stopPropagation();
      this.removeVariant(variant);
    });

    card.appendChild(iframeWrap);
    card.appendChild(actions);
    iframeWrap.addEventListener('click', () => this.showPreview(variant));

    return card;
  }

  buildSrcdoc(variant) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>*{margin:0;padding:0;box-sizing:border-box;}body{overflow:hidden;}${variant.css}</style>
</head><body>${variant.html}</body></html>`;
  }

  async rateVariant(variant, rating) {
    await api.rateVariant(variant.id, rating);
    variant.rating = rating;
    this.renderGallery();
  }

  async removeVariant(variant) {
    await api.deleteVariant(variant.id);
    this.variants = this.variants.filter(v => v.id !== variant.id);
    this.renderGallery();
  }

  // ── Preview ─────────────────────────────────────────────
  bindPreview() {
    document.getElementById('btn-close-preview').addEventListener('click', () => this.hidePreview());
    document.getElementById('preview-backdrop').addEventListener('click', () => this.hidePreview());
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') this.hidePreview();
    });

    document.getElementById('btn-preview-like').addEventListener('click', () => {
      if (this.currentPreview) {
        const newRating = this.currentPreview.rating === 'liked' ? 'unrated' : 'liked';
        this.rateVariant(this.currentPreview, newRating);
        this.updatePreviewButtons();
      }
    });
    document.getElementById('btn-preview-dislike').addEventListener('click', () => {
      if (this.currentPreview) {
        const newRating = this.currentPreview.rating === 'disliked' ? 'unrated' : 'disliked';
        this.rateVariant(this.currentPreview, newRating);
        this.updatePreviewButtons();
      }
    });
    document.getElementById('btn-export-png').addEventListener('click', () => {
      if (this.currentPreview) api.exportVariantPng(this.currentPreview.id);
    });
  }

  showPreview(variant) {
    this.currentPreview = variant;
    const dims = FORMAT_DIMS[variant.format] || FORMAT_DIMS.square;

    const maxW = window.innerWidth * 0.85;
    const maxH = window.innerHeight * 0.85;
    const scale = Math.min(maxW / dims.w, maxH / dims.h, 1);

    const body = document.getElementById('preview-body');
    body.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-same-origin';
    iframe.className = 'preview-iframe';
    iframe.style.width = `${dims.w}px`;
    iframe.style.height = `${dims.h}px`;
    iframe.style.transform = `scale(${scale})`;
    iframe.style.transformOrigin = 'top left';
    iframe.srcdoc = this.buildSrcdoc(variant);

    const wrapper = document.createElement('div');
    wrapper.style.width = `${dims.w * scale}px`;
    wrapper.style.height = `${dims.h * scale}px`;
    wrapper.style.overflow = 'hidden';
    wrapper.style.margin = '0 auto';
    wrapper.appendChild(iframe);
    body.appendChild(wrapper);

    const formatLabel = { square: '1:1', vertical: '9:16', portrait: '4:5' }[variant.format] || variant.format;
    document.getElementById('preview-title').textContent = `${formatLabel} — Variant #${variant.id}`;
    this.updatePreviewButtons();
    document.getElementById('preview-modal').hidden = false;
  }

  updatePreviewButtons() {
    if (!this.currentPreview) return;
    document.getElementById('btn-preview-like').classList.toggle('active', this.currentPreview.rating === 'liked');
    document.getElementById('btn-preview-dislike').classList.toggle('active', this.currentPreview.rating === 'disliked');
  }

  hidePreview() {
    document.getElementById('preview-modal').hidden = true;
    document.getElementById('preview-body').innerHTML = '';
    this.currentPreview = null;
  }

  // ── Helpers ─────────────────────────────────────────────
  flash(btnId, text) {
    const btn = document.getElementById(btnId);
    const original = btn.textContent;
    btn.textContent = text;
    setTimeout(() => { btn.textContent = original; }, 1500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
