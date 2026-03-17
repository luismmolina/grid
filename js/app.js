import { InputForm } from './components/form.js';
import { Gallery } from './components/gallery.js';
import { Preview } from './components/preview.js';
import { ExportManager } from './components/export.js';
import { VariantGenerator } from './engine/generator.js';

class App {
  constructor() {
    this.generator = new VariantGenerator();
    this.exportManager = new ExportManager();
    this.currentAssets = null;

    this.form = new InputForm((assets) => this.handleGenerate(assets));
    this.gallery = new Gallery(
      (variant) => this.handlePreview(variant),
      (variants) => this.handleExportSelected(variants)
    );
    this.preview = new Preview(
      (variant, format) => this.handleExport(variant, format)
    );
  }

  init() {
    this.form.init();
    this.gallery.init();
    this.preview.init();

    document.addEventListener('gallery:generate-more', () => {
      if (this.currentAssets) {
        this.handleGenerate(this.currentAssets, true);
      }
    });
  }

  handleGenerate(assets, append = false) {
    this.currentAssets = assets;
    if (!append) {
      this.generator.reset();
    }
    const variants = this.generator.generate(assets, 9);
    this.gallery.show(variants, append);
  }

  handlePreview(variant) {
    this.preview.show(variant);
  }

  async handleExport(variant, format) {
    const canvas = this.preview.getCanvasElement();
    if (canvas) {
      await this.exportManager.exportSingle(canvas, variant, format);
    }
  }

  async handleExportSelected(variants) {
    const items = [];
    for (const variant of variants) {
      const { canvas, cleanup } = this.preview.renderForExport(variant);
      items.push({ canvasElement: canvas, variant, cleanup });
    }
    if (items.length > 0) {
      await this.exportManager.exportBatch(items);
    }
    // Clean up offscreen canvases
    items.forEach(item => item.cleanup());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
