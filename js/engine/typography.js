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
    id: 'luxury-classic',
    name: 'Luxury Classic',
    headline: "'Playfair Display', Georgia, serif",
    body: "'Cormorant Garamond', Georgia, serif",
    headlineWeight: 900,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '-0.03em',
    headlineTransform: 'none',
    ctaTransform: 'uppercase',
    mood: 'elegant',
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
    id: 'statement-serif',
    name: 'Statement Serif',
    headline: "'Cormorant Garamond', Georgia, serif",
    body: "'Inter', system-ui, sans-serif",
    headlineWeight: 600,
    bodyWeight: 400,
    ctaWeight: 600,
    headlineTracking: '0',
    headlineTransform: 'none',
    ctaTransform: 'uppercase',
    mood: 'elegant',
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

export const TYPE_SCALES = {
  square:     { headline: 84, subheadline: 32, cta: 24, small: 18, offer: 20 },
  vertical:   { headline: 96, subheadline: 36, cta: 28, small: 20, offer: 22 },
  horizontal: { headline: 56, subheadline: 24, cta: 20, small: 14, offer: 16 },
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
