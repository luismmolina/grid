# GridAds — Algorithmic Ad Design Generator

GridAds is a browser-based tool that algorithmically generates polished ad creatives from your images, copy, and brand colors. No design skills required.

## Features

- **Drag & drop image uploads** — supports 1–10 images per batch
- **Multiple ad formats** — square, vertical, and horizontal layouts
- **Algorithmic design engine** — auto-picks typography, colors, and layout rules
- **Live preview gallery** — browse generated variants instantly
- **Export** — download your creatives directly from the browser

## Project Structure

```
grid/
├── index.html               # App entry point
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── app.css
│   ├── layouts-square.css
│   ├── layouts-vertical.css
│   └── layouts-horizontal.css
└── js/
    ├── app.js               # App bootstrap
    ├── components/
    │   ├── form.js          # Input panel
    │   ├── gallery.js       # Preview gallery
    │   ├── preview.js       # Single ad preview
    │   └── export.js        # Download logic
    ├── engine/
    │   ├── generator.js     # Core generation logic
    │   ├── layouts.js       # Layout definitions
    │   ├── colors.js        # Color palette engine
    │   ├── typography.js    # Font pairing logic
    │   └── rules.js         # Design rule system
    └── utils/
        ├── contrast.js      # Contrast checking
        └── random.js        # Seeded randomness helpers
```

## Usage

No build step required. Just open `index.html` in a browser:

```bash
open index.html
```

Or serve it locally:

```bash
npx serve .
```

## License

MIT
