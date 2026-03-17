# GridAds — Copilot Instructions

## Running the App

No build step required. Open `index.html` directly in a browser, or serve locally:

```bash
npx serve .
```

The Puppeteer-based debug script can be run against a local server (requires Chromium):

```bash
node debug-browser.mjs
```

## Architecture

GridAds is a zero-dependency, pure browser app using native ES modules (`<script type="module">`). There is no bundler, transpiler, or framework.

**Data flow:**
1. `InputForm` collects user assets → emits an `assets` object to `App`
2. `App` passes assets to `VariantGenerator.generate()` → returns an array of `DesignVariant` objects
3. `Gallery` renders thumbnails; clicking one opens `Preview`
4. `Preview` renders the variant as a DOM tree (not `<canvas>`); `ExportManager` captures it via `dom-to-image-more` + `JSZip` (both loaded from CDN in `index.html`)

**Three JS layers:**
- `js/components/` — UI layer (form input, gallery, preview modal, export)
- `js/engine/` — design logic (layout definitions, color palettes, typography pairings, WCAG rules)
- `js/utils/` — pure helpers (seeded RNG, WCAG contrast math)

**Two CSS namespaces:**
- `--ui-*` custom properties → app chrome (sidebar, header, buttons)
- `--ad-*` custom properties → ad canvas design tokens (set at runtime by `applyPalette` and `applyTypography`)

Form state is persisted to `localStorage` under the key `gridads-form-state`.

## Key Conventions

### Layout system
Layouts are defined in `js/engine/layouts.js` using a `layout(id, name, areas, ...)` factory. The `id` prefix determines the format: `sq-` (square), `vt-` (vertical), `hz-` (horizontal). The `areas` array is the single source of truth — it controls both CSS `grid-area` placement and which elements `Preview` renders (elements absent from `areas` are skipped entirely).

### Color palettes
Palettes follow the 60-30-10 rule: `surface` (60% dominant bg), `primary` (30% headline color), `cta` (10% accent). Each palette also carries `onSurface`, `onCta`, `offer`, `onOffer` for their respective foreground colors. `createBrandPalette()` derives a full palette from user-supplied hex colors.

### Design validation
**Always call `validateDesign({ palette, layout, format })` before rendering.** It returns a corrected copy of the config with WCAG contrast enforced. Never mutate the original palette object — `validateDesign` clones it. Overlay layouts (e.g., `gradient-bottom`, `dark`) require special text color handling via `adjustForOverlay()`.

### Seeded randomness
All generation uses the `mulberry32` seeded RNG via `createRng(seed)` from `js/utils/random.js`. This ensures reproducible results. The `VariantGenerator` tracks generated combination keys in a `Set` to prevent duplicates and retries up to 50 times per variant.

### Ad canvas dimensions
| Format | Width | Height |
|---|---|---|
| `square` | 1080px | 1080px |
| `vertical` | 1080px | 1920px |
| `horizontal` | 1200px | 628px |

### Platform safe zones
Safe zones are enforced as grid padding via `--ad-safe-*` CSS custom properties (set per format in `css/app.css`) and mirrored in `SAFE_ZONES` in `js/engine/rules.js`. Values follow the "Universal Core" strategy from the research: design for the most restrictive platform (Reels 35% bottom clearance) so ads work everywhere.

| Format | Top | Right | Bottom | Left |
|---|---|---|---|---|
| `square` | 100px | 100px | 100px | 100px |
| `vertical` | 270px (14%) | 65px (6%) | 400px (~21%) | 65px (6%) |
| `horizontal` | 60px | 60px | 100px | 60px |

**Always keep these two sources in sync.** If you change safe zones in CSS, update `rules.js` too.

### Adding a new layout
1. Add an entry to the appropriate format array in `js/engine/layouts.js` using the `layout()` factory
2. Add a matching CSS class `.layout-<id>` in the corresponding `css/layouts-<format>.css` file using CSS Grid named areas that match the `areas` array

### Adding a new palette
Add an entry to the `PALETTES` array in `js/engine/colors.js` following the `surface / primary / secondary / cta / onCta / offer / onOffer` structure. WCAG contrast is enforced at render time by `validateDesign`, but palettes should start with reasonable contrast to avoid excessive correction.

### Typography
Font pairings live in `js/engine/typography.js` as plain objects. Type scales per format are in `TYPE_SCALES`. Applied at render time via `applyTypography(element, pairing, format)`, which sets `--ad-font-*`, `--ad-size-*`, and `--ad-weight-*` CSS custom properties on the canvas element.
