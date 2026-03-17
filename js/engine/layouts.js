// Layout blueprint definitions for the grid-based ad design generator.
// Each layout maps to a pre-defined CSS class and describes grid-area usage.

const BASE_REQUIRED = ['image', 'headline', 'cta'];
const TEXT_AREAS = new Set(['headline', 'subheadline', 'offer', 'cta', 'social']);

function deriveRequired(areas) {
  return BASE_REQUIRED.filter((area) => areas.includes(area));
}

function deriveOptional(areas, required) {
  return areas.filter((area) => !required.includes(area));
}

function layout(id, name, areas, hasOverlay = false, overlayType = null, imageWeight = 0) {
  const cssClass = `layout-${id}`;
  const requiredAreas = deriveRequired(areas);
  const optionalAreas = deriveOptional(areas, requiredAreas);
  return { id, cssClass, name, areas, requiredAreas, optionalAreas, hasOverlay, overlayType, imageWeight };
}

const RESTAURANT_LAYOUT_META = {
  square: {
    'sq-golden-split': { restaurantSafe: true, family: 'hero', tags: ['hero', 'offer', 'baseline', 'image-left'], maxHeadlineWords: 9, scoreBoost: 1.18 },
    'sq-type-hero':    { restaurantSafe: false, family: 'type', tags: ['text-heavy'], maxHeadlineWords: 4, scoreBoost: 0.40 },
    'sq-modular':      { restaurantSafe: true, family: 'modular', tags: ['hero', 'short-headline', 'modular'], maxHeadlineWords: 6, scoreBoost: 0.96 },
    'sq-centered':     { restaurantSafe: false, family: 'centered', tags: ['hero', 'centered', 'clean'], maxHeadlineWords: 5, scoreBoost: 0.86 },
    'sq-full-bleed':   { restaurantSafe: true, family: 'overlay', tags: ['hero', 'offer', 'overlay', 'dramatic'], maxHeadlineWords: 8, scoreBoost: 1.16 },
    'sq-thirds':       { restaurantSafe: true, family: 'hero', tags: ['hero', 'offer', 'image-dominant'], maxHeadlineWords: 9, scoreBoost: 1.20 },
    'sq-stacked':      { restaurantSafe: true, family: 'stack', tags: ['offer', 'bold-cta', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 1.02 },
    'sq-editorial':    { restaurantSafe: false, family: 'editorial', tags: ['editorial'], maxHeadlineWords: 6, scoreBoost: 0.55 },
    'sq-minimal':      { restaurantSafe: false, family: 'minimal', tags: ['minimal'], maxHeadlineWords: 5, scoreBoost: 0.50 },
    'sq-billboard':    { restaurantSafe: true, family: 'billboard', tags: ['offer', 'bold-headline', 'cta-emphasis'], maxHeadlineWords: 5, scoreBoost: 1.04 },
    'sq-duo-showcase': { restaurantSafe: true, family: 'duo', tags: ['duo', 'comparison', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 0.98, minImages: 2 },
    'sq-dark-overlay': { restaurantSafe: true, family: 'overlay', tags: ['hero', 'overlay', 'dark', 'short-headline'], maxHeadlineWords: 6, scoreBoost: 1.02 },
    'sq-diagonal':     { restaurantSafe: false, family: 'editorial', tags: ['editorial', 'asymmetric'], maxHeadlineWords: 5, scoreBoost: 0.58 },
    'sq-card':         { restaurantSafe: false, family: 'card', tags: ['hero', 'centered', 'modern'], maxHeadlineWords: 5, scoreBoost: 0.84 },
    'sq-banner-top':   { restaurantSafe: false, family: 'type', tags: ['text-heavy'], maxHeadlineWords: 5, scoreBoost: 0.46 },
  },
  vertical: {
    'vt-story-hero':     { restaurantSafe: true, family: 'story', tags: ['hero', 'offer', 'proof', 'mobile-native'], maxHeadlineWords: 10, scoreBoost: 1.20 },
    'vt-full-screen':    { restaurantSafe: true, family: 'overlay', tags: ['hero', 'offer', 'proof', 'overlay', 'dramatic'], maxHeadlineWords: 9, scoreBoost: 1.16 },
    'vt-type-stack':     { restaurantSafe: false, family: 'type', tags: ['text-heavy'], maxHeadlineWords: 4, scoreBoost: 0.42 },
    'vt-three-panel':    { restaurantSafe: true, family: 'stack', tags: ['offer', 'bold-cta', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 1.00 },
    'vt-sidebar':        { restaurantSafe: true, family: 'hero', tags: ['hero', 'offer', 'stripe'], maxHeadlineWords: 8, scoreBoost: 1.00 },
    'vt-centered':       { restaurantSafe: false, family: 'centered', tags: ['hero', 'centered', 'clean'], maxHeadlineWords: 6, scoreBoost: 0.82 },
    'vt-frame':          { restaurantSafe: false, family: 'decorative', tags: ['decorative'], maxHeadlineWords: 6, scoreBoost: 0.56 },
    'vt-split-contrast': { restaurantSafe: true, family: 'contrast', tags: ['offer', 'bold-cta', 'contrast'], maxHeadlineWords: 5, scoreBoost: 0.96 },
    'vt-cascade':        { restaurantSafe: false, family: 'editorial', tags: ['editorial', 'diagonal'], maxHeadlineWords: 6, scoreBoost: 0.58 },
    'vt-magazine':       { restaurantSafe: false, family: 'editorial', tags: ['editorial'], maxHeadlineWords: 6, scoreBoost: 0.52 },
    'vt-duo-stack':      { restaurantSafe: true, family: 'duo', tags: ['duo', 'comparison', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 0.98, minImages: 2 },
    'vt-dark-immersive': { restaurantSafe: true, family: 'overlay', tags: ['hero', 'offer', 'overlay', 'dark'], maxHeadlineWords: 6, scoreBoost: 1.06 },
    'vt-card-float':     { restaurantSafe: false, family: 'card', tags: ['hero', 'image-top', 'centered'], maxHeadlineWords: 6, scoreBoost: 0.84 },
    'vt-top-heavy':      { restaurantSafe: true, family: 'hero', tags: ['hero', 'image-dominant', 'standard'], maxHeadlineWords: 8, scoreBoost: 1.08 },
    'vt-split-duo':      { restaurantSafe: true, family: 'duo', tags: ['duo', 'comparison', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 0.94, minImages: 2 },
  },
  horizontal: {
    'hz-golden-split':   { restaurantSafe: true, family: 'hero', tags: ['hero', 'baseline', 'image-left'], maxHeadlineWords: 6, scoreBoost: 1.12 },
    'hz-full-banner':    { restaurantSafe: true, family: 'overlay', tags: ['hero', 'overlay', 'dramatic'], maxHeadlineWords: 6, scoreBoost: 1.08 },
    'hz-three-col':      { restaurantSafe: true, family: 'three-col', tags: ['offer', 'balanced', 'short-headline'], maxHeadlineWords: 6, scoreBoost: 0.92 },
    'hz-type-forward':   { restaurantSafe: false, family: 'type', tags: ['text-heavy'], maxHeadlineWords: 5, scoreBoost: 0.50 },
    'hz-center-stage':   { restaurantSafe: true, family: 'overlay', tags: ['hero', 'overlay', 'dark', 'centered'], maxHeadlineWords: 5, scoreBoost: 0.98 },
    'hz-bookend':        { restaurantSafe: false, family: 'spread', tags: ['balanced', 'spread'], maxHeadlineWords: 6, scoreBoost: 0.82 },
    'hz-offset':         { restaurantSafe: true, family: 'offset', tags: ['hero', 'offer', 'dynamic'], maxHeadlineWords: 6, scoreBoost: 0.96 },
    'hz-minimal-strip':  { restaurantSafe: true, family: 'strip', tags: ['minimal', 'compact', 'offer', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 1.00 },
    'hz-power-right':    { restaurantSafe: true, family: 'hero', tags: ['hero', 'offer', 'image-right'], maxHeadlineWords: 8, scoreBoost: 1.14 },
    'hz-banded':         { restaurantSafe: false, family: 'stack', tags: ['text-heavy'], maxHeadlineWords: 6, scoreBoost: 0.56 },
    'hz-duo-thirds':     { restaurantSafe: true, family: 'duo', tags: ['duo', 'comparison', 'short-headline'], maxHeadlineWords: 5, scoreBoost: 0.96, minImages: 2 },
    'hz-gradient-left':  { restaurantSafe: true, family: 'overlay', tags: ['hero', 'overlay', 'dramatic'], maxHeadlineWords: 8, scoreBoost: 1.08 },
    'hz-split-half':     { restaurantSafe: true, family: 'split', tags: ['hero', 'balanced', 'reliable'], maxHeadlineWords: 8, scoreBoost: 1.02 },
    'hz-panoramic':      { restaurantSafe: true, family: 'panoramic', tags: ['hero', 'image-top', 'centered-text'], maxHeadlineWords: 8, scoreBoost: 1.04 },
    'hz-sidebar-accent': { restaurantSafe: false, family: 'accent', tags: ['accent', 'stripe'], maxHeadlineWords: 6, scoreBoost: 0.84 },
  },
};

function applyRestaurantMeta(format, layouts) {
  return layouts.map((entry) => {
    const meta = RESTAURANT_LAYOUT_META[format]?.[entry.id] || {};
    return {
      ...entry,
      format,
      restaurantSafe: meta.restaurantSafe ?? false,
      family: meta.family ?? 'experimental',
      tags: meta.tags ?? [],
      maxHeadlineWords: meta.maxHeadlineWords ?? 7,
      scoreBoost: meta.scoreBoost ?? 0.75,
      minImages: meta.minImages ?? (entry.areas.includes('image2') ? 2 : 1),
      textDensity: entry.areas.filter((area) => TEXT_AREAS.has(area)).length,
      prefersOffer: entry.areas.includes('offer'),
      prefersSocial: entry.areas.includes('social'),
      hasLogoArea: entry.areas.includes('logo'),
    };
  });
}

const RAW_LAYOUTS = {
  square: [
    layout('sq-golden-split', 'Golden Split', ['image', 'logo', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.62),
    layout('sq-type-hero', 'Type Hero', ['logo', 'headline', 'subheadline', 'offer', 'cta', 'image'], false, null, 0.40),
    layout('sq-modular', 'Modular Grid', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.45),
    layout('sq-centered', 'Centered Axis', ['logo', 'headline', 'image', 'offer', 'cta'], false, null, 0.42),
    layout('sq-full-bleed', 'Full Bleed', ['image', 'logo', 'offer', 'headline', 'subheadline', 'cta'], true, 'gradient-bottom', 0.65),
    layout('sq-thirds', 'Rule of Thirds', ['image', 'logo', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.67),
    layout('sq-stacked', 'Bold Stacked', ['image', 'headline', 'offer', 'cta'], false, null, 0.45),
    layout('sq-editorial', 'Editorial Asymmetric', ['logo', 'image', 'headline', 'subheadline', 'cta'], false, null, 0.5),
    layout('sq-minimal', 'Minimal Breathe', ['image', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.42),
    layout('sq-billboard', 'Billboard', ['headline', 'subheadline', 'image', 'offer', 'cta'], false, null, 0.45),
    layout('sq-duo-showcase', 'Duo Showcase', ['image', 'image2', 'headline', 'cta'], false, null, 0.60),
    layout('sq-dark-overlay', 'Dark Overlay', ['image', 'logo', 'headline', 'cta'], true, 'dark', 0.65),
    layout('sq-diagonal', 'Diagonal', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.55),
    layout('sq-card', 'Card', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.40),
    layout('sq-banner-top', 'Banner Top', ['image', 'headline', 'cta', 'logo'], false, null, 0.35),
  ],
  vertical: [
    layout('vt-story-hero', 'Story Hero', ['image', 'headline', 'subheadline', 'offer', 'cta', 'social'], false, null, 0.55),
    layout('vt-full-screen', 'Full Screen', ['image', 'logo', 'offer', 'headline', 'subheadline', 'cta', 'social'], true, 'gradient-bottom', 0.65),
    layout('vt-type-stack', 'Type Stack', ['logo', 'headline', 'subheadline', 'offer', 'cta', 'image'], false, null, 0.42),
    layout('vt-three-panel', 'Three Panels', ['image', 'headline', 'offer', 'cta'], false, null, 0.45),
    layout('vt-sidebar', 'Accent Sidebar', ['stripe', 'logo', 'image', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.45),
    layout('vt-centered', 'Centered Minimal', ['logo', 'image', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.40),
    layout('vt-frame', 'Framed Image', ['logo', 'image', 'headline', 'subheadline', 'cta'], false, null, 0.4),
    layout('vt-split-contrast', 'Split Contrast', ['logo', 'headline', 'cta', 'image'], false, null, 0.5),
    layout('vt-cascade', 'Cascade', ['logo', 'image', 'headline', 'subheadline', 'cta'], false, null, 0.35),
    layout('vt-magazine', 'Magazine Editorial', ['logo', 'image', 'headline', 'subheadline', 'cta'], false, null, 0.5),
    layout('vt-duo-stack', 'Duo Stack', ['image', 'image2', 'headline', 'cta'], false, null, 0.60),
    layout('vt-dark-immersive', 'Dark Immersive', ['image', 'logo', 'headline', 'offer', 'cta'], true, 'dark', 0.65),
    layout('vt-card-float', 'Card Float', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.55),
    layout('vt-top-heavy', 'Top Heavy', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.65),
    layout('vt-split-duo', 'Split Duo', ['image', 'image2', 'headline', 'cta'], false, null, 0.55),
  ],
  horizontal: [
    layout('hz-golden-split', 'Golden Split', ['image', 'logo', 'headline', 'cta'], false, null, 0.62),
    layout('hz-full-banner', 'Full Banner', ['image', 'logo', 'headline', 'cta'], true, 'gradient-right', 0.65),
    layout('hz-three-col', 'Three Column', ['image', 'logo', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.40),
    layout('hz-type-forward', 'Type Forward', ['logo', 'headline', 'offer', 'cta', 'image'], false, null, 0.42),
    layout('hz-center-stage', 'Center Stage', ['image', 'logo', 'headline', 'cta'], true, 'dark', 0.65),
    layout('hz-bookend', 'Bookend', ['image', 'logo', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.38),
    layout('hz-offset', 'Offset Grid', ['image', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.4),
    layout('hz-minimal-strip', 'Minimal Strip', ['image', 'headline', 'offer', 'cta'], false, null, 0.38),
    layout('hz-power-right', 'Power Right', ['image', 'logo', 'headline', 'subheadline', 'offer', 'cta'], false, null, 0.6),
    layout('hz-banded', 'Banded', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.4),
    layout('hz-duo-thirds', 'Duo Thirds', ['image', 'headline', 'cta', 'image2'], false, null, 0.55),
    layout('hz-gradient-left', 'Gradient Left', ['image', 'logo', 'headline', 'subheadline', 'cta'], true, 'gradient-left', 0.65),
    layout('hz-split-half', 'Split Half', ['image', 'logo', 'headline', 'subheadline', 'cta'], false, null, 0.50),
    layout('hz-panoramic', 'Panoramic', ['image', 'headline', 'subheadline', 'cta'], false, null, 0.55),
    layout('hz-sidebar-accent', 'Sidebar Accent', ['stripe', 'image', 'headline', 'subheadline', 'cta'], false, null, 0.45),
  ],
};

export const LAYOUTS = {
  square: applyRestaurantMeta('square', RAW_LAYOUTS.square),
  vertical: applyRestaurantMeta('vertical', RAW_LAYOUTS.vertical),
  horizontal: applyRestaurantMeta('horizontal', RAW_LAYOUTS.horizontal),
};

export function getLayoutsForFormat(format) {
  return LAYOUTS[format] || [];
}

export function getRestaurantLayoutsForFormat(format) {
  return getLayoutsForFormat(format).filter((entry) => entry.restaurantSafe);
}

export function getRandomLayout(format) {
  const layouts = getRestaurantLayoutsForFormat(format);
  return layouts.length ? layouts[Math.floor(Math.random() * layouts.length)] : null;
}
