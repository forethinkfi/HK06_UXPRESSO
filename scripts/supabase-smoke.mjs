// Real-Supabase connection check (run by YOU with your own env; it is not part of `npm test`).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/supabase-smoke.mjs --confirm
// Optional: SUPABASE_ANON_KEY=... also proves the public key cannot call the function.
// It stores ONE clearly marked test order (session id "smoke-test-…") and sends the same key twice to prove "no duplicate".
// Remove the test rows afterwards: DELETE FROM public.orders WHERE customer_session_id LIKE 'smoke-test-%';
import { randomUUID } from 'node:crypto';
import { saveOrder, ordersEnabled, formatOrderNo } from '../lib/orders.js';

if (!process.argv.includes('--confirm')) { console.log('This writes one test order to the Supabase project in SUPABASE_URL. Re-run with --confirm.'); process.exit(2); }
if (!ordersEnabled()) { console.log('FAIL  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing (or ORDERS_ENABLED=false).'); process.exit(1); }
const rec = { idempotency_key: randomUUID(), customer_session_id: `smoke-test-${Date.now()}`, kiosk_id: 'SMOKE', order_channel: 'touch', order_type: 'dine_in',
  subtotal_price: 2500, discount_amount: 0, total_price: 2500, coupon_code: null, payment_method: 'card', payment_status: 'simulated', payment_tx_id: 'smoke',
  items: [{ menu_id: 'americano', menu_name: '아메리카노', quantity: 1, temperature: 'ICE', size: null, options: [{ group_id: 'shot', group_label: '커피를 더 진하게', choice_id: '1', choice_label: '샷 1개 추가', price: 500 }], unit_price: 2500 }] };
let fail = 0;
const check = (n, c, x = '') => { if (!c) fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${c ? '' : '  → ' + x}`); };
const a = await saveOrder(rec);
check('create_order 저장 성공', a.ok && !a.duplicate, JSON.stringify(a));
const b = await saveOrder(rec);
check('같은 키 재요청 → 같은 주문번호, duplicate', b.ok && b.duplicate && b.orderNumber === a.orderNumber, JSON.stringify(b));
if (a.ok) console.log(`      saved as ${formatOrderNo(a.orderNumber)} (order_number ${a.orderNumber})`);
const bad = await saveOrder({ ...rec, idempotency_key: randomUUID(), total_price: 1 });
check('합계가 맞지 않는 주문은 DB가 거절(저장 안 됨)', !bad.ok, JSON.stringify(bad));
if (process.env.SUPABASE_ANON_KEY) {
  const r = await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/, '')}/rest/v1/rpc/create_order`, { method: 'POST', headers: { 'content-type': 'application/json', apikey: process.env.SUPABASE_ANON_KEY }, body: JSON.stringify({ p_order: { ...rec, idempotency_key: randomUUID() } }) });
  check('공개(anon) 키로는 create_order 호출 불가', r.status >= 400, `HTTP ${r.status}`);
  const t = await fetch(`${String(process.env.SUPABASE_URL).replace(/\/+$/, '')}/rest/v1/orders?select=id&limit=1`, { headers: { apikey: process.env.SUPABASE_ANON_KEY } });
  check('공개(anon) 키로는 orders 조회 불가', t.status >= 400, `HTTP ${t.status}`);
}
process.exit(fail ? 1 : 0);
