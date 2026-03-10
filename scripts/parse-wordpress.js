import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const xml = readFileSync(join(__dirname, '..', 'wordpress-export.xml'), 'utf-8');

// Build author map from <wp:author> blocks
const authorMap = {};
const authorBlocks = xml.match(/<wp:author>[\s\S]*?<\/wp:author>/g) || [];
for (const block of authorBlocks) {
  const login = extractCDATA(block, 'wp:author_login');
  const displayName = extractCDATA(block, 'wp:author_display_name');
  if (login && displayName) authorMap[login] = displayName;
}

// Split into <item> blocks
const items = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

const posts = [];

for (const item of items) {
  const postType = extractCDATA(item, 'wp:post_type');
  const status = extractCDATA(item, 'wp:status');

  if (postType !== 'post' || status !== 'publish') continue;

  const title = extractCDATA(item, 'title');
  const slug = extractCDATA(item, 'wp:post_name');
  const dateRaw = extractCDATA(item, 'wp:post_date_gmt');
  const creatorLogin = extractCDATA(item, 'dc:creator');
  const contentRaw = extractCDATA(item, 'content:encoded');

  // Parse date to ISO
  const date = dateRaw ? new Date(dateRaw.replace(' ', 'T') + 'Z').toISOString() : null;

  // Author display name from map
  const author = authorMap[creatorLogin] || creatorLogin || 'Hometown Insurance';

  // Categories
  const categories = [];
  const catMatches = item.matchAll(/<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]><\/category>/g);
  for (const m of catMatches) {
    if (!categories.includes(m[1])) categories.push(m[1]);
  }

  // Content HTML
  const content = contentRaw || '';

  // Extract card thumbnail: first image, YouTube thumbnail, or default
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  const youtubeMatch = content.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  let image = null;
  if (imgMatch) {
    image = imgMatch[1];
  } else if (youtubeMatch) {
    image = 'https://img.youtube.com/vi/' + youtubeMatch[1] + '/hqdefault.jpg';
  } else {
    image = '/images/insights-default.jpg';
  }

  // Excerpt: strip HTML, take first 200 chars
  const textOnly = content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const excerpt = textOnly.length > 200 ? textOnly.substring(0, 200).trim() + '...' : textOnly;

  if (!slug) continue;

  posts.push({ title, slug, date, author, categories, content, excerpt, image });
}

// Sort by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

const outDir = join(__dirname, '..', 'src', 'data');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'posts.json'), JSON.stringify(posts, null, 2), 'utf-8');

console.log(`Parsed ${posts.length} published posts → src/data/posts.json`);

function extractCDATA(xml, tag) {
  // Match both CDATA-wrapped and plain content
  const cdataRe = new RegExp(`<${escapeRegex(tag)}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapeRegex(tag)}>`);
  const plainRe = new RegExp(`<${escapeRegex(tag)}>([^<]*)<\\/${escapeRegex(tag)}>`);
  const m = xml.match(cdataRe) || xml.match(plainRe);
  return m ? m[1] : '';
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
