// UXPRESSO kiosk prototype server: zero-dependency static host + self-made test APIs (not official MGC APIs).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { handleLiveConnection, liveConfigured, liveModel, apiKey } from './lib/live-kiosk.js';
import { liveEnabled, originAllowed, clientIp, acquire, limits as liveLimits, activeSessions, rate } from './lib/live-guard.js';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
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

let modelCheck = null; // cached 60 s: does the configured live model exist for this key and support bidiGenerateContent?
async function liveModelStatus() {
  if (!liveConfigured()) return { checked: false };
  if (modelCheck && Date.now() - modelCheck.at < 60000) return modelCheck.v;
  let v;
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(liveModel())}`, { headers: { 'x-goog-api-key': apiKey() }, signal: AbortSignal.timeout(8000) });
    const j = await r.json().catch(() => ({}));
    v = r.status === 200
      ? { checked: true, found: true, supportsLive: (j.supportedGenerationMethods || []).includes('bidiGenerateContent'), methods: j.supportedGenerationMethods || [] }
      : { checked: true, found: false, httpStatus: r.status, reason: r.status === 400 || r.status === 401 || r.status === 403 ? 'key_rejected' : r.status === 404 ? 'model_not_found' : 'google_error' };
  } catch { v = { checked: true, found: false, reason: 'network' }; }
  modelCheck = { at: Date.now(), v };
  return v;
}

async function api(req, res, url) {
  const p = url.pathname;
  if (p === '/api/live/health' && req.method === 'GET') {
    if (!rate(clientIp(req), 'live-health', 12)) return send(res, 429, { error: 'rate_limited' });
    const L = liveLimits();
    return send(res, 200, {
      enabled: liveEnabled(), keyConfigured: liveConfigured(), model: liveModel(), wsPath: '/api/live',
      nodeVersion: process.version, activeSessions: activeSessions(),
      limits: { maxSessions: L.maxSessions, maxPerIp: L.maxPerIp, perHour: L.perHour, maxSeconds: L.maxSeconds, idleSeconds: L.idleSeconds },
      modelStatus: await liveModelStatus(),
    });
  }
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    // 첫 주소는 v6 화면. v2-I 프로토타입은 /index.html 에 그대로 있고, 쿼리가 붙은 /?... 는 이전처럼 동작한다.
    if (url.pathname === '/' && !url.search) { res.writeHead(302, { location: '/v6/index.html' }); return res.end(); }
    const f = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const base = f.startsWith('/data/') ? ROOT : join(ROOT, 'public');
    const buf = await readFile(join(base, f));
    res.writeHead(200, { 'content-type': (MIME[extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(buf);
  } catch { send(res, 404, { error: 'not_found' }); }
});

// ---- Gemini Live voice ordering: WebSocket /api/live (see docs/live-integration.md) ----
// The browser never gets the API key. Before a socket is accepted: kill switch, same-site Origin, and session limits.
const wss = new WebSocketServer({ noServer: true, maxPayload: liveLimits().maxPayload });
const refuse = (socket, code, text) => { try { socket.write(`HTTP/1.1 ${code} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`); } catch {} socket.destroy(); };
server.on('upgrade', (req, socket, head) => {
  let path = '';
  try { path = new URL(req.url, 'http://x').pathname; } catch {}
  if (path !== '/api/live') return refuse(socket, 404, 'Not Found');
  if (!liveEnabled()) return refuse(socket, 404, 'Not Found');
  if (!originAllowed(req)) { console.log('[live] refused: origin'); return refuse(socket, 403, 'Forbidden'); }
  const slot = acquire(clientIp(req));
  if (!slot.release) { console.log(`[live] refused: ${slot.reason}`); return refuse(socket, 429, 'Too Many Requests'); }
  wss.handleUpgrade(req, socket, head, (clientWs) => {
    console.log(`[live] session start active=${activeSessions()}`);
    // createClient is a test hook (scripts/fake-live.mjs); it is undefined in production, so the real Gemini client is used
    handleLiveConnection(clientWs, load, { release: slot.release, catalog: new URL(req.url, 'http://x').searchParams.get('catalog') === 'ai128' ? 'ai128' : 'v6', createClient: globalThis.__UXPRESSO_TEST_LIVE_FACTORY }).catch((err) => {
      console.log(`[live] connection failed: ${String(err?.message || err).slice(0, 120)}`);
      try { clientWs.send(JSON.stringify({ type: 'error', code: 'UNKNOWN' })); clientWs.close(); } catch {}
      slot.release();
    });
  });
});

server.listen(Number(PORT) || 3000, '0.0.0.0', () => console.log(`UXPRESSO kiosk → http://0.0.0.0:${PORT}`));
