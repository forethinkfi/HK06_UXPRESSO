// Protection for the Gemini Live WebSocket (/api/live). The server's GEMINI_API_KEY pays for every session, so an
// open endpoint would let anyone who knows the URL run voice sessions on it. Nothing here sees or logs the API key.
//
//   LIVE_ENABLED           "false" turns the voice endpoint off (the kiosk keeps working by touch)
//   LIVE_ALLOWED_ORIGINS   optional, comma separated origins (https://example.com) in addition to "same host"
//   LIVE_MAX_SESSIONS      concurrent sessions in total          (default 5)
//   LIVE_MAX_PER_IP        concurrent sessions per client IP     (default 2)
//   LIVE_SESSIONS_PER_HOUR new sessions per hour, all visitors   (default 60)
//   LIVE_MAX_SECONDS       hard limit of one session             (default 300)
//   LIVE_IDLE_SECONDS      close after this long without input   (default 90)

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : d; };
export const limits = () => ({
  maxSessions: num(process.env.LIVE_MAX_SESSIONS, 5),
  maxPerIp: num(process.env.LIVE_MAX_PER_IP, 2),
  perHour: num(process.env.LIVE_SESSIONS_PER_HOUR, 60),
  maxSeconds: num(process.env.LIVE_MAX_SECONDS, 300),
  idleSeconds: num(process.env.LIVE_IDLE_SECONDS, 90),
  maxPayload: 256 * 1024,      // bytes per WebSocket message (one audio chunk is ~11 KB)
  maxTextChars: 200,
  maxMsgsPerSecond: 40,        // audio is ~4/s; anything far above is abuse
});

export const liveEnabled = () => process.env.LIVE_ENABLED !== 'false';
export const clientIp = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '?').split(',')[0].trim();

// Browsers always send Origin on WebSocket handshakes. Allow this very site (and configured extras); a missing Origin
// (non-browser client) is refused because the kiosk page is the only intended client.
export function originAllowed(req) {
  const o = req.headers.origin;
  if (!o) return false;
  let host;
  try { host = new URL(o).host; } catch { return false; }
  if (host === req.headers.host) return true;
  return String(process.env.LIVE_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean).includes(o);
}

const perIp = new Map();            // ip -> concurrent sessions
let total = 0;
let hour = { n: 0, reset: Date.now() + 3600000 };

// Returns { release } when a session may start, otherwise { reason: 'busy' | 'ip_busy' | 'hourly' }.
export function acquire(ip) {
  const L = limits(), now = Date.now();
  if (hour.reset < now) hour = { n: 0, reset: now + 3600000 };
  if (hour.n >= L.perHour) return { reason: 'hourly' };
  if (total >= L.maxSessions) return { reason: 'busy' };
  if ((perIp.get(ip) || 0) >= L.maxPerIp) return { reason: 'ip_busy' };
  hour.n++; total++; perIp.set(ip, (perIp.get(ip) || 0) + 1);
  let done = false;
  return { release: () => { if (done) return; done = true; total--; const n = (perIp.get(ip) || 1) - 1; n > 0 ? perIp.set(ip, n) : perIp.delete(ip); } };
}
export const activeSessions = () => total;

// Simple fixed-window limiter for the HTTP health endpoint.
const wins = new Map();
export function rate(ip, bucket, max, ms = 60000) {
  const k = `${ip}|${bucket}`, now = Date.now();
  let w = wins.get(k);
  if (!w || w.reset < now) w = { n: 0, reset: now + ms };
  w.n++; wins.set(k, w);
  if (wins.size > 2000) for (const [kk, v] of wins) if (v.reset < now) wins.delete(kk);
  return w.n <= max;
}
