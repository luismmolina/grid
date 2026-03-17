import { LAYOUTS, getLayoutsForFormat, getRandomLayout } from './layouts.js';
import { PALETTES, getRandomPalette, createBrandPalette, generateBrandVariations } from './colors.js';
import { FONT_PAIRINGS, getRandomPairing } from './typography.js';
import { validateDesign } from './rules.js';
import { createRng, randomSeed, uniqueRandomCombinations } from '../utils/random.js';

/**
 * Combinatorial variant generator for grid-based ad designs.
 * Takes user assets and produces unique design variant configurations
 * by combining layouts, palettes, fonts, and content.
 */
export class VariantGenerator {
  constructor() {
    this.generatedKeys = new Set();
    this.variantCount = 0;
    this.lockedSlots = {};
  }

  /**
   * Generate a batch of unique design variants.
   * @param {Object} assets — user-provided creative assets
   * @param {number} count — how many variants to generate (default 9)
   * @returns {Array<Object>} array of DesignVariant objects
   */
  generate(assets, count = 9) {
    const seed = randomSeed();
    const rng = createRng(seed);
    const variants = [];

    const formats = assets.formats && assets.formats.length > 0
      ? assets.formats
      : ['square'];

    for (let i = 0; i < count; i++) {
      const variant = this._generateOne(assets, formats, rng);
      if (variant) {
        variants.push(variant);
      }
    }

    return variants;
  }

  /**
   * Lock a specific slot so it stays fixed during generation.
   * @param {string} slot — 'image', 'headline', 'subheadline', 'cta', 'palette', 'layout', 'font'
   * @param {number} index — index into the corresponding array
   */
  lock(slot, index) {
    this.lockedSlots[slot] = index;
  }

  /**
   * Unlock a previously locked slot.
   * @param {string} slot
   */
  unlock(slot) {
    delete this.lockedSlots[slot];
  }

  /**
   * Reset all tracking state.
   */
  reset() {
    this.generatedKeys = new Set();
    this.variantCount = 0;
    this.lockedSlots = {};
    this._brandVariations = null;
  }

  // ── Private helpers ──────────────────────────────────────────

  /**
   * Generate a single unique variant, retrying up to 50 times on duplicates.
   */
  _generateOne(assets, formats, rng) {
    const maxAttempts = 50;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const formatIdx = this._pickIndex(formats, 'format', rng);
      const format = formats[formatIdx];

      const layoutsForFormat = getLayoutsForFormat(format);
      if (!layoutsForFormat || layoutsForFormat.length === 0) continue;

      const layoutIdx = this._pickIndex(layoutsForFormat, 'layout', rng);
      const layout = layoutsForFormat[layoutIdx];

      const { palette, paletteIdx } = this._pickPalette(assets, rng);

      const fontIdx = this._pickIndex(FONT_PAIRINGS, 'font', rng);
      const fontPairing = FONT_PAIRINGS[fontIdx];

      const imageIdx = this._pickIndex(assets.images, 'image', rng);
      const headlineIdx = this._pickIndex(assets.headlines, 'headline', rng);
      const hasSubheadlines = assets.subheadlines && assets.subheadlines.length > 0;
      const subheadlineIdx = hasSubheadlines
        ? this._pickIndex(assets.subheadlines, 'subheadline', rng)
        : -1;
      const ctaIdx = this._pickIndex(assets.ctas, 'cta', rng);

      const socialProofIdx = assets.socialProof && assets.socialProof.length > 0
        ? this._pickIndex(assets.socialProof, 'socialProof', rng)
        : -1;

      const offerIdx = assets.offers && assets.offers.length > 0
        ? this._pickIndex(assets.offers, 'offer', rng)
        : -1;

      // Build unique key from combination indices
      const key = [
        formatIdx, layoutIdx, paletteIdx, fontIdx,
        imageIdx, headlineIdx, subheadlineIdx, ctaIdx,
        socialProofIdx, offerIdx,
      ].join('-');

      if (this.generatedKeys.has(key)) continue;
      this.generatedKeys.add(key);

      // Pick a different image for image2 if the layout needs it
      const image2 = this._pickSecondImage(assets.images, imageIdx, layout, rng);

      const content = {
        image: assets.images[imageIdx],
        image2,
        headline: assets.headlines[headlineIdx],
        subheadline: subheadlineIdx >= 0 ? assets.subheadlines[subheadlineIdx] : null,
        cta: assets.ctas[ctaIdx],
        socialProof: socialProofIdx >= 0 ? assets.socialProof[socialProofIdx] : null,
        offer: offerIdx >= 0 ? assets.offers[offerIdx] : null,
        logo: assets.logo || null,
      };

      const brandFont = assets.brandColors?.font || null;

      const config = validateDesign({ palette, layout, format });

      this.variantCount++;

      return {
        id: this.variantCount,
        format,
        layout,
        palette: config.palette,
        fontPairing,
        content,
        config,
        key,
        brandFont,
      };
    }

    // Exhausted all attempts — no unique combination found
    return null;
  }

  /**
   * Pick an index for a given slot, respecting locks.
   */
  _pickIndex(array, slot, rng) {
    if (slot in this.lockedSlots) {
      const locked = this.lockedSlots[slot];
      return Math.min(locked, array.length - 1);
    }
    return rng.int(0, array.length - 1);
  }

  /**
   * Pick a palette, using brand colors when requested.
   */
  _pickPalette(assets, rng) {
    if (assets.brandColors && assets.brandColors.use) {
      if (!this._brandVariations) {
        this._brandVariations = generateBrandVariations(
          assets.brandColors.primary,
          assets.brandColors.secondary,
          assets.brandColors.accent,
        );
      }
      const idx = rng.int(0, this._brandVariations.length - 1);
      return { palette: this._brandVariations[idx], paletteIdx: -(idx + 1) };
    }

    if ('palette' in this.lockedSlots) {
      const idx = Math.min(this.lockedSlots.palette, PALETTES.length - 1);
      return { palette: PALETTES[idx], paletteIdx: idx };
    }

    const paletteIdx = rng.int(0, PALETTES.length - 1);
    return { palette: PALETTES[paletteIdx], paletteIdx };
  }

  /**
   * Pick a second image different from the primary, if the layout requires it.
   */
  _pickSecondImage(images, primaryIdx, layout, rng) {
    const needsImage2 = layout.areas && layout.areas.includes('image2');
    if (!needsImage2 || images.length < 2) return null;

    let idx = rng.int(0, images.length - 1);
    // Ensure it differs from the primary image
    if (images.length > 1 && idx === primaryIdx) {
      idx = (idx + 1) % images.length;
    }
    return images[idx];
  }
}
