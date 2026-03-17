export const FONT_PAIRINGS = [
  {
    id: 'editorial-serif',
    name: 'Editorial Serif',
    headline: "'DM Serif Display', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    headlineWeight: 400,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '-0.02em',
    headlineTransform: 'none',
    ctaTransform: 'uppercase',
    mood: 'elegant',
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    headline: "'Bebas Neue', Impact, sans-serif",
    body: "'Space Grotesk', system-ui, sans-serif",
    headlineWeight: 400,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '0.04em',
    headlineTransform: 'uppercase',
    ctaTransform: 'uppercase',
    mood: 'bold',
  },
  {
    id: 'modern-clean',
    name: 'Modern Clean',
    headline: "'Space Grotesk', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    headlineWeight: 700,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '-0.02em',
    headlineTransform: 'none',
    ctaTransform: 'uppercase',
    mood: 'modern',
  },
  {
    id: 'casual-punch',
    name: 'Casual Punch',
    headline: "'Outfit', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    headlineWeight: 800,
    bodyWeight: 400,
    ctaWeight: 700,
    headlineTracking: '0',
    headlineTransform: 'uppercase',
    ctaTransform: 'uppercase',
    mood: 'bold',
  },
  {
    id: 'friendly-geo',
    name: 'Friendly Geometric',
    headline: "'Outfit', system-ui, sans-serif",
    body: "'Sora', system-ui, sans-serif",
    headlineWeight: 700,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '0',
    headlineTransform: 'none',
    ctaTransform: 'uppercase',
    mood: 'playful',
  },
  {
    id: 'minimal-swiss',
    name: 'Minimal Swiss',
    headline: "'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    headlineWeight: 800,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '-0.02em',
    headlineTransform: 'uppercase',
    ctaTransform: 'uppercase',
    mood: 'clean',
  },
  {
    id: 'street-bold',
    name: 'Street Bold',
    headline: "'Bebas Neue', Impact, sans-serif",
    body: "'Sora', system-ui, sans-serif",
    headlineWeight: 400,
    bodyWeight: 400,
    ctaWeight: 700,
    headlineTracking: '0.05em',
    headlineTransform: 'uppercase',
    ctaTransform: 'uppercase',
    mood: 'bold',
  },
  {
    id: 'power-sans',
    name: 'Power Sans',
    headline: "'Sora', system-ui, sans-serif",
    body: "'Outfit', system-ui, sans-serif",
    headlineWeight: 800,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '-0.01em',
    headlineTransform: 'uppercase',
    ctaTransform: 'uppercase',
    mood: 'bold',
  },
];

const FONT_PAIRING_META = {
  "editorial-serif": { restaurantSafe: false, restaurantBoost: 0.58 },
  "bold-impact":     { restaurantSafe: true,  restaurantBoost: 1.02 },
  "modern-clean":    { restaurantSafe: true,  restaurantBoost: 1.04 },
  "casual-punch":    { restaurantSafe: true,  restaurantBoost: 1.16 },
  "friendly-geo":    { restaurantSafe: true,  restaurantBoost: 1.10 },
  "minimal-swiss":   { restaurantSafe: false, restaurantBoost: 0.72 },
  "street-bold":     { restaurantSafe: true,  restaurantBoost: 1.12 },
  "power-sans":      { restaurantSafe: true,  restaurantBoost: 1.08 },
};

function enrichPairing(pairing) {
  return {
    ...pairing,
    ...(FONT_PAIRING_META[pairing.id] || { restaurantSafe: false, restaurantBoost: 0.8 }),
  };
}

export const RESTAURANT_FONT_PAIRINGS = FONT_PAIRINGS
  .filter((pairing) => FONT_PAIRING_META[pairing.id]?.restaurantSafe)
  .map(enrichPairing);

export const TYPE_SCALES = {
  square:     { headline: 88,  subheadline: 36, cta: 34, small: 24, offer: 30 },
  vertical:   { headline: 104, subheadline: 42, cta: 38, small: 28, offer: 34 },
  horizontal: { headline: 64,  subheadline: 30, cta: 28, small: 20, offer: 26 },
};

export function applyTypography(canvasElement, pairing, format) {
  const scale = TYPE_SCALES[format];
  if (!scale) {
    throw new Error(`Unknown format "${format}". Use: square, vertical, horizontal`);
  }

  const s = canvasElement.style;
  s.setProperty('--ad-font-headline', pairing.headline);
  s.setProperty('--ad-font-body', pairing.body);
  s.setProperty('--ad-weight-headline', String(pairing.headlineWeight));
  s.setProperty('--ad-weight-body', String(pairing.bodyWeight || 400));
  s.setProperty('--ad-weight-cta', String(pairing.ctaWeight || 700));
  s.setProperty('--ad-size-headline', `${scale.headline}px`);
  s.setProperty('--ad-size-subheadline', `${scale.subheadline}px`);
  s.setProperty('--ad-size-cta', `${scale.cta}px`);
  s.setProperty('--ad-size-small', `${scale.small}px`);
  s.setProperty('--ad-size-offer', `${scale.offer || scale.small}px`);
  s.setProperty('--ad-tracking-headline', pairing.headlineTracking || '0');
  s.setProperty('--ad-transform-headline', pairing.headlineTransform || 'none');
  s.setProperty('--ad-transform-cta', pairing.ctaTransform || 'uppercase');
}

export function applyBrandFont(canvasElement, fontName) {
  if (!fontName) return;
  const fontStack = `'${fontName}', system-ui, sans-serif`;
  const s = canvasElement.style;
  s.setProperty('--ad-font-headline', fontStack);
  s.setProperty('--ad-font-body', fontStack);
}

export function getRandomPairing() {
  return FONT_PAIRINGS[Math.floor(Math.random() * FONT_PAIRINGS.length)];
}
