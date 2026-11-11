// Assemble les pages statiques de Maison Créange.
// Usage : node build.mjs  →  écrit dans ./site
// - {{> partial}}               insère src/partials/partial.html
// - {{var}}                     variable déclarée dans l'en-tête <!--meta {...} --> de la page
// - {{img name="x" alt="…" sizes="…" class="…" eager}}   génère un <picture> WebP + JPEG responsive
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const OUT = join(ROOT, 'site');
const IMG = join(OUT, 'assets/img');
const SITE_URL = 'https://www.creangeboutique.com';

const pages = {
  'index.html': 'index.html',
  'a-propos.html': 'a-propos-de-nous/index.html',
  'contact.html': 'contactez-nous/index.html',
  'avis-juridique.html': 'avis-juridique/index.html',
  '404.html': '404.html',
};

const partial = (name) => readFileSync(join(SRC, 'partials', `${name}.html`), 'utf8');

function attrs(str) {
  const out = {};
  for (const m of str.matchAll(/(\w[\w-]*)(?:="([^"]*)")?/g)) out[m[1]] = m[2] ?? true;
  return out;
}

const imgFiles = readdirSync(IMG);
function picture(a) {
  const widths = [640, 1100, 1600].filter((w) => imgFiles.includes(`${a.name}-${w}.jpg`));
  if (!widths.length) throw new Error(`Image introuvable : ${a.name}`);
  const set = (ext) => widths.map((w) => `/assets/img/${a.name}-${w}.${ext} ${w}w`).join(', ');
  const mid = widths[Math.min(1, widths.length - 1)];
  const sizes = a.sizes || '100vw';
  const loading = a.eager ? 'eager" fetchpriority="high' : 'lazy';
  return `<picture${a.class ? ` class="${a.class}"` : ''}>` +
    `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
    `<img src="/assets/img/${a.name}-${mid}.jpg" srcset="${set('jpg')}" sizes="${sizes}" alt="${a.alt || ''}" loading="${loading}" decoding="async"${a.pos ? ` style="object-position:${a.pos}"` : ''}>` +
    `</picture>`;
}

// Photo détourée (WebP avec transparence) : {{cut name="cut-veste-croisee" alt="…" sizes="…" class="…"}}
function cutout(a) {
  const files = imgFiles.filter((f) => f.startsWith(a.name + '-') && f.endsWith('.webp'))
    .map((f) => [f, parseInt(f.slice(a.name.length + 1), 10)]).filter(([, w]) => w > 0).sort((x, y) => x[1] - y[1]);
  if (!files.length) throw new Error(`Détourage introuvable : ${a.name}`);
  const set = files.map(([f, w]) => `/assets/img/${f} ${w}w`).join(', ');
  return `<img${a.class ? ` class="${a.class}"` : ''} src="/assets/img/${files[files.length - 1][0]}" srcset="${set}" sizes="${a.sizes || '50vw'}" alt="${a.alt || ''}" loading="${a.eager ? 'eager' : 'lazy'}" decoding="async"${a.attrs ? ' ' + a.attrs.replace(/'/g, '"') : ''}>`;
}

function render(tpl, vars, depth = 0) {
  if (depth > 5) throw new Error('Inclusions trop profondes');
  let html = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, n) => render(partial(n), vars, depth + 1));
  html = html.replace(/\{\{img\s+([^}]*)\}\}/g, (_, a) => picture(attrs(a)));
  html = html.replace(/\{\{cut\s+([^}]*)\}\}/g, (_, a) => cutout(attrs(a)));
  html = html.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    if (!(k in vars)) throw new Error(`Variable manquante : ${k}`);
    return vars[k];
  });
  return html;
}

// Chemins relatifs : le site fonctionne à la racine d'un domaine, dans un sous-dossier
// ou en ouvrant directement index.html depuis l'ordinateur.
function relativize(html, prefix) {
  const fix = (url) => {
    if (!url.startsWith('/') || url.startsWith('//')) return url;
    const [path, hash] = url.split('#');
    let rel = path.slice(1);
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';
    return prefix + rel + (hash !== undefined ? '#' + hash : '');
  };
  return html
    .replace(/\b(href|src)="([^"]*)"/g, (m, a, u) => `${a}="${fix(u)}"`)
    .replace(/\bsrcset="([^"]*)"/g, (m, set) => `srcset="${set.split(', ').map((p) => { const [u, w] = p.split(' '); return fix(u) + (w ? ' ' + w : ''); }).join(', ')}"`);
}

for (const [src, out] of Object.entries(pages)) {
  let tpl = readFileSync(join(SRC, 'pages', src), 'utf8');
  const metaMatch = tpl.match(/^<!--meta\s*([\s\S]*?)-->\s*/);
  const meta = metaMatch ? JSON.parse(metaMatch[1]) : {};
  tpl = tpl.slice(metaMatch ? metaMatch[0].length : 0);
  const path = '/' + out.replace(/index\.html$/, '');
  const vars = {
    canonical: SITE_URL + path,
    year: String(new Date().getFullYear()),
    ...meta,
    navHome: path === '/' ? ' aria-current="page"' : '',
    navAbout: path === '/a-propos-de-nous/' ? ' aria-current="page"' : '',
    navContact: path === '/contactez-nous/' ? ' aria-current="page"' : '',
    navLegal: path === '/avis-juridique/' ? ' aria-current="page"' : '',
  };
  const depth = out.split('/').length - 1;
  const html = relativize(render(tpl, vars), out === '404.html' ? '/' : '../'.repeat(depth));
  const dest = join(OUT, out);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html);
  console.log('✓', out);
}

if (!existsSync(join(OUT, 'assets/css/main.css'))) console.warn('⚠ main.css absent');
