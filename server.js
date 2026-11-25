// UXPRESSO kiosk prototype server: zero-dependency static host + self-made test APIs (not official MGC APIs).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { checkGemini } from './lib/gemini.mjs';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const PENDING_MS = 3000; // mock "approval pending" duration
const load = async (f) => JSON.parse(await readFile(join(ROOT, 'data', f), 'utf8'));
const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });
const won = (n) => n.toLocaleString('ko-KR') + '원';

// ---- coupons ----
function applyCoupon(code, items, menus, data) {
  const c = data.coupons.find((x) => x.code === String(code).trim().toUpperCase());
  if (!c) return { status: 'unknown' }; // can't verify -> staff
  const base = { coupon: { code: c.code, name: c.name, type: c.type } };
  const no = (reason, alternative, hint) => ({ status: 'unusable', ...base, reason, alternative, hint });
  if (!c.kioskUsable) return no(c.reason, c.alternative);
  if (c.expires && new Date(c.expires) < new Date()) return no('사용 기간이 지났어요.', '다른 쿠폰을 입력하거나, 쿠폰 없이 결제해 주세요.');
  if (!items) return { status: 'ok', ...base, discount: null }; // pre-check: availability only
  const lines = items.map((it) => { const m = menus.find((x) => x.id === it.menuId); const u = m.price + m.options.reduce((s, g) => s + (g.choices.find((ch) => ch.id === it.opts?.[g.id])?.price || 0), 0); return { m, qty: it.qty, unit: u }; });
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  let discount = 0;
  if (c.type === 'discount') {
    if (subtotal < c.minOrder) return no(`${won(c.minOrder)} 이상 주문할 때 쓸 수 있어요. 지금은 ${won(subtotal)}이에요.`, `${won(c.minOrder - subtotal)} 더 담으면 쓸 수 있어요. 아니면 쿠폰 없이 결제할 수 있어요.`, 'addMore');
    discount = c.kind === 'percent' ? Math.min(Math.floor((subtotal * c.value) / 100), c.maxDiscount ?? Infinity) : Math.min(c.value, subtotal);
  } else if (c.type === 'voucher') {
    const l = lines.find((x) => x.m.id === c.menuId);
    const target = menus.find((x) => x.id === c.menuId);
    if (!l) return no(`장바구니에 ${target.name}가 없어요.`, `${target.name}를 담으면 쓸 수 있어요. 아니면 쿠폰 없이 결제할 수 있어요.`, 'addMore');
    discount = target.price; // 1 cup, base price only (option cost stays)
  } else if (c.type === 'giftcard') discount = Math.min(c.balance, subtotal);
  return { status: 'ok', ...base, discount, subtotal };
}

// ---- mock payment (idempotent by key; only pending/approved are stored) ----
const tx = new Map(); // key -> { txId, status, at }
const txView = (t) => ({ status: t.status === 'pending' && Date.now() - t.at >= PENDING_MS ? (t.status = 'approved') : t.status, txId: t.txId });
async function pay(req, res) {
  const { method, amount, key, attempt = 1 } = await readBody(req);
  if (key && tx.has(key)) return send(res, 200, txView(tx.get(key))); // duplicate guard
  const m = (await load('payments.json')).methods.find((x) => x.id === method);
  if (!m || !m.supported) return send(res, 200, { status: 'failed', reason: '지원하지 않는 결제 수단이에요.', solution: '다른 결제 수단을 골라 주세요. 담은 메뉴는 그대로예요.' });
  if (!(amount > 0)) return send(res, 200, { status: 'failed', reason: '결제 금액을 확인하지 못했어요.', solution: '주문 내역을 확인한 뒤 다시 시도해 주세요.' });
  if (m.mock === 'fail-once' && attempt <= 1) return send(res, 200, { status: 'failed', reason: `${m.name} 승인이 거절됐어요. 잔액이나 한도가 부족할 수 있어요.`, solution: '다른 결제 수단을 고르거나 같은 수단으로 다시 시도해 주세요. 담은 메뉴는 그대로예요.' });
  const t = { txId: randomUUID().slice(0, 8), status: m.mock === 'pending' ? 'pending' : 'approved', at: Date.now() };
  if (key) tx.set(key, t);
  send(res, 200, txView(t));
}

// AI PoC: real Gemini connectivity check. Cached for 60s so repeated visits cannot spam the API (no key is ever returned).
let aiCache = null;
const aiStatus = () => {
  if (!aiCache || Date.now() - aiCache.at > 60000) aiCache = { at: Date.now(), p: checkGemini({ runs: 1 }) };
  return aiCache.p;
};

async function api(req, res, url) {
  const p = url.pathname;
  if (req.method === 'POST') {
    if (p === '/api/pay') return pay(req, res);
    if (p === '/api/coupons/apply') {
      const { code = '', items } = await readBody(req);
      const [menus, data] = [(await load('menus.json')).menus, await load('coupons.json')];
      return send(res, 200, applyCoupon(code, items, menus, data));
    }
    return send(res, 404, { error: 'not_found' });
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const pay1 = p.match(/^\/api\/pay\/(\w+)$/);
  if (pay1) { const t = [...tx.values()].find((x) => x.txId === pay1[1]); return t ? send(res, 200, txView(t)) : send(res, 404, { error: 'not_found' }); }
  if (p === '/api/coupons') { const d = await load('coupons.json'); return send(res, 200, { types: d.types, codes: d.coupons.map(({ code, name, type }) => ({ code, name, type })) }); }
  if (p === '/api/payment-methods') return send(res, 200, await load('payments.json'));
  if (p === '/api/ai/status') return send(res, 200, await aiStatus());
  const data = await load('menus.json');
  if (p === '/api/categories') return send(res, 200, data.categories);
  if (p === '/api/menus') {
    const tags = (url.searchParams.get('tags') || '').split(',').filter(Boolean); // all tags must match
    return send(res, 200, data.menus.filter((m) => tags.every((t) => m.tags.includes(t))));
  }
  const one = p.match(/^\/api\/menus\/([\w-]+)$/);
  if (one) {
    const m = data.menus.find((x) => x.id === one[1]);
    return m ? send(res, 200, m) : send(res, 404, { error: 'not_found' });
  }
  send(res, 404, { error: 'not_found' });
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const f = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const base = f.startsWith('/data/') ? ROOT : join(ROOT, 'public');
    const buf = await readFile(join(base, f));
    res.writeHead(200, { 'content-type': (MIME[extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(buf);
  } catch { send(res, 404, { error: 'not_found' }); }
}).listen(PORT, () => console.log(`UXPRESSO kiosk → http://localhost:${PORT}`));
