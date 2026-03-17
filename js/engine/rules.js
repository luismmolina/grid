/**
 * Design rules engine for grid-based ad generation.
 *
 * Validates and adjusts design parameters so every generated ad
 * follows good design principles (WCAG contrast, safe zones, proportions).
 */

import {
  contrastRatio,
  meetsAA,
  meetsAALarge,
  findReadableColor,
  findReadableColorLarge,
  adjustLightness,
  isLight,
} from "../utils/contrast.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const SAFE_ZONES = {
  square:     { top: 64,  right: 64, bottom: 200, left: 64  },
  vertical:   { top: 200, right: 80, bottom: 300, left: 48  },
  horizontal: { top: 48,  right: 48, bottom: 100, left: 48  },
};

export const PROPORTION_RULES = {
  imageMinWeight: 0.3,
  imageMaxWeight: 0.65,
  ctaMinHeight: 0.08,
  ctaMaxHeight: 0.15,
  logoMaxWidth: 0.12,
  logoMaxHeight: 0.08,
};

// ---------------------------------------------------------------------------
// Overlay helpers
// ---------------------------------------------------------------------------

const DARK_OVERLAYS = new Set([
  "gradient-bottom",
  "gradient-right",
  "gradient-top",
  "dark",
]);

/**
 * Return adjusted text colors that remain readable over the given overlay.
 * Dark and gradient-right overlays use white text with a softer subheadline.
 */
export function adjustForOverlay(palette, overlayType) {
  const dark = DARK_OVERLAYS.has(overlayType);

  let headlineColor, subheadlineColor;
  if (dark) {
    // On dark overlays, use light palette colors (not always pure white)
    headlineColor = "#ffffff";
    subheadlineColor = palette.secondary && isLight(palette.secondary)
      ? palette.secondary : "rgba(255,255,255,0.9)";
  } else {
    // On light/no overlays, use the palette's actual primary and secondary
    headlineColor = palette.primary;
    subheadlineColor = palette.secondary;
  }

  const subheadlineOpacity = dark ? 0.85 : 1;

  return { ...palette, headlineColor, subheadlineColor, subheadlineOpacity };
}

/**
 * Return the CSS class name for the requested overlay type.
 */
export function getOverlayCSS(overlayType) {
  return `ad-overlay--${overlayType}`;
}

// ---------------------------------------------------------------------------
// Contrast enforcement helpers
// ---------------------------------------------------------------------------

function ensureContrast(bgHex, fgHex) {
  if (meetsAA(bgHex, fgHex)) return fgHex;
  return findReadableColor(bgHex, fgHex);
}

function ensureContrastLarge(bgHex, fgHex) {
  if (meetsAALarge(bgHex, fgHex)) return fgHex;
  return findReadableColorLarge(bgHex, fgHex);
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate and adjust a design config so it meets all design rules.
 *
 * Returns a deep-ish copy — the original config is never mutated.
 */
export function validateDesign(config) {
  const palette = { ...config.palette };
  const layout = { ...config.layout, areas: config.layout.areas ? [...config.layout.areas] : [] };
  const format = config.format;

  // -- Overlay text color override ----------------------------------------
  if (layout.hasOverlay) {
    const adjusted = adjustForOverlay(palette, layout.overlayType);
    palette.headlineColor = adjusted.headlineColor;
    palette.subheadlineColor = adjusted.subheadlineColor;
  }

  // -- Non-overlay: headline/subheadline sit directly on surface ----------
  if (!layout.hasOverlay) {
    palette.headlineColor = ensureContrast(palette.surface, palette.primary);
    palette.subheadlineColor = ensureContrastLarge(palette.surface, palette.secondary);
  }

  // Same-color collision: darken/lighten the primary to create contrast while preserving hue
  if (contrastRatio(palette.surface, palette.primary) < 2) {
    const surfaceIsLight = isLight(palette.surface);
    // Try progressive adjustment
    for (let step = 0.2; step <= 0.8; step += 0.1) {
      const adjusted = adjustLightness(palette.primary, surfaceIsLight ? -step : step);
      if (contrastRatio(palette.surface, adjusted) >= 3) {
        palette.primary = adjusted;
        break;
      }
    }
    // If still too low contrast, use a very dark/light version
    if (contrastRatio(palette.surface, palette.primary) < 2) {
      palette.primary = surfaceIsLight
        ? adjustLightness(palette.primary, -0.85)
        : adjustLightness(palette.primary, 0.85);
    }
  }

  // -- Secondary text: ensure AA-Large (3:1) against surface --------------
  if (!meetsAALarge(palette.surface, palette.secondary)) {
    palette.secondary = findReadableColorLarge(palette.surface, palette.secondary);
  }

  // -- Surface / onSurface contrast ---------------------------------------
  palette.onSurface = ensureContrast(palette.surface, palette.onSurface);

  // -- CTA button contrast ------------------------------------------------
  palette.onCta = ensureContrast(palette.cta, palette.onCta);

  // -- Offer badge contrast -----------------------------------------------
  palette.onOffer = ensureContrast(palette.offer, palette.onOffer);

  return { palette, layout, format };
}
