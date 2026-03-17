import { RESTAURANT_PALETTES, generateBrandVariations } from './colors.js';
import { RESTAURANT_FONT_PAIRINGS } from './typography.js';
import { getRestaurantLayoutsForFormat } from './layouts.js';
import { validateDesign } from './rules.js';
import { createRng, randomSeed } from '../utils/random.js';

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function countChars(text) {
  return String(text || '').trim().length;
}

function hasItems(array) {
  return Array.isArray(array) && array.length > 0;
}

/**
 * Restaurant-first variant generator.
 * Produces a larger internal candidate pool, scores it,
 * and only returns the strongest variants.
 */
export class VariantGenerator {
  constructor() {
    this.generatedKeys = new Set();
    this.generatedLayoutUsage = new Map();
    this.variantCount = 0;
    this.lockedSlots = {};
  }

  /**
   * Generate a batch of unique, ranked variants.
   * @param {Object} assets — user-provided creative assets
   * @param {number} count — how many variants to return
   * @returns {Array<Object>}
   */
  generate(assets, count = 9) {
    if (!assets || !hasItems(assets.images) || !hasItems(assets.headlines) || !hasItems(assets.ctas)) {
      return [];
    }

    const seed = randomSeed();
    const rng = createRng(seed);
    const formats = assets.formats && assets.formats.length > 0
      ? assets.formats
      : ['square'];

    const candidateTarget = Math.max(count * 14, 48);
    const usedKeys = new Set(this.generatedKeys);
    const candidates = [];
    let attempts = 0;
    const maxAttempts = candidateTarget * 12;

    while (candidates.length < candidateTarget && attempts < maxAttempts) {
      const candidate = this._buildCandidate(assets, formats, rng, usedKeys);
      attempts++;
      if (!candidate) continue;
      candidates.push(candidate);
      usedKeys.add(candidate.key);
    }

    if (candidates.length === 0) {
      return [];
    }

    const ranked = candidates
      .map((variant) => ({ variant, score: this._scoreVariant(variant, assets) }))
      .sort((a, b) => b.score - a.score);

    const selected = this._selectBestVariants(ranked, count, formats);
    for (const entry of selected) {
      this.generatedKeys.add(entry.variant.key);
      const layoutId = entry.variant.layout.id;
      this.generatedLayoutUsage.set(layoutId, (this.generatedLayoutUsage.get(layoutId) || 0) + 1);
    }

    return selected.map(({ variant, score }) => ({
      ...variant,
      id: ++this.variantCount,
      qualityScore: Math.round(score),
    }));
  }

  lock(slot, index) {
    this.lockedSlots[slot] = index;
  }

  unlock(slot) {
    delete this.lockedSlots[slot];
  }

  reset() {
    this.generatedKeys = new Set();
    this.generatedLayoutUsage = new Map();
    this.variantCount = 0;
    this.lockedSlots = {};
    this._brandVariations = null;
  }

  // ---------------------------------------------------------------------------
  // Candidate generation
  // ---------------------------------------------------------------------------

  _buildCandidate(assets, formats, rng, usedKeys) {
    const formatIdx = this._pickIndex(formats, 'format', rng);
    const format = formats[formatIdx];
    const layoutsForFormat = getRestaurantLayoutsForFormat(format);
    if (!layoutsForFormat.length) return null;

    const headlineIdx = this._pickIndex(assets.headlines, 'headline', rng);
    const headline = assets.headlines[headlineIdx];
    const layout = this._pickLayout(layoutsForFormat, assets, headline, format, rng);
    if (!layout) return null;

    const imageIdx = this._pickIndex(assets.images, 'image', rng);
    const image2Idx = this._pickSecondImageIndex(assets.images, imageIdx, layout, rng);
    if (layout.minImages > 1 && image2Idx < 0) return null;

    const ctaIdx = this._pickIndex(assets.ctas, 'cta', rng);
    const subheadlineIdx = layout.areas.includes('subheadline') && hasItems(assets.subheadlines)
      ? this._pickIndex(assets.subheadlines, 'subheadline', rng)
      : -1;
    const socialProofIdx = layout.areas.includes('social') && hasItems(assets.socialProof)
      ? this._pickIndex(assets.socialProof, 'socialProof', rng)
      : -1;
    const offerIdx = layout.areas.includes('offer') && hasItems(assets.offers)
      ? this._pickIndex(assets.offers, 'offer', rng)
      : -1;

    const { palette, paletteIdx } = this._pickPalette(assets, layout, rng);
    const { fontPairing, fontIdx } = this._pickFontPairing(layout, rng);

    const key = [
      format,
      layout.id,
      palette.id || paletteIdx,
      fontPairing.id || fontIdx,
      imageIdx,
      image2Idx >= 0 ? image2Idx : 'x2',
      headlineIdx,
      subheadlineIdx >= 0 ? subheadlineIdx : 'sx',
      ctaIdx,
      socialProofIdx >= 0 ? socialProofIdx : 'px',
      offerIdx >= 0 ? offerIdx : 'ox',
      layout.hasLogoArea && assets.logo ? 'logo' : 'no-logo',
    ].join('|');

    if (usedKeys.has(key)) {
      return null;
    }

    const content = {
      image: assets.images[imageIdx],
      image2: image2Idx >= 0 ? assets.images[image2Idx] : null,
      headline,
      subheadline: subheadlineIdx >= 0 ? assets.subheadlines[subheadlineIdx] : null,
      cta: assets.ctas[ctaIdx],
      socialProof: socialProofIdx >= 0 ? assets.socialProof[socialProofIdx] : null,
      offer: offerIdx >= 0 ? assets.offers[offerIdx] : null,
      logo: assets.logo || null,
    };

    const brandFont = assets.brandColors?.font || null;
    const config = validateDesign({ palette, layout, format });

    return {
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

  _pickIndex(array, slot, rng) {
    if (slot in this.lockedSlots) {
      const locked = this.lockedSlots[slot];
      return Math.min(locked, array.length - 1);
    }
    return rng.int(0, array.length - 1);
  }

  _pickLayout(layouts, assets, headline, format, rng) {
    const headlineWords = countWords(headline);
    const imageCount = assets.images.length;
    const hasOfferAsset = hasItems(assets.offers);
    const hasSocialAsset = hasItems(assets.socialProof);
    const hasSubheadlineAsset = hasItems(assets.subheadlines);
    const hasLogo = !!assets.logo;

    return this._weightedPick(layouts, (layout) => {
      if (!layout.restaurantSafe) return 0;
      if (layout.minImages > imageCount) return 0;

      let score = 40 * (layout.scoreBoost || 1);
      score += layout.imageWeight * 36;

      if (layout.tags.includes('hero')) score += 10;
      if (layout.tags.includes('overlay')) score += 4;
      if (layout.tags.includes('comparison') && imageCount >= 2) score += 5;
      if (format === 'vertical' && layout.tags.includes('mobile-native')) score += 6;

      if (hasOfferAsset) {
        score += layout.prefersOffer ? 16 : -12;
      } else if (layout.prefersOffer) {
        score -= 8;
      }

      if (hasSocialAsset) {
        score += layout.prefersSocial ? 10 : -2;
      } else if (layout.prefersSocial) {
        score -= 4;
      }

      if (!hasLogo && layout.hasLogoArea) {
        score -= 10;
      }

      if (!hasSubheadlineAsset && layout.areas.includes('subheadline')) {
        score -= 6;
      }

      if (headlineWords > layout.maxHeadlineWords + 2) {
        score -= 24;
      } else if (headlineWords > layout.maxHeadlineWords) {
        score -= 12;
      } else if (headlineWords <= Math.max(3, layout.maxHeadlineWords - 2) && layout.tags.includes('short-headline')) {
        score += 8;
      }

      if (layout.textDensity >= 5) {
        score -= 6;
      } else if (layout.textDensity <= 4) {
        score += 4;
      }

      return Math.max(0, score);
    }, rng);
  }

  _pickPalette(assets, layout, rng) {
    let pool;
    if (assets.brandColors && assets.brandColors.use) {
      if (!this._brandVariations) {
        this._brandVariations = generateBrandVariations(
          assets.brandColors.primary,
          assets.brandColors.secondary,
          assets.brandColors.accent,
        );
      }
      pool = this._brandVariations;
    } else {
      pool = RESTAURANT_PALETTES;
    }

    if ('palette' in this.lockedSlots) {
      const idx = Math.min(this.lockedSlots.palette, pool.length - 1);
      return { palette: pool[idx], paletteIdx: idx };
    }

    const palette = this._weightedPick(pool, (entry) => {
      let score = 20 * (entry.restaurantBoost || 1);
      if (layout.tags.includes('bold-cta')) score += 2;
      return score;
    }, rng);

    const paletteIdx = pool.findIndex((entry) => entry.id === palette.id);
    return { palette, paletteIdx };
  }

  _pickFontPairing(layout, rng) {
    const pool = RESTAURANT_FONT_PAIRINGS;
    if ('font' in this.lockedSlots) {
      const idx = Math.min(this.lockedSlots.font, pool.length - 1);
      return { fontPairing: pool[idx], fontIdx: idx };
    }

    const fontPairing = this._weightedPick(pool, (pairing) => {
      let score = 18 * (pairing.restaurantBoost || 1);
      if (layout.tags.includes('bold-headline') || layout.tags.includes('short-headline')) {
        score += pairing.mood === 'bold' ? 8 : 0;
      }
      if (layout.tags.includes('centered') || layout.maxHeadlineWords > 7) {
        score += ['modern-clean', 'friendly-geo', 'power-sans'].includes(pairing.id) ? 6 : 0;
      }
      if (layout.tags.includes('overlay')) {
        score += ['casual-punch', 'power-sans', 'street-bold'].includes(pairing.id) ? 4 : 0;
      }
      return score;
    }, rng);

    const fontIdx = pool.findIndex((entry) => entry.id === fontPairing.id);
    return { fontPairing, fontIdx };
  }

  _pickSecondImageIndex(images, primaryIdx, layout, rng) {
    const needsImage2 = layout.minImages > 1 || (layout.areas && layout.areas.includes('image2'));
    if (!needsImage2 || images.length < 2) return -1;

    let idx = rng.int(0, images.length - 1);
    if (idx === primaryIdx) {
      idx = (idx + 1) % images.length;
    }
    return idx;
  }

  // ---------------------------------------------------------------------------
  // Scoring and selection
  // ---------------------------------------------------------------------------

  _scoreVariant(variant, assets) {
    const { layout, palette, fontPairing, content } = variant;
    const headlineWords = countWords(content.headline);
    const headlineChars = countChars(content.headline);
    const hasOfferAsset = hasItems(assets.offers);
    const hasSocialAsset = hasItems(assets.socialProof);
    const hasLogoAsset = !!assets.logo;
    const priorLayoutUses = this.generatedLayoutUsage.get(layout.id) || 0;

    let score = 100 * (layout.scoreBoost || 1);
    score += layout.imageWeight * 60;
    score += (palette.restaurantBoost || 1) * 18;
    score += (fontPairing.restaurantBoost || 1) * 10;

    if (layout.tags.includes('hero')) score += 10;
    if (layout.tags.includes('overlay')) score += 4;
    if (layout.tags.includes('comparison') && content.image2) score += 5;

    if (hasOfferAsset) {
      score += content.offer ? 16 : -16;
    }
    if (hasSocialAsset) {
      score += content.socialProof ? 8 : (layout.prefersSocial ? -8 : -2);
    }
    if (!hasLogoAsset && layout.hasLogoArea) {
      score -= 10;
    }

    if (headlineWords > layout.maxHeadlineWords) {
      score -= 14 + ((headlineWords - layout.maxHeadlineWords) * 4);
    } else if (headlineWords <= Math.max(3, layout.maxHeadlineWords - 2) && layout.tags.includes('short-headline')) {
      score += 6;
    }

    if (headlineChars > 48 && layout.tags.includes('short-headline')) {
      score -= 12;
    }

    if (content.subheadline && layout.textDensity >= 5) {
      score -= 6;
    }

    if (layout.textDensity <= 4) score += 6;
    if (layout.textDensity >= 6) score -= 8;

    if (!content.offer && !content.socialProof && layout.imageWeight < 0.5) {
      score -= 8;
    }

    score -= priorLayoutUses * 24;

    return score;
  }

  _selectBestVariants(ranked, count, formats) {
    const selected = [];
    const formatTargets = this._buildFormatTargets(formats, count);
    const formatCounts = Object.fromEntries(formats.map((format) => [format, 0]));
    const familyCounts = new Map();
    const layoutIds = new Set();

    const canTake = (entry, enforceFormatTarget = true, enforceFamilyLimit = true) => {
      const { format, layout } = entry.variant;
      const familyKey = `${format}:${layout.family}`;
      if (layoutIds.has(layout.id)) return false;
      if (enforceFormatTarget && formatCounts[format] >= formatTargets[format]) return false;
      if (enforceFamilyLimit && (familyCounts.get(familyKey) || 0) >= 2) return false;
      return true;
    };

    const addEntry = (entry) => {
      const { format, layout } = entry.variant;
      const familyKey = `${format}:${layout.family}`;
      selected.push(entry);
      layoutIds.add(layout.id);
      formatCounts[format] = (formatCounts[format] || 0) + 1;
      familyCounts.set(familyKey, (familyCounts.get(familyKey) || 0) + 1);
    };

    for (const entry of ranked) {
      if (!canTake(entry, true, true)) continue;
      addEntry(entry);
      if (selected.length === count) return selected;
    }

    for (const entry of ranked) {
      if (!canTake(entry, true, false)) continue;
      addEntry(entry);
      if (selected.length === count) return selected;
    }

    for (const entry of ranked) {
      if (!canTake(entry, false, false)) continue;
      addEntry(entry);
      if (selected.length === count) return selected;
    }

    return selected;
  }

  _buildFormatTargets(formats, count) {
    const targets = {};
    const base = Math.floor(count / formats.length);
    let remainder = count % formats.length;
    for (const format of formats) {
      targets[format] = base + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder--;
    }
    return targets;
  }

  _weightedPick(items, getWeight, rng) {
    const weighted = items
      .map((item) => ({ item, weight: getWeight(item) }))
      .filter((entry) => entry.weight > 0);

    if (weighted.length === 0) {
      return items[0] || null;
    }

    const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
    let cursor = rng.next() * total;

    for (const entry of weighted) {
      cursor -= entry.weight;
      if (cursor <= 0) {
        return entry.item;
      }
    }

    return weighted[weighted.length - 1].item;
  }
}
