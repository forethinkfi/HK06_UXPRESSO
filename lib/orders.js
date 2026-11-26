// Order saving: server-side re-pricing + snapshot of the customer's cart, then ONE atomic Supabase RPC (create_order).
// Nothing here trusts prices or names sent by the browser. The browser only sends menu ids, temperature, quantity and
// chosen option ids; names, option labels and prices are recalculated from data/menus.json (and coupons.json).
//
//   SUPABASE_URL                 https://<project-ref>.supabase.co   (server side only)
//   SUPABASE_SERVICE_ROLE_KEY    server side only. Never sent to the browser, never logged.
//   ORDERS_ENABLED               "false" turns saving off (the kiosk keeps its demo behaviour)
//   KIOSK_ID                     optional, default KIOSK-01
//
// The Supabase side is supabase/migrations/*.sql (table DDL: supabase/schema/*.sql). Spec: docs/orders/schema.md

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SESSION = /^[\w-]{8,64}$/;
const MODES = { dine: 'dine_in', take: 'takeout' };
const CHANNELS = ['voice', 'touch', 'mixed'];
export const MAX_QTY = 20, MAX_LINES = 50;

const url = () => String(process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const key = () => String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const urlOk = (u) => { try { const x = new URL(u); return x.protocol === 'https:' || (x.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(x.hostname)); } catch { return false; } };
export const ordersEnabled = () => process.env.ORDERS_ENABLED !== 'false' && urlOk(url()) && !!key();
export const ordersStatus = () => ({ enabled: ordersEnabled(), switchOff: process.env.ORDERS_ENABLED === 'false', urlSet: !!url(), keySet: !!key() });

// customer-facing number: order_number 7 -> "A-007" (1000 -> "A-1000"); there is no daily reset in this scope
export const formatOrderNo = (n) => 'A-' + String(n).padStart(3, '0');

const bad = (error, http = 400) => ({ error, http });
const int = (v) => (Number.isInteger(v) ? v : NaN);

// input (from the browser) + menus + couponFn(code, items) -> { order } | { error, http }
export function normalizeOrder(input, menus, couponFn) {
  const b = input && typeof input === 'object' ? input : {};
  if (!UUID.test(String(b.paymentKey || ''))) return bad('invalid_payment_key');
  if (!SESSION.test(String(b.sessionId || ''))) return bad('invalid_session');
  const orderType = MODES[b.mode];
  if (!orderType) return bad('invalid_mode');
  if (!CHANNELS.includes(b.channel)) return bad('invalid_channel');
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > MAX_LINES) return bad('invalid_items');
  if (!Number.isInteger(b.expectedFinal) || b.expectedFinal < 0) return bad('invalid_expected_total');

  const items = [], lines = [];
  for (const raw of b.items) {
    const m = menus.find((x) => x.id === raw?.menuId);
    if (!m) return bad('menu_not_found', 422);
    if (m.available === false) return bad('menu_unavailable', 422);
    const qty = int(raw.qty);
    if (!(qty >= 1 && qty <= MAX_QTY)) return bad('invalid_quantity', 422);
    const temps = Array.isArray(m.temperature) ? m.temperature : [];
    let temp = raw.temp ?? null;
    if (!temps.length) temp = null;
    else if (temp == null) { if (temps.length === 1) temp = temps[0]; else return bad('temperature_required', 422); }
    else if (!temps.includes(temp)) return bad('invalid_temperature', 422);
    const chosen = raw.opts && typeof raw.opts === 'object' && !Array.isArray(raw.opts) ? raw.opts : {};
    for (const gid of Object.keys(chosen)) if (!(m.options || []).some((g) => g.id === gid)) return bad('invalid_option', 422);
    const snap = [];
    let optSum = 0;
    for (const g of m.options || []) {
      const cid = chosen[g.id];
      const applicable = !g.onlyTemp || g.onlyTemp === temp;
      if (cid == null || String(cid) === '0') { if (g.required && applicable && cid == null) return bad('option_required', 422); continue; }
      const c = g.choices.find((x) => x.id === String(cid));
      if (!c || !applicable) return bad('invalid_option', 422);
      snap.push({ group_id: g.id, group_label: g.label, choice_id: c.id, choice_label: c.label, price: c.price || 0 });
      optSum += c.price || 0;
    }
    const base = m.tempPrices && temp && m.tempPrices[temp] != null ? m.tempPrices[temp] : m.price;
    if (base == null) return bad('price_unconfirmed', 422);
    const unit = base + optSum;
    items.push({ menu_id: m.id, menu_name: m.name, quantity: qty, temperature: temp, size: null, options: snap, unit_price: unit });
    lines.push({ menuId: m.id, temp, qty, opts: Object.fromEntries(snap.map((o) => [o.group_id, o.choice_id])) });
  }
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  let discount = 0, couponCode = null;
  if (b.couponCode) {
    const r = couponFn(String(b.couponCode), lines);
    if (r?.status !== 'ok' || !Number.isInteger(r.discount)) return bad('coupon_invalid', 409);
    discount = r.discount; couponCode = r.coupon.code;
  }
  const total = Math.max(0, subtotal - discount);
  if (total !== b.expectedFinal) return bad('price_mismatch', 409); // what the customer saw is not what the server computes
  const methodId = total === 0 ? null : String(b.methodId || '');
  if (total > 0 && !methodId) return bad('invalid_method');
  return {
    order: { final: total, methodId },
    record: {
      idempotency_key: b.paymentKey.toLowerCase(), customer_session_id: b.sessionId, kiosk_id: String(process.env.KIOSK_ID || 'KIOSK-01').slice(0, 40),
      order_channel: b.channel, order_type: orderType, subtotal_price: subtotal, discount_amount: discount, total_price: total, coupon_code: couponCode,
      payment_method: methodId, payment_status: total === 0 ? 'coupon_covered' : 'simulated', payment_tx_id: total === 0 ? null : String(b.txId || '').slice(0, 64) || null,
      items,
    },
  };
}

// One call = one transaction (the create_order SQL function). Returns { ok:true, orderNumber, duplicate } or { ok:false, reason }.
export async function saveOrder(record, { fetchImpl = fetch, timeoutMs = 8000 } = {}) {
  const k = key();
  const headers = { 'content-type': 'application/json', apikey: k };
  if (k.startsWith('eyJ')) headers.authorization = `Bearer ${k}`; // legacy JWT keys need it; new sb_secret_ keys must not send it
  try {
    const r = await fetchImpl(`${url()}/rest/v1/rpc/create_order`, { method: 'POST', headers, body: JSON.stringify({ p_order: record }), signal: AbortSignal.timeout(timeoutMs) });
    const j = await r.json().catch(() => null);
    if (!r.ok) return { ok: false, reason: `http_${r.status}`, detail: String(j?.message || j?.code || '').slice(0, 120) };
    if (!j || !Number.isFinite(Number(j.order_number))) return { ok: false, reason: 'bad_response' };
    return { ok: true, orderNumber: Number(j.order_number), duplicate: !!j.duplicate };
  } catch (e) { return { ok: false, reason: e?.name === 'TimeoutError' ? 'timeout' : 'network' }; }
}

// Kitchen hand-off JSON from DB rows (same shape as the SQL function public.kitchen_order_json). No kitchen system is connected yet.
export function toKitchenJson(order, items) {
  return {
    orderNumber: formatOrderNo(order.order_number), orderId: order.id, receivedAt: order.created_at, status: order.order_status,
    orderType: order.order_type, channel: order.order_channel, customerSessionId: order.customer_session_id, kioskId: order.kiosk_id,
    items: items.map((i) => ({ menuId: i.menu_id, name: i.menu_name, quantity: i.quantity, temperature: i.temperature, size: i.size,
      options: (i.options || []).map((o) => ({ group: o.group_label, choice: o.choice_label, extraPrice: o.price })) })),
  };
}
