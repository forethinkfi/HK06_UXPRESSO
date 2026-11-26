// Menu catalogs the voice server validates against. The AI must only know what the kiosk screen can show, so the default
// catalog ("v6") is built from the SAME file the v6 kiosk loads (public/v6/menu-data.json) — no second copy, no invented values.
//   v6     public/v6/menu-data.json  (what the current prototype shows; default)
//   ai128  data/ai/menus-128.json    (the AI Studio list of 128 menus; kept for the server tests and price comparison)
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const caffeine = (p) => {
  const info = p.info && (p.info.ICE || p.info.HOT || p.info.one || Object.values(p.info)[0]);
  const m = info && (info.nutrition || []).map((s) => String(s).match(/카페인\s*([\d.]+)\s*mg/)).find(Boolean);
  return m ? Number(m[1]) : null;
};

// v6 product -> the schema runKioskTool() works with. Nothing is made up: prices are v6's sample_price, options its own groups.
export function normalizeV6(data) {
  const cats = data.categories || [];
  const menus = data.products.map((p) => {
    const temps = Array.isArray(p.temps) ? p.temps : [];
    const sp = p.sample_price || {};
    return {
      id: p.id,
      name: p.name,
      category: cats[(p.categories || [])[0]] || '기타',
      price: temps.length ? null : (sp.one ?? null),
      tempPrices: temps.length ? Object.fromEntries(temps.map((t) => [t, sp[t] ?? null])) : null,
      temperature: temps.length ? temps : null,
      options: (p.options || []).map((g) => ({ id: g.id, term: g.label, onlyTemp: g.onlyTemp || null, choices: g.choices.map((c) => ({ id: String(c.id), label: c.label, price: c.price })) })),
      optionsConfirmed: true,
      aliases: [p.english_name].filter(Boolean),
      description: p.description ? String(p.description).replace(/\s+/g, ' ').slice(0, 40) : null,
      caffeine_mg: caffeine(p),
      kind: p.kind,
      badge: p.badge || null,
      tags: p.tags || [],
      recommended: (data.recommended || []).includes(p.name),
      available: true,
    };
  });
  return { menus, maxQty: 9, source: 'v6' };
}

export async function loadCatalog(name = 'v6') {
  if (name === 'ai128') return { ...JSON.parse(await readFile(join(ROOT, 'data', 'ai', 'menus-128.json'), 'utf8')), maxQty: 20, source: 'ai128' };
  return normalizeV6(JSON.parse(await readFile(join(ROOT, 'public', 'v6', 'menu-data.json'), 'utf8')));
}
