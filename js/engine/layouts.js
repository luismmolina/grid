// Layout blueprint definitions for the grid-based ad design generator.
// Each layout maps to a pre-defined CSS class and describes grid-area usage.

const BASE_REQUIRED = ['image', 'headline', 'cta'];

function deriveRequired(areas) {
  return BASE_REQUIRED.filter(a => areas.includes(a));
}

function deriveOptional(areas, required) {
  return areas.filter(a => !required.includes(a));
}

function layout(id, name, areas, hasOverlay = false, overlayType = null, imageWeight = 0) {
  const cssClass = `layout-${id}`;
  const requiredAreas = deriveRequired(areas);
  const optionalAreas = deriveOptional(areas, requiredAreas);
  return { id, cssClass, name, areas, requiredAreas, optionalAreas, hasOverlay, overlayType, imageWeight };
}

export const LAYOUTS = {
  square: [
    layout('sq-golden-split', 'Golden Split',    ['image', 'logo', 'headline', 'subheadline', 'cta'],  false, null,              0.62),
    layout('sq-type-hero',    'Type Hero',        ['logo', 'headline', 'subheadline', 'cta', 'image'],  false, null,              0.25),
    layout('sq-modular',      'Modular Grid',     ['image', 'headline', 'subheadline', 'cta'],          false, null,              0.45),
    layout('sq-centered',     'Centered Axis',    ['logo', 'headline', 'image', 'cta'],                 false, null,              0.3),
    layout('sq-full-bleed',   'Full Bleed',       ['image', 'logo', 'offer', 'headline', 'subheadline', 'cta'], true, 'gradient-bottom', 0.65),
    layout('sq-thirds',       'Rule of Thirds',   ['image', 'logo', 'headline', 'subheadline', 'cta'],  false, null,              0.67),
    layout('sq-stacked',      'Bold Stacked',     ['image', 'headline', 'cta'],                         false, null,              0.45),
    layout('sq-editorial',    'Editorial Asymmetric', ['logo', 'image', 'headline', 'subheadline', 'cta'], false, null,             0.5),
    layout('sq-minimal',      'Minimal Breathe',  ['image', 'headline', 'subheadline', 'cta'],          false, null,              0.15),
    layout('sq-billboard',    'Billboard',         ['headline', 'subheadline', 'image', 'cta'],          false, null,              0.35),
  ],

  vertical: [
    layout('vt-story-hero',      'Story Hero',       ['image', 'headline', 'subheadline', 'cta', 'social'],                    false, null,              0.55),
    layout('vt-full-screen',     'Full Screen',      ['image', 'logo', 'offer', 'headline', 'subheadline', 'cta', 'social'],   true,  'gradient-bottom', 0.65),
    layout('vt-type-stack',      'Type Stack',       ['logo', 'headline', 'subheadline', 'image', 'cta'],                      false, null,              0.35),
    layout('vt-three-panel',     'Three Panels',     ['image', 'headline', 'cta'],                                             false, null,              0.33),
    layout('vt-sidebar',         'Accent Sidebar',   ['stripe', 'logo', 'image', 'headline', 'subheadline', 'cta'],            false, null,              0.45),
    layout('vt-centered',        'Centered Minimal', ['logo', 'image', 'headline', 'subheadline', 'cta'],                      false, null,              0.25),
    layout('vt-frame',           'Framed Image',     ['logo', 'image', 'headline', 'subheadline', 'cta'],                      false, null,              0.4),
    layout('vt-split-contrast',  'Split Contrast',   ['logo', 'headline', 'cta', 'image'],                                    false, null,              0.5),
    layout('vt-cascade',         'Cascade',          ['logo', 'image', 'headline', 'subheadline', 'cta'],                      false, null,              0.35),
    layout('vt-magazine',        'Magazine Editorial', ['logo', 'image', 'headline', 'subheadline', 'cta'],                     false, null,              0.5),
  ],

  horizontal: [
    layout('hz-golden-split',   'Golden Split',   ['image', 'logo', 'headline', 'cta'],                        false, null,             0.62),
    layout('hz-full-banner',    'Full Banner',    ['image', 'logo', 'headline', 'cta'],                        true,  'gradient-right', 0.65),
    layout('hz-three-col',      'Three Column',   ['image', 'logo', 'headline', 'subheadline', 'cta'],         false, null,             0.33),
    layout('hz-type-forward',   'Type Forward',   ['logo', 'headline', 'cta', 'image'],                        false, null,             0.35),
    layout('hz-center-stage',   'Center Stage',   ['image', 'logo', 'headline', 'cta'],                        true,  'dark',           0.65),
    layout('hz-bookend',        'Bookend',        ['logo', 'headline', 'subheadline', 'cta'],                  false, null,             0.0),
    layout('hz-offset',         'Offset Grid',    ['image', 'headline', 'subheadline', 'cta'],                 false, null,             0.4),
    layout('hz-minimal-strip',  'Minimal Strip',  ['image', 'headline', 'cta'],                                false, null,             0.25),
    layout('hz-power-right',    'Power Right',    ['image', 'logo', 'headline', 'subheadline', 'cta'],         false, null,             0.6),
    layout('hz-banded',         'Banded',         ['image', 'headline', 'subheadline', 'cta'],                 false, null,             0.4),
  ],
};

export function getLayoutsForFormat(format) {
  return LAYOUTS[format] || [];
}

export function getRandomLayout(format) {
  const layouts = getLayoutsForFormat(format);
  return layouts.length ? layouts[Math.floor(Math.random() * layouts.length)] : null;
}
