/**
 * Deterministic SVG artwork for seed data (logos, covers, gallery scenes, article and ad banners).
 * The seed uses generated illustrations so the project works offline; admins replace them with real photos.
 */

function rng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export type Palette = { sky1: string; sky2: string; accent: string; wall: string; roof: string; ground: string };

export function paletteFor(seed: string): Palette {
  const r = rng(seed);
  const hue = Math.floor(r() * 360);
  const hsl = (h: number, s: number, l: number) => `hsl(${h % 360} ${s}% ${l}%)`;
  return {
    sky1: hsl(hue, 55, 88),
    sky2: hsl(hue + 30, 60, 96),
    accent: hsl(hue + 160, 45, 40),
    wall: hsl(hue + 20, 35, 94),
    roof: hsl(hue, 45, 32),
    ground: hsl(hue + 100, 35, 55),
  };
}

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;

function mountains(p: Palette, r: () => number, y: number) {
  let d = `M0 ${y}`;
  for (let x = 0; x <= 1200; x += 100) d += ` L${x} ${y - 60 - Math.floor(r() * 120)}`;
  return `<path d="${d} L1200 ${y} Z" fill="${p.sky1}" opacity=".9"/><path d="M0 ${y} L240 ${y - 140} L420 ${y - 40} L640 ${y - 190} L900 ${y - 60} L1200 ${y - 150} L1200 ${y} Z" fill="#fff" opacity=".55"/>`;
}

function building(p: Palette, r: () => number) {
  const w = 520 + Math.floor(r() * 120);
  const x = (1200 - w) / 2;
  const windows = Array.from({ length: 6 }, (_, i) => {
    const wx = x + 40 + i * ((w - 80) / 6);
    return `<rect x="${wx}" y="330" width="${(w - 80) / 6 - 18}" height="62" rx="6" fill="${p.sky2}"/><rect x="${wx}" y="420" width="${(w - 80) / 6 - 18}" height="62" rx="6" fill="${p.sky2}"/>`;
  }).join("");
  return `
    <rect x="${x}" y="300" width="${w}" height="260" rx="10" fill="${p.wall}"/>
    <path d="M${x - 20} 300 L600 190 L${x + w + 20} 300 Z" fill="${p.roof}"/>
    <rect x="${600 - 46}" y="450" width="92" height="110" rx="8" fill="${p.accent}"/>
    <circle cx="600" cy="268" r="26" fill="${p.sky2}"/>
    ${windows}
    <rect x="${x - 60}" y="500" width="70" height="60" rx="6" fill="${p.wall}" opacity=".9"/>
    <rect x="${x + w - 10}" y="500" width="70" height="60" rx="6" fill="${p.wall}" opacity=".9"/>`;
}

export function cover(seed: string): string {
  const r = rng(seed);
  const p = paletteFor(seed);
  const trees = Array.from({ length: 7 }, () => {
    const tx = Math.floor(r() * 1100) + 50;
    return `<rect x="${tx}" y="520" width="10" height="46" fill="#6b4f36"/><circle cx="${tx + 5}" cy="505" r="${22 + Math.floor(r() * 12)}" fill="${p.ground}"/>`;
  }).join("");
  return svg(1200, 675, `
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky1}"/><stop offset="1" stop-color="${p.sky2}"/></linearGradient></defs>
    <rect width="1200" height="675" fill="url(#g)"/>
    <circle cx="${180 + Math.floor(r() * 800)}" cy="110" r="46" fill="#fff" opacity=".8"/>
    ${mountains(p, r, 420)}
    <rect y="540" width="1200" height="135" fill="${p.ground}"/>
    ${building(p, r)}${trees}`);
}

export function gallery(seed: string, kind: "classroom" | "sports" | "library" | "lab"): string {
  const r = rng(`${seed}:${kind}`);
  const p = paletteFor(seed);
  let scene = "";
  if (kind === "classroom") {
    scene = `<rect y="0" width="1200" height="675" fill="${p.wall}"/><rect x="120" y="80" width="560" height="260" rx="10" fill="${p.roof}" opacity=".9"/><rect x="140" y="100" width="520" height="220" rx="6" fill="#f4f7f4"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${120 + (i % 4) * 280}" y="${420 + Math.floor(i / 4) * 80}" width="190" height="14" rx="4" fill="${p.accent}"/><rect x="${150 + (i % 4) * 280}" y="${434 + Math.floor(i / 4) * 80}" width="10" height="46" fill="${p.roof}"/>`).join("")}`;
  } else if (kind === "sports") {
    scene = `<rect width="1200" height="675" fill="${p.sky1}"/><rect y="300" width="1200" height="375" fill="${p.ground}"/><rect x="150" y="360" width="900" height="260" rx="14" fill="none" stroke="#fff" stroke-width="6"/><line x1="600" y1="360" x2="600" y2="620" stroke="#fff" stroke-width="6"/><circle cx="600" cy="490" r="64" fill="none" stroke="#fff" stroke-width="6"/>
      <circle cx="${300 + Math.floor(r() * 600)}" cy="470" r="14" fill="#fff"/>${mountains(p, r, 300)}`;
  } else if (kind === "library") {
    scene = `<rect width="1200" height="675" fill="${p.wall}"/>${Array.from({ length: 4 }, (_, row) => `<rect x="80" y="${70 + row * 140}" width="1040" height="10" fill="${p.roof}"/>${Array.from({ length: 22 }, (_, i) => `<rect x="${96 + i * 46}" y="${14 + row * 140 + 20 + Math.floor(r() * 16)}" width="34" height="${100 - Math.floor(r() * 24) - 20}" rx="3" fill="hsl(${Math.floor(r() * 360)} 40% ${40 + Math.floor(r() * 20)}%)"/>`).join("")}`).join("")}`;
  } else {
    scene = `<rect width="1200" height="675" fill="${p.sky2}"/><rect y="440" width="1200" height="235" fill="${p.roof}" opacity=".85"/>
      ${Array.from({ length: 5 }, (_, i) => `<path d="M${180 + i * 210} 440 l30 -120 h50 l30 120 z" fill="#fff" opacity=".9"/><rect x="${200 + i * 210}" y="300" width="70" height="26" rx="6" fill="${p.accent}"/><circle cx="${235 + i * 210}" cy="${380 + (i % 2) * 20}" r="${18 + (i % 3) * 4}" fill="${p.accent}" opacity=".7"/>`).join("")}`;
  }
  return svg(1200, 675, scene);
}

export function logo(seed: string, initial: string): string {
  const p = paletteFor(seed);
  const r = rng(`${seed}:logo`);
  const shape = Math.floor(r() * 3);
  const mark =
    shape === 0
      ? `<circle cx="256" cy="256" r="190" fill="${p.roof}"/>`
      : shape === 1
        ? `<rect x="66" y="66" width="380" height="380" rx="80" fill="${p.roof}"/>`
        : `<path d="M256 56 L450 180 V332 L256 456 L62 332 V180 Z" fill="${p.roof}"/>`;
  return svg(512, 512, `<rect width="512" height="512" fill="#fff"/>${mark}<circle cx="256" cy="256" r="118" fill="${p.accent}" opacity=".35"/>
    <text x="256" y="312" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="190" text-anchor="middle" fill="#fff">${initial.replace(/[<>&]/g, "")}</text>`);
}

export function banner(seed: string, label: string): string {
  const p = paletteFor(seed);
  const r = rng(seed);
  const dots = Array.from({ length: 18 }, () => `<circle cx="${Math.floor(r() * 1200)}" cy="${Math.floor(r() * 675)}" r="${14 + Math.floor(r() * 60)}" fill="#fff" opacity="${(0.08 + r() * 0.16).toFixed(2)}"/>`).join("");
  return svg(1200, 675, `<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.roof}"/><stop offset="1" stop-color="${p.accent}"/></linearGradient></defs>
    <rect width="1200" height="675" fill="url(#b)"/>${dots}
    <text x="600" y="360" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="84" text-anchor="middle" fill="#fff">${label.replace(/[<>&]/g, "")}</text>`);
}
