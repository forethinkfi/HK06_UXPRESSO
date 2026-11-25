// Protection for the public AI Lab test API: kill switch, optional access token, same-origin check,
// per-IP rate limit, global hourly Gemini budget, body-size limit. Nothing here ever sees or logs the API key.
import { timingSafeEqual } from 'node:crypto';

export const LIMITS = {
  maxChars: 120,            // customer sentence length
  maxBody: 4096,            // request body bytes
  checkPerMin: 4,           // POST /api/ai/check per IP
  orderPerMin: 10,          // POST /api/ai/order per IP
  hourlyCap: Math.max(1, Number(process.env.AI_HOURLY_CAP) || 120), // total Gemini requests per hour (all visitors)
};

export const enabled = () => process.env.AI_LAB_ENABLED !== 'false';
export const tokenRequired = () => !!process.env.AI_LAB_TOKEN;

const windows = new Map(); // `${ip}|${bucket}` -> { n, reset }
let budget = { n: 0, reset: Date.now() + 3600000 };

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();

export function rateLimit(req, bucket, max) {
  const now = Date.now();
  if (windows.size > 5000) for (const [k, v] of windows) if (v.reset < now) windows.delete(k);
  const k = `${clientIp(req)}|${bucket}`;
  let w = windows.get(k);
  if (!w || w.reset < now) w = { n: 0, reset: now + 60000 };
  w.n++;
  windows.set(k, w);
  return w.n <= max ? { ok: true } : { ok: false, retryAfter: Math.ceil((w.reset - now) / 1000) };
}

// Reserve `cost` Gemini requests from the hourly budget (call before hitting Google).
export function takeBudget(cost = 1) {
  const now = Date.now();
  if (budget.reset < now) budget = { n: 0, reset: now + 3600000 };
  if (budget.n + cost > LIMITS.hourlyCap) return { ok: false, retryAfter: Math.ceil((budget.reset - now) / 1000) };
  budget.n += cost;
  return { ok: true, used: budget.n };
}

// Browsers always send Origin on cross-site POSTs; reject it unless it is this very site.
export function sameOrigin(req) {
  const o = req.headers.origin;
  if (o) { try { return new URL(o).host === req.headers.host; } catch { return false; } }
  return req.headers['sec-fetch-site'] !== 'cross-site';
}

export function tokenOk(req) {
  const want = process.env.AI_LAB_TOKEN;
  if (!want) return true;
  const got = String(req.headers['x-ai-lab-token'] || '');
  const a = Buffer.from(got), b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Rejects bodies over `max` bytes. The 413 error carries `closeAfterReply` so the caller can answer first and then drop the connection.
export function readJson(req, max = LIMITS.maxBody) {
  return new Promise((ok, fail) => {
    const tooLarge = () => Object.assign(new Error('too_large'), { code: 413, closeAfterReply: true });
    if (Number(req.headers['content-length']) > max) return fail(tooLarge());
    let n = 0, over = false; const chunks = [];
    req.on('data', (c) => { n += c.length; if (over) return; if (n > max) { over = true; chunks.length = 0; fail(tooLarge()); } else chunks.push(c); });
    req.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { fail(Object.assign(new Error('bad_json'), { code: 400 })); } });
    req.on('error', () => fail(Object.assign(new Error('read_error'), { code: 400 })));
  });
}
