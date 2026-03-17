// Color palette system for grid-based ad design generator
// 12 professional-grade palettes following the 60-30-10 rule
//
// Structure per palette:
//   surface    — 60% dominant background
//   primary    — 30% headline / brand color
//   secondary  — 30% muted subheadline / supporting color
//   cta        — 10% accent that pops
//   offer      — secondary accent for offer badges (distinct from CTA)

export const PALETTES = [
  // 1 — Royal Navy: deep navy surface, warm gold headline, coral CTA (luxury/premium)
  {
    id: "royal-navy",
    name: "Royal Navy",
    primary: "#e8b84b",
    secondary: "#8da0c2",
    surface: "#0b1d3a",
    onSurface: "#c8d4e8",
    cta: "#c94232",
    onCta: "#ffffff",
    offer: "#1e3a6b",
    onOffer: "#f0e6d3",
  },
  // 2 — Crimson Edge: off-white surface, deep burgundy headline, bright red CTA (bold/powerful)
  {
    id: "crimson-edge",
    name: "Crimson Edge",
    primary: "#8b1a2b",
    secondary: "#a85465",
    surface: "#faf7f5",
    onSurface: "#3a2028",
    cta: "#d42c2c",
    onCta: "#ffffff",
    offer: "#6b1028",
    onOffer: "#fce8ec",
  },
  // 3 — Forest & Amber: warm cream surface, deep forest green headline, honey CTA (organic/natural)
  {
    id: "forest-amber",
    name: "Forest & Amber",
    primary: "#1a5c3a",
    secondary: "#4a7a5c",
    surface: "#f9f3e8",
    onSurface: "#2a3a28",
    cta: "#d4880c",
    onCta: "#1a0e02",
    offer: "#2a6b45",
    onOffer: "#e8f5ec",
  },
  // 4 — Electric Violet: cool near-black surface, electric purple headline, hot pink CTA (tech/modern)
  {
    id: "electric-violet",
    name: "Electric Violet",
    primary: "#a855f7",
    secondary: "#7a6baa",
    surface: "#0e0b1a",
    onSurface: "#d8d0e8",
    cta: "#d4206e",
    onCta: "#ffffff",
    offer: "#3a1a6b",
    onOffer: "#e0d0f5",
  },
  // 5 — Coral Sunrise: light peach surface, deep coral headline, teal CTA (warm/energetic)
  {
    id: "coral-sunrise",
    name: "Coral Sunrise",
    primary: "#b83a24",
    secondary: "#b5725e",
    surface: "#fdf0ea",
    onSurface: "#3a2018",
    cta: "#0a7a7a",
    onCta: "#ffffff",
    offer: "#b84830",
    onOffer: "#ffffff",
  },
  // 6 — Ocean Breeze: light blue-gray surface, deep teal headline, vivid orange CTA (trustworthy)
  {
    id: "ocean-breeze",
    name: "Ocean Breeze",
    primary: "#0e5e6f",
    secondary: "#3a8a9a",
    surface: "#edf2f7",
    onSurface: "#1a2e38",
    cta: "#e87420",
    onCta: "#1a0e04",
    offer: "#145e6a",
    onOffer: "#d8f0f5",
  },
  // 7 — Sage & Terracotta: sage green surface, rich terracotta headline, warm brown CTA (earthy/calm)
  {
    id: "sage-terracotta",
    name: "Sage & Terracotta",
    primary: "#9a3a22",
    secondary: "#8a5a42",
    surface: "#dce5d8",
    onSurface: "#1a2a1e",
    cta: "#7a3a18",
    onCta: "#ffffff",
    offer: "#4a5a38",
    onOffer: "#e8f0e2",
  },
  // 8 — Indigo Dusk: deep indigo surface, warm cream headline, vivid amber CTA (sophisticated)
  {
    id: "indigo-dusk",
    name: "Indigo Dusk",
    primary: "#f0e4c8",
    secondary: "#8a82b5",
    surface: "#141038",
    onSurface: "#c0bce0",
    cta: "#e8a020",
    onCta: "#1a1005",
    offer: "#2a2460",
    onOffer: "#dcd6f0",
  },
  // 9 — Berry Pop: soft lavender surface, deep berry headline, chartreuse CTA (playful/creative)
  {
    id: "berry-pop",
    name: "Berry Pop",
    primary: "#8a1a6a",
    secondary: "#a854a0",
    surface: "#f0e8f8",
    onSurface: "#2a1028",
    cta: "#6abf1a",
    onCta: "#0a1a04",
    offer: "#b82a8a",
    onOffer: "#ffffff",
  },
  // 10 — Warm Espresso: rich dark brown surface, cream headline, burnt orange CTA (luxe/warm)
  {
    id: "warm-espresso",
    name: "Warm Espresso",
    primary: "#f0e2c8",
    secondary: "#a8927a",
    surface: "#1e1208",
    onSurface: "#d8ccb8",
    cta: "#d46a1a",
    onCta: "#1a0a02",
    offer: "#3a2810",
    onOffer: "#e8dcc8",
  },
  // 11 — Steel & Cyan: cool gray surface, slate blue headline, bright cyan CTA (corporate/tech)
  {
    id: "steel-cyan",
    name: "Steel & Cyan",
    primary: "#2a4a7a",
    secondary: "#5a7a9a",
    surface: "#e8ecf0",
    onSurface: "#1a2a3a",
    cta: "#00b8d4",
    onCta: "#041a20",
    offer: "#3a5a8a",
    onOffer: "#e0eaf5",
  },
  // 12 — Mono Luxe: pure white surface, rich charcoal headline, warm black CTA (timeless/minimal)
  {
    id: "mono-luxe",
    name: "Mono Luxe",
    primary: "#2d2d2d",
    secondary: "#6b6360",
    surface: "#ffffff",
    onSurface: "#2d2d2d",
    cta: "#1a1816",
    onCta: "#ffffff",
    offer: "#f0ece8",
    onOffer: "#2d2d2d",
  },
];

/**
 * Parse a hex color string into { r, g, b } (0-255).
 */
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/**
 * Convert { r, g, b } back to a hex string.
 */
function rgbToHex({ r, g, b }) {
  return (
    "#" +
    [r, g, b].map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0")).join("")
  );
}

/**
 * Relative luminance per WCAG 2.x (0 = black, 1 = white).
 */
function luminance({ r, g, b }) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * WCAG contrast ratio between two RGB colors (1–21).
 */
function contrastRatio(a, b) {
  const la = luminance(a) + 0.05;
  const lb = luminance(b) + 0.05;
  return la > lb ? la / lb : lb / la;
}

/**
 * Lighten or darken an RGB color by a factor (-1..1).
 * Positive = lighten toward white, negative = darken toward black.
 */
function adjustBrightness({ r, g, b }, factor) {
  if (factor > 0) {
    return {
      r: r + (255 - r) * factor,
      g: g + (255 - g) * factor,
      b: b + (255 - b) * factor,
    };
  }
  const f = 1 + factor;
  return { r: r * f, g: g * f, b: b * f };
}

/**
 * Pick a text color (near-black or near-white) that has good contrast on `bg`.
 */
function textColorOn(bgRgb) {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 17, g: 17, b: 17 };
  return contrastRatio(bgRgb, white) >= contrastRatio(bgRgb, black) ? white : black;
}

// ── HSL color-theory helpers ──────────────────────────────────────

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

function hslToRgb({ h, s, l }) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60)       { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rotateHue(hex, degrees) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.h = (hsl.h + degrees) % 360;
  return rgbToHex(hslToRgb(hsl));
}

function setLightness(hex, newL) {
  const hsl = rgbToHsl(hexToRgb(hex));
  hsl.l = Math.max(0, Math.min(1, newL));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Generate 8 brand palette variations from user-supplied brand colors.
 * Each variation uses at least one brand color in a prominent role,
 * combined with color-theory harmonies for variety.
 */
export function generateBrandVariations(primary, secondary, accent) {
  const variations = [];

  // 1. Original brand palette (direct)
  variations.push(createBrandPalette(primary, secondary, accent));
  variations[0].name = "Brand Original";
  variations[0].id = "brand-original";

  // 2. Complementary: swap secondary for primary's complement
  const complement = rotateHue(primary, 180);
  variations.push(createBrandPalette(primary, complement, accent));
  variations[1].name = "Brand Complement";
  variations[1].id = "brand-complement";

  // 3. Analogous warm: secondary shifted +30° from primary
  const analogousWarm = rotateHue(primary, 30);
  variations.push(createBrandPalette(primary, analogousWarm, accent));
  variations[2].name = "Brand Analogous Warm";
  variations[2].id = "brand-analogous-warm";

  // 4. Analogous cool: secondary shifted -30° from primary
  const analogousCool = rotateHue(primary, -30);
  variations.push(createBrandPalette(primary, analogousCool, accent));
  variations[3].name = "Brand Analogous Cool";
  variations[3].id = "brand-analogous-cool";

  // 5. Triadic: secondary and accent from triadic positions
  const tri1 = rotateHue(primary, 120);
  const tri2 = rotateHue(primary, 240);
  variations.push(createBrandPalette(primary, tri1, tri2));
  variations[4].name = "Brand Triadic";
  variations[4].id = "brand-triadic";

  // 6. Role swap: accent becomes primary, primary becomes accent
  variations.push(createBrandPalette(accent, secondary, primary));
  variations[5].name = "Brand Swap";
  variations[5].id = "brand-swap";

  // 7. Light variant: same hues but forced light surface
  const lightPrimary = setLightness(primary, 0.25);
  variations.push(createBrandPalette(lightPrimary, secondary, accent));
  variations[6].name = "Brand Light";
  variations[6].id = "brand-light";

  // 8. Dark variant: same hues but forced dark surface
  const darkPrimary = setLightness(primary, 0.12);
  variations.push(createBrandPalette(darkPrimary, secondary, accent));
  variations[7].name = "Brand Dark";
  variations[7].id = "brand-dark";

  return variations;
}

/**
 * Generate a full palette from brand colors (primary, secondary, accent).
 *
 * Strategy:
 * - Surface: a very subtle tint of primary (light brands) or darkened primary (dark brands)
 * - Primary stays as the headline color (what the user chose)
 * - Secondary is used for supporting text
 * - Accent becomes the CTA
 * - Offer badge derived from secondary with a shift
 * - onSurface derived from primary's hue (dark/light version), not generic black/white
 */
export function createBrandPalette(primary, secondary = null, accent = null) {
  // Backward compat: old 2-arg signature
  if (accent === null) {
    accent = secondary;
    secondary = primary;
  }

  const pRgb = hexToRgb(primary);
  const sRgb = hexToRgb(secondary);
  const aRgb = hexToRgb(accent);
  const pLum = luminance(pRgb);
  const sLum = luminance(sRgb);

  // --- Surface: subtle tint of primary ---
  let surface, onSurface;
  if (pLum > 0.35) {
    // Light primary → very light tint as surface
    surface = rgbToHex(adjustBrightness(pRgb, 0.88));
    // onSurface: darkened version of primary (keeps hue)
    onSurface = rgbToHex(adjustBrightness(pRgb, -0.7));
  } else {
    // Dark primary → use a slightly lighter dark as surface (not identical to primary)
    surface = rgbToHex(adjustBrightness(pRgb, 0.08));
    // onSurface: lightened version of primary (keeps warm/cool tone)
    onSurface = rgbToHex(adjustBrightness(pRgb, 0.8));
  }

  // Ensure onSurface has enough contrast with surface
  const surfaceRgb = hexToRgb(surface);
  if (contrastRatio(surfaceRgb, hexToRgb(onSurface)) < 4.5) {
    onSurface = rgbToHex(textColorOn(surfaceRgb));
  }

  // --- Headline: always the user's primary ---
  // But ensure it has contrast against the surface
  let headlinePrimary = primary;
  if (contrastRatio(surfaceRgb, pRgb) < 3) {
    headlinePrimary = pLum > 0.35
      ? rgbToHex(adjustBrightness(pRgb, -0.5))
      : rgbToHex(adjustBrightness(pRgb, 0.5));
  }

  // --- Secondary: ensure readable on surface ---
  let usableSecondary = secondary;
  if (contrastRatio(surfaceRgb, sRgb) < 3) {
    usableSecondary = sLum > 0.5
      ? rgbToHex(adjustBrightness(sRgb, -0.4))
      : rgbToHex(adjustBrightness(sRgb, 0.4));
  }

  // --- Offer: tinted version of secondary (shifted lighter or darker) ---
  const offerRgb = adjustBrightness(sRgb, sLum > 0.5 ? -0.15 : 0.2);
  const offer = rgbToHex(offerRgb);
  const onOfferRgb = textColorOn(offerRgb);

  // --- CTA ---
  const onCtaRgb = textColorOn(aRgb);

  return {
    id: "brand-custom",
    name: "Brand Custom",
    primary: headlinePrimary,
    secondary: usableSecondary,
    surface,
    onSurface,
    cta: accent,
    onCta: rgbToHex(onCtaRgb),
    offer,
    onOffer: rgbToHex(onOfferRgb),
  };
}

/**
 * Apply palette as CSS custom properties on a DOM element.
 */
export function applyPalette(canvasElement, palette) {
  const s = canvasElement.style;
  s.setProperty("--ad-bg", palette.surface);
  s.setProperty("--ad-primary", palette.primary);
  s.setProperty("--ad-secondary", palette.secondary);
  s.setProperty("--ad-text", palette.onSurface);
  s.setProperty("--ad-text-secondary", palette.secondary);
  s.setProperty("--ad-cta-bg", palette.cta);
  s.setProperty("--ad-cta-text", palette.onCta);
  s.setProperty("--ad-offer-bg", palette.offer);
  s.setProperty("--ad-offer-text", palette.onOffer);

  // Explicit text color overrides from validateDesign()
  if (palette.headlineColor) {
    s.setProperty("--ad-headline-color", palette.headlineColor);
  }
  if (palette.subheadlineColor) {
    s.setProperty("--ad-subheadline-color", palette.subheadlineColor);
  }
}

/**
 * Return a random palette from the built-in set.
 */
export function getRandomPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)];
}
