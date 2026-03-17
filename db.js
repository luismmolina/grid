import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db', 'gridads.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS business_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      context_text TEXT DEFAULT '',
      style_summary TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      mime_type TEXT,
      size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspiration_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT DEFAULT '',
      html_css TEXT NOT NULL,
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generated_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      html TEXT NOT NULL,
      css TEXT NOT NULL DEFAULT '',
      format TEXT NOT NULL DEFAULT 'square',
      rating TEXT DEFAULT 'unrated',
      generation_batch TEXT,
      ai_prompt_summary TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate old business_profiles table if it has the old columns
  try {
    const cols = db.pragma('table_info(business_profiles)').map(c => c.name);
    if (!cols.includes('context_text')) {
      db.exec("ALTER TABLE business_profiles ADD COLUMN context_text TEXT DEFAULT ''");
    }
    if (!cols.includes('style_summary')) {
      db.exec("ALTER TABLE business_profiles ADD COLUMN style_summary TEXT DEFAULT ''");
    }
  } catch { /* table doesn't exist yet, will be created above */ }
}

// --- Business Profiles ---

export function getBusinessProfile() {
  const db = getDb();
  return db.prepare('SELECT * FROM business_profiles ORDER BY id DESC LIMIT 1').get() || null;
}

export function saveBusinessProfile(data) {
  const db = getDb();
  const existing = getBusinessProfile();
  if (existing) {
    db.prepare(`
      UPDATE business_profiles SET context_text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(data.context_text || '', existing.id);
    return { ...existing, context_text: data.context_text };
  } else {
    const result = db.prepare(
      'INSERT INTO business_profiles (context_text) VALUES (?)'
    ).run(data.context_text || '');
    return { id: result.lastInsertRowid, context_text: data.context_text };
  }
}

export function getStyleSummary() {
  const profile = getBusinessProfile();
  return profile?.style_summary || '';
}

export function updateStyleSummary(summary) {
  const db = getDb();
  const existing = getBusinessProfile();
  if (existing) {
    db.prepare('UPDATE business_profiles SET style_summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(summary, existing.id);
  } else {
    db.prepare('INSERT INTO business_profiles (style_summary) VALUES (?)').run(summary);
  }
}

// --- Images ---

export function listImages() {
  return getDb().prepare('SELECT * FROM images ORDER BY created_at DESC').all();
}

export function addImage({ filename, path: filePath, mime_type, size }) {
  const result = getDb().prepare(
    'INSERT INTO images (filename, path, mime_type, size) VALUES (?, ?, ?, ?)'
  ).run(filename, filePath, mime_type, size);
  return { id: result.lastInsertRowid, filename, path: filePath, mime_type, size };
}

export function deleteImage(id) {
  return getDb().prepare('DELETE FROM images WHERE id = ?').run(id);
}

export function getImage(id) {
  return getDb().prepare('SELECT * FROM images WHERE id = ?').get(id) || null;
}

// --- Inspiration Templates ---

export function listTemplates() {
  return getDb().prepare('SELECT * FROM inspiration_templates ORDER BY created_at DESC').all();
}

export function addTemplate({ name, html_css, notes }) {
  const result = getDb().prepare(
    'INSERT INTO inspiration_templates (name, html_css, notes) VALUES (?, ?, ?)'
  ).run(name || '', html_css, notes || '');
  return { id: result.lastInsertRowid, name, html_css, notes };
}

export function updateTemplate(id, { name, html_css, notes }) {
  return getDb().prepare(`
    UPDATE inspiration_templates SET name = ?, html_css = ?, notes = ? WHERE id = ?
  `).run(name || '', html_css, notes || '', id);
}

export function deleteTemplate(id) {
  return getDb().prepare('DELETE FROM inspiration_templates WHERE id = ?').run(id);
}

export function getTemplate(id) {
  return getDb().prepare('SELECT * FROM inspiration_templates WHERE id = ?').get(id) || null;
}

// --- Generated Variants ---

export function listVariants({ rating, format } = {}) {
  let sql = 'SELECT * FROM generated_variants WHERE 1=1';
  const params = [];
  if (rating) { sql += ' AND rating = ?'; params.push(rating); }
  if (format) { sql += ' AND format = ?'; params.push(format); }
  sql += ' ORDER BY created_at DESC';
  return getDb().prepare(sql).all(...params);
}

export function addVariant({ html, css, format, generation_batch, ai_prompt_summary }) {
  const result = getDb().prepare(
    'INSERT INTO generated_variants (html, css, format, generation_batch, ai_prompt_summary) VALUES (?, ?, ?, ?, ?)'
  ).run(html, css || '', format, generation_batch || null, ai_prompt_summary || '');
  return { id: result.lastInsertRowid, html, css, format, rating: 'unrated', generation_batch };
}

export function rateVariant(id, rating) {
  if (!['liked', 'disliked', 'unrated'].includes(rating)) {
    throw new Error('Invalid rating. Must be liked, disliked, or unrated.');
  }
  return getDb().prepare('UPDATE generated_variants SET rating = ? WHERE id = ?').run(rating, id);
}

export function deleteVariant(id) {
  return getDb().prepare('DELETE FROM generated_variants WHERE id = ?').run(id);
}

export function getVariant(id) {
  return getDb().prepare('SELECT * FROM generated_variants WHERE id = ?').get(id) || null;
}

export function getLikedVariants() {
  return getDb().prepare("SELECT * FROM generated_variants WHERE rating = 'liked' ORDER BY created_at DESC").all();
}

export function getDislikedVariants() {
  return getDb().prepare("SELECT * FROM generated_variants WHERE rating = 'disliked' ORDER BY created_at DESC LIMIT 20").all();
}
