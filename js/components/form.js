const MAX_IMAGES = 10;
const MAX_TEXT_ITEMS = 10;
const STORAGE_KEY = 'gridads-form-state';
const DEFAULT_FOCAL_X = 50;
const DEFAULT_FOCAL_Y = 33;

const PLACEHOLDERS = {
  headline: 'e.g. Transform Your Morning Routine',
  subheadline: 'e.g. Join 50,000+ happy customers',
  cta: 'e.g. Shop Now',
  socialProof: 'e.g. ★ 4.9 — 10K+ reviews',
  offer: 'e.g. 50% OFF — Ends Sunday',
};

const FORMAT_MAP = {
  'fmt-square': 'square',
  'fmt-vertical': 'vertical',
  'fmt-horizontal': 'horizontal',
};

// Required text lists that must keep at least 1 input
const REQUIRED_LISTS = new Set(['headlines-list', 'ctas-list']);

export class InputForm {
  constructor(onGenerate) {
    this._onGenerate = onGenerate;
    this._images = [];   // { dataURL, file }
    this._logo = null;   // dataURL | null
  }

  // ── Public API ─────────────────────────────────────────────

  init() {
    // Image upload
    this._imageDropzone = document.getElementById('image-dropzone');
    this._imageInput = document.getElementById('image-input');
    this._imagePreviews = document.getElementById('image-previews');

    // Logo upload
    this._logoDropzone = document.getElementById('logo-dropzone');
    this._logoInput = document.getElementById('logo-input');
    this._logoPreview = document.getElementById('logo-preview');

    // Text lists
    this._textLists = {
      headlines: document.getElementById('headlines-list'),
      subheadlines: document.getElementById('subheadlines-list'),
      ctas: document.getElementById('ctas-list'),
      socialProof: document.getElementById('social-proof-list'),
      offers: document.getElementById('offer-list'),
    };

    // Format checkboxes
    this._fmtSquare = document.getElementById('fmt-square');
    this._fmtVertical = document.getElementById('fmt-vertical');
    this._fmtHorizontal = document.getElementById('fmt-horizontal');

    // Brand identity
    this._brandPrimary = document.getElementById('brand-primary');
    this._brandSecondary = document.getElementById('brand-secondary');
    this._brandAccent = document.getElementById('brand-accent');
    this._brandFont = document.getElementById('brand-font');
    this._useBrandColors = document.getElementById('use-brand-colors');

    // Generate
    this._btnGenerate = document.getElementById('btn-generate');

    // Clear All
    this._btnClear = document.getElementById('btn-clear-all');

    this._bindImageUpload();
    this._bindLogoUpload();
    this._bindTextLists();
    this._bindGenerate();

    // Bind Clear All
    if (this._btnClear) {
      this._btnClear.addEventListener('click', () => this._clearAll());
    }

    // Hook save triggers on input/change within the scroll panel
    const scrollPanel = this._imageDropzone.closest('.input-panel__scroll');
    if (scrollPanel) {
      scrollPanel.addEventListener('input', () => this._scheduleSave());
      scrollPanel.addEventListener('change', () => this._scheduleSave());
    }

    // Restore persisted state
    this._restoreState();
  }

  getAssets() {
    return {
      images: this._images.map((i) => {
        const img = {
          url: i.dataURL,
          focalX: i.focalX ?? DEFAULT_FOCAL_X,
          focalY: i.focalY ?? DEFAULT_FOCAL_Y,
        };
        if (i.focalX2 != null && i.focalY2 != null) {
          img.focalX2 = i.focalX2;
          img.focalY2 = i.focalY2;
        }
        return img;
      }),
      logo: this._logo,
      headlines: this._collectList(this._textLists.headlines),
      subheadlines: this._collectList(this._textLists.subheadlines),
      ctas: this._collectList(this._textLists.ctas),
      socialProof: this._collectList(this._textLists.socialProof),
      offers: this._collectList(this._textLists.offers),
      formats: this._getFormats(),
      brandColors: this._getBrandColors(),
    };
  }

  validate() {
    const errors = [];
    if (this._images.length === 0) errors.push('Upload at least 1 image.');
    if (this._collectList(this._textLists.headlines).length === 0) errors.push('Add at least 1 headline.');
    if (this._collectList(this._textLists.ctas).length === 0) errors.push('Add at least 1 CTA.');
    if (this._getFormats().length === 0) errors.push('Select at least 1 format.');
    return { valid: errors.length === 0, errors };
  }

  // ── Image upload ───────────────────────────────────────────

  _bindImageUpload() {
    this._bindDropzone(this._imageDropzone, this._imageInput, (files) => this._handleImageFiles(files));
  }

  _handleImageFiles(files) {
    const remaining = MAX_IMAGES - this._images.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => {
        const entry = {
          dataURL: reader.result,
          file,
          focalX: DEFAULT_FOCAL_X,
          focalY: DEFAULT_FOCAL_Y,
          focalX2: null,
          focalY2: null,
        };
        this._images.push(entry);
        this._renderImagePreviews();
        this._scheduleSave();
      };
      reader.readAsDataURL(file);
    });
  }

  _renderImagePreviews() {
    this._imagePreviews.innerHTML = '';
    this._images.forEach((entry, idx) => {
      const thumb = document.createElement('div');
      thumb.className = 'image-upload__thumb';

      const img = document.createElement('img');
      img.src = entry.dataURL;
      img.alt = `Image ${idx + 1}`;

      // Primary focal point dot (red)
      const dot1 = document.createElement('div');
      dot1.className = 'image-upload__focal-dot';
      dot1.style.left = `${entry.focalX ?? DEFAULT_FOCAL_X}%`;
      dot1.style.top = `${entry.focalY ?? DEFAULT_FOCAL_Y}%`;

      // Secondary focal point dot (orange) — hidden until set
      const dot2 = document.createElement('div');
      dot2.className = 'image-upload__focal-dot image-upload__focal-dot--secondary';
      if (entry.focalX2 != null && entry.focalY2 != null) {
        dot2.style.left = `${entry.focalX2}%`;
        dot2.style.top = `${entry.focalY2}%`;
      } else {
        dot2.style.display = 'none';
      }

      // Click logic: 1st click = primary, 2nd = secondary, 3rd = reset to new primary
      thumb.addEventListener('click', (e) => {
        if (e.target.closest('.image-upload__thumb-remove')) return;
        const rect = thumb.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
        const y = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));

        if (entry.focalX2 != null) {
          // Already has two points → reset: new click becomes primary, clear secondary
          entry.focalX = x;
          entry.focalY = y;
          entry.focalX2 = null;
          entry.focalY2 = null;
          dot1.style.left = `${x}%`;
          dot1.style.top = `${y}%`;
          dot2.style.display = 'none';
        } else if (entry.focalX !== DEFAULT_FOCAL_X || entry.focalY !== DEFAULT_FOCAL_Y) {
          // Has a custom primary → set secondary
          entry.focalX2 = x;
          entry.focalY2 = y;
          dot2.style.left = `${x}%`;
          dot2.style.top = `${y}%`;
          dot2.style.display = '';
        } else {
          // Default state → set primary
          entry.focalX = x;
          entry.focalY = y;
          dot1.style.left = `${x}%`;
          dot1.style.top = `${y}%`;
        }
        this._scheduleSave();
      });

      const btn = document.createElement('button');
      btn.className = 'image-upload__thumb-remove';
      btn.textContent = '×';
      btn.title = 'Remove';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._images.splice(idx, 1);
        this._renderImagePreviews();
        this._scheduleSave();
      });

      thumb.append(img, dot1, dot2, btn);
      this._imagePreviews.appendChild(thumb);
    });
  }

  // ── Logo upload ────────────────────────────────────────────

  _bindLogoUpload() {
    this._bindDropzone(this._logoDropzone, this._logoInput, (files) => this._handleLogoFile(files));
  }

  _handleLogoFile(files) {
    const file = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this._logo = reader.result;
      this._renderLogoPreview();
      this._scheduleSave();
    };
    reader.readAsDataURL(file);
  }

  _renderLogoPreview() {
    this._logoPreview.innerHTML = '';
    if (!this._logo) return;

    const img = document.createElement('img');
    img.src = this._logo;
    img.alt = 'Logo';

    const btn = document.createElement('button');
    btn.className = 'logo-upload__remove';
    btn.textContent = '×';
    btn.title = 'Remove logo';
    btn.addEventListener('click', () => {
      this._logo = null;
      this._renderLogoPreview();
      this._scheduleSave();
    });

    this._logoPreview.append(img, btn);
  }

  // ── Shared dropzone helper ─────────────────────────────────

  _bindDropzone(dropzone, input, onFiles) {
    dropzone.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      if (input.files.length) onFiles(input.files);
      input.value = '';
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
    });
  }

  // ── Text lists ─────────────────────────────────────────────

  _bindTextLists() {
    // Wire existing remove buttons
    Object.values(this._textLists).forEach((list) => {
      list.querySelectorAll('.btn-icon--remove').forEach((btn) => {
        btn.addEventListener('click', () => this._removeTextItem(btn, list));
      });
    });

    // Wire "Add" buttons
    document.querySelectorAll('.btn--add').forEach((btn) => {
      btn.addEventListener('click', () => {
        const listId = btn.dataset.target;
        const field = btn.dataset.field;
        const list = document.getElementById(listId);
        if (!list) return;

        const count = list.querySelectorAll('.text-list__item').length;
        if (count >= MAX_TEXT_ITEMS) return;

        this._addTextItem(list, field);
      });
    });
  }

  _addTextItem(list, field) {
    const item = document.createElement('div');
    item.className = 'text-list__item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.dataset.field = field;
    input.placeholder = PLACEHOLDERS[field] || '';

    const btn = document.createElement('button');
    btn.className = 'btn-icon btn-icon--remove';
    btn.title = 'Remove';
    btn.textContent = '×';
    btn.addEventListener('click', () => this._removeTextItem(btn, list));

    item.append(input, btn);
    list.appendChild(item);
    input.focus();
  }

  _removeTextItem(btn, list) {
    const isRequired = REQUIRED_LISTS.has(list.id);
    const items = list.querySelectorAll('.text-list__item');
    if (isRequired && items.length <= 1) return;
    btn.closest('.text-list__item').remove();
    this._scheduleSave();
  }

  _collectList(list) {
    return Array.from(list.querySelectorAll('.text-input'))
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  // ── Formats ────────────────────────────────────────────────

  _getFormats() {
    const formats = [];
    for (const [id, name] of Object.entries(FORMAT_MAP)) {
      if (document.getElementById(id)?.checked) formats.push(name);
    }
    return formats;
  }

  // ── Brand colors ───────────────────────────────────────────

  _getBrandColors() {
    const colors = {
      use: this._useBrandColors.checked,
      primary: this._brandPrimary.value,
      accent: this._brandAccent.value,
    };
    if (this._brandSecondary) colors.secondary = this._brandSecondary.value;
    if (this._brandFont) colors.font = this._brandFont.value.trim() || null;
    return colors;
  }

  // ── Generate ───────────────────────────────────────────────

  _bindGenerate() {
    this._btnGenerate.addEventListener('click', () => {
      this._clearErrors();
      const { valid, errors } = this.validate();
      if (!valid) {
        this._showErrors(errors);
        return;
      }
      this._onGenerate(this.getAssets());
    });
  }

  _showErrors(errors) {
    this._clearErrors();
    const container = document.createElement('div');
    container.className = 'form-errors';
    container.id = 'form-errors';
    const ul = document.createElement('ul');
    errors.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg;
      ul.appendChild(li);
    });
    container.appendChild(ul);
    this._btnGenerate.parentElement.prepend(container);
  }

  _clearErrors() {
    document.getElementById('form-errors')?.remove();
  }

  // ── Persistence ──────────────────────────────────────────────

  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveState(), 300);
  }

  _saveState() {
    const state = {
      images: this._images.map((i) => ({
        dataURL: i.dataURL,
        focalX: i.focalX ?? DEFAULT_FOCAL_X,
        focalY: i.focalY ?? DEFAULT_FOCAL_Y,
        focalX2: i.focalX2 ?? null,
        focalY2: i.focalY2 ?? null,
      })),
      logo: this._logo,
      textLists: {
        headlines: this._collectList(this._textLists.headlines),
        subheadlines: this._collectList(this._textLists.subheadlines),
        ctas: this._collectList(this._textLists.ctas),
        socialProof: this._collectList(this._textLists.socialProof),
        offers: this._collectList(this._textLists.offers),
      },
      formats: {
        'fmt-square': this._fmtSquare.checked,
        'fmt-vertical': this._fmtVertical.checked,
        'fmt-horizontal': this._fmtHorizontal.checked,
      },
      brandColors: this._getBrandColors(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('GridAds: Could not save form state', e);
    }
  }

  _restoreState() {
    let state;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      state = JSON.parse(raw);
    } catch (e) {
      return;
    }

    // Restore images
    if (state.images?.length) {
      this._images = state.images.map((i) => ({
        dataURL: i.dataURL,
        file: null,
        focalX: i.focalX ?? DEFAULT_FOCAL_X,
        focalY: i.focalY ?? DEFAULT_FOCAL_Y,
        focalX2: i.focalX2 ?? null,
        focalY2: i.focalY2 ?? null,
      }));
      this._renderImagePreviews();
    }

    // Restore logo
    if (state.logo) {
      this._logo = state.logo;
      this._renderLogoPreview();
    }

    // Restore text lists
    if (state.textLists) {
      this._restoreTextList(this._textLists.headlines, 'headline', state.textLists.headlines);
      this._restoreTextList(this._textLists.subheadlines, 'subheadline', state.textLists.subheadlines);
      this._restoreTextList(this._textLists.ctas, 'cta', state.textLists.ctas);
      this._restoreTextList(this._textLists.socialProof, 'socialProof', state.textLists.socialProof);
      this._restoreTextList(this._textLists.offers, 'offer', state.textLists.offers);
    }

    // Restore formats
    if (state.formats) {
      this._fmtSquare.checked = state.formats['fmt-square'] ?? true;
      this._fmtVertical.checked = state.formats['fmt-vertical'] ?? true;
      this._fmtHorizontal.checked = state.formats['fmt-horizontal'] ?? true;
    }

    // Restore brand colors (handle both old 2-color and new 3-color formats)
    if (state.brandColors) {
      this._brandPrimary.value = state.brandColors.primary || '#6366f1';
      this._brandAccent.value = state.brandColors.accent || '#f43f5e';
      this._useBrandColors.checked = !!state.brandColors.use;
      if (this._brandSecondary) {
        this._brandSecondary.value = state.brandColors.secondary || '#a5b4fc';
      }
      if (this._brandFont) {
        this._brandFont.value = state.brandColors.font || '';
      }
    }
  }

  _restoreTextList(listEl, field, values) {
    if (!values || !values.length) return;
    // Clear existing items except the first one
    const existingItems = listEl.querySelectorAll('.text-list__item');
    existingItems.forEach((item, i) => {
      if (i === 0) {
        const input = item.querySelector('.text-input');
        if (input && values[0]) input.value = values[0];
      } else {
        item.remove();
      }
    });
    // Add remaining items
    for (let i = 1; i < values.length; i++) {
      this._addTextItem(listEl, field);
      const items = listEl.querySelectorAll('.text-list__item');
      const lastInput = items[items.length - 1]?.querySelector('.text-input');
      if (lastInput) lastInput.value = values[i];
    }
  }

  _clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    this._images = [];
    this._logo = null;
    this._renderImagePreviews();
    this._renderLogoPreview();

    // Reset text lists to 1 empty item each
    Object.values(this._textLists).forEach((list) => {
      const items = list.querySelectorAll('.text-list__item');
      items.forEach((item, i) => {
        if (i === 0) {
          item.querySelector('.text-input').value = '';
        } else {
          item.remove();
        }
      });
    });

    // Reset checkboxes and colors
    this._fmtSquare.checked = true;
    this._fmtVertical.checked = true;
    this._fmtHorizontal.checked = true;
    this._useBrandColors.checked = false;
    this._brandPrimary.value = '#6366f1';
    this._brandAccent.value = '#f43f5e';
    if (this._brandSecondary) this._brandSecondary.value = '#a5b4fc';
    if (this._brandFont) this._brandFont.value = '';
  }
}
