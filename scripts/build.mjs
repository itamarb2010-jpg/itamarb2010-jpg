// Builds the profile README: project cards, link buttons and tool logos as SVGs
// (a light and a dark version of each), plus README.md itself, all from the data below.
// Run: npm install && npm run build
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import * as icons from 'simple-icons';

// ---------- content ----------

const INTRO = '16-year-old developer, like messing with new things. I build Minecraft plugins & mods, Discord mods and everything else.';

const LINKS = [
  { id: 'website', label: 'Website', icon: 'globe', href: 'https://vaguestan.pages.dev/' },
  { id: 'discord', label: 'Discord', icon: 'discord', href: 'https://discord.com/users/815623037714038865' },
  { id: 'email', label: 'Email', icon: 'mail', href: 'mailto:itamarb2010@gmail.com' },
];

// Cards are laid out two per row, in this order.
const PROJECTS = [
  { id: 'pizzalauncher', name: 'PizzaLauncher', badge: 'Archived', archived: true, lang: 'Electron', href: 'https://pizzalauncher.pages.dev/',
    desc: 'My Minecraft launcher: an Electron app with its own backend and website.' },
  { id: 'clipify', name: 'Clipify', badge: 'Fabric mod', lang: 'Java', href: 'https://github.com/itamarb2010-jpg/Clipify',
    desc: 'Instant replay for Minecraft: save your recent gameplay as an MP4 with one key, then trim and share clips in-game.' },
  { id: 'ven', name: 'Ven', badge: 'Public', lang: 'JavaScript', href: 'https://github.com/itamarb2010-jpg/Ven',
    desc: 'Adds CurseForge to the Modrinth App: browse, install and update CurseForge mods and modpacks inside the launcher.' },
  { id: 'commissions', name: 'Commissioned plugins', badge: 'Client work', lang: 'Java', href: 'https://vaguestan.pages.dev/#projects',
    desc: 'Custom Paper plugins for real servers: summon books, redstone items, SMP mechanics.' },
  { id: 'vencord', name: 'Vencord plugins', badge: 'Personal', lang: 'Vencord',
    desc: 'Discord client mods: AI rewrite, mention inbox, channel digests and a GIF upload bypass.' },
];

const LANG_COLORS = { Java: '#b07219', JavaScript: '#f1e05a', Electron: '#47848f', Vencord: '#e48bd3' };

const TOOLS = ['java', 'siJavascript', 'siDotnet', 'siNodedotjs', 'siElectron', 'siGradle', 'siApachemaven', 'siCloudflare', 'siArduino'];
const TOOLS_ALT = 'Tools: Java, JavaScript, C# and .NET, Node.js, Electron, Gradle, Maven, Cloudflare, Arduino';

// GitHub's own light and dark colours. Backgrounds stay transparent so the page shows through.
const THEMES = {
  light: { link: '#0969da', fg: '#1f2328', muted: '#59636e', border: '#d1d9e0', attention: '#9a6700' },
  dark: { link: '#4493f8', fg: '#f0f6fc', muted: '#9198a1', border: '#3d444d', attention: '#d29922' },
};

// Images load from the repo's raw files: GitHub doesn't rewrite relative paths inside <picture>.
const RAW = 'https://raw.githubusercontent.com/itamarb2010-jpg/itamarb2010-jpg/main/assets';

// ---------- drawing ----------

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(here, '..');
const OUT = path.join(ROOT, 'assets');

const load = (file) => opentype.parse(fs.readFileSync(path.join(here, 'fonts', file)).buffer);
const FONT = { regular: load('MonaSans-Regular.ttf'), medium: load('MonaSans-Medium.ttf'), semibold: load('MonaSans-SemiBold.ttf') };

const width = (font, str, size) => font.getAdvanceWidth(str, size);

// Baseline of a line of text centred in a CSS-style line box, so spacing matches GitHub's own UI.
function baseline(font, top, lineHeight, size) {
  const asc = font.ascender / font.unitsPerEm, desc = -font.descender / font.unitsPerEm;
  return top + (lineHeight - (asc + desc) * size) / 2 + asc * size;
}

// Serialised by hand: opentype.js's toPathData(2) sometimes prints NaN for valid coordinates.
function pathData(p) {
  const n = (v) => +v.toFixed(2);
  return p.commands.map((c) => {
    if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
    if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    return 'Z';
  }).join('');
}

function text(font, str, x, y, size, color) {
  return `<path fill="${color}" d="${pathData(font.getPath(str, x, y, size))}"/>`;
}

function wrap(font, str, size, max) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (width(font, next, size) > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>\n`;

// Small line icons on a 16px grid, drawn with the given colour.
const LINE_ICONS = {
  globe: (c) => `<circle cx="8" cy="8" r="6.2" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M1.8 8h12.4M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4" fill="none" stroke="${c}" stroke-width="1.3"/>`,
  mail: (c) => `<rect x="1.8" y="3.4" width="12.4" height="9.2" rx="1.4" fill="none" stroke="${c}" stroke-width="1.3"/><path d="M2.4 4.4L8 8.8l5.6-4.4" fill="none" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>`,
  discord: (c) => `<g transform="scale(${16 / 24})"><path fill="${c}" d="${icons.siDiscord.path}"/></g>`,
};

// Logos on a 24px grid. simple-icons only has the Duke mascot for Java, so the cup is drawn here.
function logo(id, c) {
  if (id === 'java') {
    return `<path d="M9.6 2.8c-1.3 1.2 1.3 2.4 0 3.6s1.3 2.4 0 3.6M13.2 2.8c-1.3 1.2 1.3 2.4 0 3.6s1.3 2.4 0 3.6" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`
      + `<path d="M5 12.5h11.5v3.8a4.2 4.2 0 0 1-4.2 4.2H9.2A4.2 4.2 0 0 1 5 16.3z" fill="${c}"/>`
      + `<path d="M16.5 13.6h1.4a2.1 2.1 0 0 1 0 4.2h-1.6" fill="none" stroke="${c}" stroke-width="1.6"/>`
      + `<path d="M3.2 22h15.4" stroke="${c}" stroke-width="1.6" stroke-linecap="round"/>`;
  }
  return `<path fill="${c}" d="${icons[id].path}"/>`;
}

// Project card in the style of a pinned repository.
const CARD_W = 404, CARD_H = 123;
function card(p, t) {
  const pad = 16;
  const nameColor = p.href ? t.link : t.fg;
  let body = `<rect x="0.5" y="0.5" width="${CARD_W - 1}" height="${CARD_H - 1}" rx="6" fill="none" stroke="${t.border}"/>`;

  // Name and badge share a 21px row.
  const nameW = width(FONT.semibold, p.name, 14);
  body += text(FONT.semibold, p.name, pad, baseline(FONT.semibold, 16, 21, 14), 14, nameColor);
  // Archived projects get GitHub's amber archive label.
  const badgeLine = p.archived ? t.attention : t.border, badgeText = p.archived ? t.attention : t.muted;
  const bx = pad + nameW + 8, bw = width(FONT.medium, p.badge, 12) + 16;
  body += `<rect x="${(bx + 0.5).toFixed(2)}" y="17" width="${(bw - 1).toFixed(2)}" height="19" rx="9.5" fill="none" stroke="${badgeLine}"/>`;
  body += text(FONT.medium, p.badge, bx + 8, baseline(FONT.medium, 17.5, 18, 12), 12, badgeText);

  // Description: up to two 18px lines.
  const lines = wrap(FONT.regular, p.desc, 12, CARD_W - pad * 2);
  if (lines.length > 2) throw new Error(`${p.name}: description needs ${lines.length} lines, cards fit 2. Shorten it.`);
  lines.forEach((l, i) => { body += text(FONT.regular, l, pad, baseline(FONT.regular, 45 + i * 18, 18, 12), 12, t.muted); });

  // Footer: language dot and label.
  body += `<circle cx="${pad + 6}" cy="98" r="6" fill="${LANG_COLORS[p.lang]}"/>`;
  body += text(FONT.regular, p.lang, pad + 18, baseline(FONT.regular, 89, 18, 12), 12, t.muted);
  return svg(CARD_W, CARD_H, body);
}

// Rounded link button with an icon.
function pill(l, t) {
  const h = 31, labelW = width(FONT.regular, l.label, 14);
  const w = Math.ceil(1 + 12 + 14 + 6 + labelW + 12 + 1);
  let body = `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="${(h - 1) / 2}" fill="none" stroke="${t.border}"/>`;
  body += `<g transform="translate(13 8.5) scale(${14 / 16})">${LINE_ICONS[l.icon](t.fg)}</g>`;
  body += text(FONT.regular, l.label, 13 + 14 + 6, baseline(FONT.regular, 5, 21, 14), 14, t.fg);
  return svg(w, h, body);
}

function tools(t) {
  const size = 22, gap = 18;
  const body = TOOLS.map((id, i) => `<g transform="translate(${i * (size + gap)} 0) scale(${size / 24})">${logo(id, t.muted)}</g>`).join('');
  return svg(TOOLS.length * (size + gap) - gap, size, body);
}

// ---------- README ----------

const themed = (name, alt) =>
  `<picture><source media="(prefers-color-scheme: dark)" srcset="${RAW}/${name}-dark.svg"><img src="${RAW}/${name}-light.svg" alt="${alt}"></picture>`;
const linkTo = (href, inner) => (href ? `<a href="${href}">${inner}</a>` : inner);

function readme() {
  const pills = LINKS.map((l) => linkTo(l.href, themed(`pill-${l.id}`, l.label))).join('&nbsp; ');
  const rows = [];
  for (let i = 0; i < PROJECTS.length; i += 2) {
    rows.push(PROJECTS.slice(i, i + 2).map((p) => linkTo(p.href, themed(`card-${p.id}`, `${p.name}. ${p.desc}`))).join('&emsp;'));
  }
  return [
    '<!-- Generated by scripts/build.mjs. Edit the text there, then run `npm run build` in scripts/. -->',
    "## Hey, I'm Itamar",
    INTRO,
    pills,
    themed('tools', TOOLS_ALT),
    ...rows,
  ].join('\n\n') + '\n';
}

// ---------- write ----------

const files = {};
for (const [mode, t] of Object.entries(THEMES)) {
  for (const p of PROJECTS) files[`card-${p.id}-${mode}.svg`] = card(p, t);
  for (const l of LINKS) files[`pill-${l.id}-${mode}.svg`] = pill(l, t);
  files[`tools-${mode}.svg`] = tools(t);
}
fs.mkdirSync(OUT, { recursive: true });
// assets/ only holds generated images, so drop any left over from removed cards or links.
for (const name of fs.readdirSync(OUT)) if (name.endsWith('.svg') && !(name in files)) fs.rmSync(path.join(OUT, name));
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), content);
fs.writeFileSync(path.join(ROOT, 'README.md'), readme());
const kb = Object.values(files).reduce((n, c) => n + c.length, 0) / 1024;
console.log(`${Object.keys(files).length} images (${kb.toFixed(0)} KB) and README.md written`);
