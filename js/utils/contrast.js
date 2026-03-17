/**
 * WCAG 2.0 contrast ratio utilities.
 *
 * All hex values accept "#rrggbb" or "#rgb" shorthand and
 * are returned in "#rrggbb" format.
 */

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const expanded =
    h.length === 3
      ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
      : h;

  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Relative luminance per WCAG 2.0 §1.4.3
// https://www.w3.org/TR/WCAG20/#relativeluminancedef
function linearize(channel) {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function luminance(r, g, b) {
  return (
    0.2126 * linearize(r) +
    0.7152 * linearize(g) +
    0.0722 * linearize(b)
  );
}

export function contrastRatio(hex1, hex2) {
  const { r: r1, g: g1, b: b1 } = hexToRgb(hex1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(hex2);

  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsAA(hex1, hex2) {
  return contrastRatio(hex1, hex2) >= 4.5;
}

export function meetsAALarge(hex1, hex2) {
  return contrastRatio(hex1, hex2) >= 3;
}

export function findReadableColor(bgHex, preferredHex, fallbacks = []) {
  if (meetsAA(bgHex, preferredHex)) return preferredHex;

  for (const fb of fallbacks) {
    if (meetsAA(bgHex, fb)) return fb;
  }

  // Progressively darken or lighten the preferred color to preserve hue
  const bgIsLight = isLight(bgHex);
  for (let step = 0.15; step <= 0.85; step += 0.1) {
    const adjusted = adjustLightness(preferredHex, bgIsLight ? -step : step);
    if (meetsAA(bgHex, adjusted)) return adjusted;
  }

  // Absolute last resort: very dark or very light version of the hue
  const darkVersion = adjustLightness(preferredHex, -0.9);
  if (meetsAA(bgHex, darkVersion)) return darkVersion;
  const lightVersion = adjustLightness(preferredHex, 0.9);
  if (meetsAA(bgHex, lightVersion)) return lightVersion;

  // True last resort
  return bgIsLight ? "#1a1a2e" : "#f0f0f5";
}

export function findReadableColorLarge(bgHex, preferredHex, fallbacks = []) {
  if (meetsAALarge(bgHex, preferredHex)) return preferredHex;

  for (const fb of fallbacks) {
    if (meetsAALarge(bgHex, fb)) return fb;
  }

  const bgIsLight = isLight(bgHex);
  for (let step = 0.1; step <= 0.8; step += 0.1) {
    const adjusted = adjustLightness(preferredHex, bgIsLight ? -step : step);
    if (meetsAALarge(bgHex, adjusted)) return adjusted;
  }

  const darkVersion = adjustLightness(preferredHex, -0.85);
  if (meetsAALarge(bgHex, darkVersion)) return darkVersion;
  const lightVersion = adjustLightness(preferredHex, 0.85);
  if (meetsAALarge(bgHex, lightVersion)) return lightVersion;

  return bgIsLight ? "#1a1a2e" : "#f0f0f5";
}

export function adjustLightness(hex, amount) {
  const { r, g, b } = hexToRgb(hex);

  const adjust = (ch) => {
    if (amount >= 0) {
      return ch + (255 - ch) * amount; // lighten toward white
    }
    return ch + ch * amount; // darken toward black (amount is negative)
  };

  return rgbToHex(adjust(r), adjust(g), adjust(b));
}

export function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return luminance(r, g, b) > 0.5;
}
