import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

import {
  getDb,
  getBusinessProfile, saveBusinessProfile,
  getStyleSummary, updateStyleSummary,
  listImages, addImage, deleteImage, getImage,
  listTemplates, addTemplate, updateTemplate, deleteTemplate,
  listVariants, addVariant, rateVariant, deleteVariant, getVariant,
  getLikedVariants, getDislikedVariants,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Init DB on startup
getDb();

// --- Multer config ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

// ============================================================
// API Routes
// ============================================================

// --- Business Profile ---
app.get('/api/business', (req, res) => {
  const profile = getBusinessProfile();
  res.json(profile || {});
});

app.post('/api/business', (req, res) => {
  const saved = saveBusinessProfile(req.body);
  res.json(saved);
});

// --- Images ---
app.get('/api/images', (req, res) => {
  res.json(listImages());
});

app.post('/api/images', upload.array('images', 10), (req, res) => {
  const results = [];
  for (const file of req.files) {
    const record = addImage({
      filename: file.originalname,
      path: file.filename,
      mime_type: file.mimetype,
      size: file.size,
    });
    results.push(record);
  }
  res.json(results);
});

app.delete('/api/images/:id', (req, res) => {
  const img = getImage(Number(req.params.id));
  if (img) {
    const filePath = path.join(UPLOADS_DIR, img.path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    deleteImage(img.id);
  }
  res.json({ ok: true });
});

// --- Inspiration Templates ---
app.get('/api/templates', (req, res) => {
  res.json(listTemplates());
});

app.post('/api/templates', (req, res) => {
  const tmpl = addTemplate(req.body);
  res.json(tmpl);
});

app.put('/api/templates/:id', (req, res) => {
  updateTemplate(Number(req.params.id), req.body);
  res.json({ ok: true });
});

app.delete('/api/templates/:id', (req, res) => {
  deleteTemplate(Number(req.params.id));
  res.json({ ok: true });
});

// --- AI Generation ---
app.post('/api/generate', async (req, res) => {
  try {
    const { format = 'square' } = req.body;
    const prompt = buildPrompt(format);
    const aiResponse = await callOpenRouter(prompt);
    const variants = parseAiResponse(aiResponse, format);

    const batch = uuidv4();
    const saved = variants.map(v => addVariant({
      html: v.html,
      css: v.css || '',
      format,
      generation_batch: batch,
      ai_prompt_summary: prompt.messages[0].content.substring(0, 200),
    }));

    res.json(saved);
  } catch (err) {
    console.error('Generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Variants ---
app.get('/api/variants', (req, res) => {
  const { rating, format } = req.query;
  res.json(listVariants({ rating, format }));
});

app.put('/api/variants/:id/rate', async (req, res) => {
  const { rating } = req.body;
  const id = Number(req.params.id);
  rateVariant(id, rating);

  // Summarize design patterns in background when liked/disliked
  if (rating === 'liked' || rating === 'disliked') {
    const variant = getVariant(id);
    if (variant) {
      summarizeAndAppend(variant, rating).catch(err =>
        console.error('Summarization failed (non-blocking):', err.message)
      );
    }
  }

  res.json({ ok: true });
});

app.delete('/api/variants/:id', (req, res) => {
  deleteVariant(Number(req.params.id));
  res.json({ ok: true });
});

// --- Export (PNG via Puppeteer) ---
app.post('/api/variants/:id/export', async (req, res) => {
  try {
    const variant = getVariant(Number(req.params.id));
    if (!variant) return res.status(404).json({ error: 'Variant not found' });

    const dims = getDimensions(variant.format);
    const png = await renderToPng(variant, dims);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="variant-${variant.id}.png"`);
    res.send(png);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// Style Summarization (cheap AI call to describe design patterns)
// ============================================================

const SUMMARY_MAX_CHARS = 2000;

async function summarizeAndAppend(variant, rating) {
  const label = rating === 'liked' ? 'LIKED' : 'AVOID';
  const htmlCss = `<style>${variant.css || ''}</style>\n${variant.html || ''}`;

  const response = await callOpenRouter({
    messages: [
      {
        role: 'system',
        content: `You are a design analyst. Given an HTML+CSS ad design, describe its visual characteristics in exactly 1-2 sentences. Focus ONLY on:
- Layout structure (centered, split, asymmetric, full-bleed image, grid)
- Text treatment (big bold headline, minimal text, overlay on image, separate text block)
- Image usage (hero image, background cover, product cutout, text-only, heavy imagery)
- Composition & hierarchy (what dominates visually, CTA placement, visual flow)
- Design density (minimal/airy vs packed/busy)
- Mood (dark/moody, bright/clean, premium, playful, bold)

Reply with ONLY the description. No code, no HTML, no prefixes.`
      },
      {
        role: 'user',
        content: `Describe this ad design:\n${htmlCss.substring(0, 3000)}`
      }
    ],
  }, { maxTokens: 150 });

  const description = response.choices?.[0]?.message?.content?.trim();
  if (!description) return;

  const entry = `${label}: ${description}`;
  let current = getStyleSummary();

  if (current) {
    current += '\n' + entry;
  } else {
    current = entry;
  }

  // Cap at max chars — trim oldest entries if needed
  if (current.length > SUMMARY_MAX_CHARS) {
    const lines = current.split('\n');
    while (current.length > SUMMARY_MAX_CHARS && lines.length > 1) {
      lines.shift();
      current = lines.join('\n');
    }
  }

  updateStyleSummary(current);
  console.log(`📝 Style summary updated (${label}): ${description.substring(0, 80)}...`);
}

// ============================================================
// Prompt Builder
// ============================================================

const FORMAT_DIMENSIONS = {
  square:   { width: 1080, height: 1080, label: '1:1 Square (1080×1080)' },
  vertical: { width: 1080, height: 1920, label: '9:16 Vertical (1080×1920)' },
  portrait: { width: 1080, height: 1350, label: '4:5 Portrait (1080×1350)' },
};

function getDimensions(format) {
  return FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.square;
}

function buildPrompt(format) {
  const business = getBusinessProfile();
  const templates = listTemplates();
  const styleSummary = getStyleSummary();
  const images = listImages();
  const dims = getDimensions(format);

  let systemPrompt = `You are an expert social media ad designer. You generate HTML and CSS code for high-converting ad designs.

OUTPUT FORMAT:
You MUST return ONLY a valid JSON array with exactly 6 objects. No markdown, no explanations, no code fences.
Each object has two fields: "html" (string) and "css" (string).
Example: [{"html":"<div class='ad'>...</div>","css":".ad{...}"},...]

DESIGN RULES:
- Target format: ${dims.label} (${dims.width}×${dims.height} pixels)
- The root element must be exactly ${dims.width}px wide and ${dims.height}px tall
- Use inline styles or a <style> tag within the HTML
- Use modern CSS: Grid, Flexbox, clamp(), modern selectors
- Make designs visually striking, conversion-focused, with clear visual hierarchy
- Each variant must be meaningfully different (different layout structure, not just color swaps)
- Include placeholder references for user images using: <img src="/uploads/FILENAME" />
- Text should be placeholder-ready but realistic (use the business context below)
- Ensure text is readable: proper contrast, sizing, spacing
- DO NOT use external resources or CDN links — only local image paths from the list below`;

  if (business && business.context_text) {
    systemPrompt += `\n\nBUSINESS CONTEXT (provided by user — extract brand info, colors, tone, audience, etc.):\n${business.context_text}`;
  }

  if (images.length > 0) {
    systemPrompt += `\n\nAVAILABLE IMAGES (use these paths in <img> tags):`;
    for (const img of images) {
      systemPrompt += `\n- /uploads/${img.path} (${img.filename})`;
    }
  }

  if (styleSummary) {
    systemPrompt += `\n\nUSER DESIGN PREFERENCES (learned from past ratings — follow these closely):\n${styleSummary}`;
  }

  let userPrompt = `Generate 6 unique, high-quality ad designs for the ${dims.label} format.`;

  // Include up to 2 inspiration templates (minified)
  if (templates.length > 0) {
    userPrompt += `\n\nINSPIRATION TEMPLATES (be inspired by these structures and styles, but create original variations):\n`;
    for (const t of templates.slice(0, 2)) {
      userPrompt += `\n--- Template ---\n${minifyHtml(t.html_css)}\n`;
    }
  }

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
}

// ============================================================
// OpenRouter API
// ============================================================

async function callOpenRouter(prompt, opts = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'z-ai/glm-5-turbo';

  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'GridAds',
    },
    body: JSON.stringify({
      model,
      messages: prompt.messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 16000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${err}`);
  }

  const data = await response.json();

  // Log token usage for cost tracking
  if (data.usage) {
    const { prompt_tokens, completion_tokens, total_tokens } = data.usage;
    console.log(`💰 Tokens — in: ${prompt_tokens}, out: ${completion_tokens}, total: ${total_tokens}`);
  }

  return data;
}

// Strip whitespace, newlines, HTML comments for smaller prompts
function minifyHtml(str) {
  return (str || '')
    .replace(/<!--[\s\S]*?-->/g, '')  // HTML comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // CSS comments
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}

function parseAiResponse(response, format) {
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in AI response');

  // Try to extract JSON from the response (handle code fences)
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Try to find a JSON array
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) jsonStr = arrayMatch[0];

  let variants;
  try {
    variants = JSON.parse(jsonStr);
  } catch (e) {
    // Response was likely truncated — try to salvage complete objects
    variants = salvagePartialJson(jsonStr);
    if (!variants || variants.length === 0) {
      throw new Error(`Failed to parse AI response as JSON: ${e.message}\nRaw: ${content.substring(0, 500)}`);
    }
    console.log(`⚠ AI response was truncated. Salvaged ${variants.length} of 6 variants.`);
  }

  if (!Array.isArray(variants)) {
    throw new Error('AI response is not an array');
  }

  return variants.slice(0, 6).map(v => ({
    html: v.html || '',
    css: v.css || '',
  }));
}

// Extract complete {html, css} objects from truncated JSON
function salvagePartialJson(raw) {
  const results = [];
  // Match each complete {"html": "...", "css": "..."} object
  const objRegex = /\{\s*"html"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"css"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
  let match;
  while ((match = objRegex.exec(raw)) !== null) {
    try {
      // Parse the full matched object to unescape strings properly
      const obj = JSON.parse(match[0]);
      if (obj.html) results.push(obj);
    } catch { /* skip malformed */ }
  }
  return results;
}

// ============================================================
// Puppeteer Export
// ============================================================

let browserInstance = null;

async function getBrowser() {
  if (browserInstance) return browserInstance;
  const puppeteer = await import('puppeteer');
  browserInstance = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  return browserInstance;
}

async function renderToPng(variant, dims) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setViewport({ width: dims.width, height: dims.height });

  // Replace relative /uploads/ paths with absolute localhost URLs so Puppeteer can fetch them
  const port = process.env.PORT || 3000;
  let variantHtml = (variant.html || '').replace(/\/uploads\//g, `http://localhost:${port}/uploads/`);
  let variantCss = (variant.css || '').replace(/\/uploads\//g, `http://localhost:${port}/uploads/`);

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${dims.width}px; height: ${dims.height}px; overflow: hidden; }
  ${variantCss}
</style>
</head>
<body>${variantHtml}</body></html>`;

  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  const png = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: dims.width, height: dims.height },
  });

  await page.close();
  return png;
}

// Cleanup on exit
process.on('SIGINT', async () => {
  if (browserInstance) await browserInstance.close();
  process.exit();
});

// ============================================================
// Start
// ============================================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`GridAds server running at http://localhost:${PORT}`);
});
