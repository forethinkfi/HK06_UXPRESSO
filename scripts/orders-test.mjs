// Tests for order saving (lib/orders.js + POST /api/orders in server.js) against a FAKE Supabase (scripts/fake-supabase.mjs).
// Real Supabase is NOT contacted here. Usage: node scripts/orders-test.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { startFakeSupabase } from './fake-supabase.mjs';
import { normalizeOrder, formatOrderNo, toKitchenJson, saveOrder } from '../lib/orders.js';
import { applyCoupon } from '../lib/coupons.js';

const KEY = 'sb_secret_TESTKEY-never-print-me-9f8e7d';
let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  → ${extra}`}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const menus = JSON.parse(readFileSync(new URL('../data/menus.json', import.meta.url), 'utf8')).menus;
const cdata = JSON.parse(readFileSync(new URL('../data/coupons.json', import.meta.url), 'utf8'));
const cfn = (code, items) => applyCoupon(code, items, menus, cdata);
const base = (over = {}) => ({ paymentKey: randomUUID(), sessionId: randomUUID(), mode: 'dine', channel: 'touch', couponCode: '', methodId: 'card', txId: 'abcd1234', expectedFinal: 2000, items: [{ menuId: 'americano', temp: 'ICE', qty: 1, opts: {} }], ...over });

console.log('--- 서버 재계산·검증 (normalizeOrder) ---');
const lat = menus.find((m) => m.id === 'latte'), latP = lat.tempPrices?.HOT ?? lat.price;
let r = normalizeOrder(base(), menus, cfn);
check('아메리카노 ICE 1잔 = 2,000원, dine → dine_in', !r.error && r.record.total_price === 2000 && r.record.order_type === 'dine_in', JSON.stringify(r));
r = normalizeOrder(base({ mode: 'take', expectedFinal: 6000 + latP, items: [{ menuId: 'americano', temp: 'ICE', qty: 2, opts: { shot: '1', syrup: '1', ice: '1' } }, { menuId: 'latte', temp: 'HOT', qty: 1, opts: {} }] }), menus, cfn);
check('복수 메뉴·옵션: 합계를 서버가 다시 계산 + take → takeout', r.error ? false : r.record.subtotal_price === 2 * (2000 + 500 + 500) + latP && r.record.order_type === 'takeout', JSON.stringify(r.error || r.record.subtotal_price));
const line1 = r.record?.items?.[0];
check('옵션 스냅샷에 그룹명·선택지명·추가 가격 저장(ID만 저장하지 않음)', line1?.options?.length === 3 && line1.options.some((o) => o.group_id === 'shot' && o.group_label === '커피를 더 진하게' && o.choice_label === '샷 1개 추가' && o.price === 500), JSON.stringify(line1?.options));
check('메뉴 이름·단가가 서버 데이터 기준 스냅샷', line1?.menu_name === '아메리카노' && line1.unit_price === 3000 && line1.temperature === 'ICE', JSON.stringify(line1));
r = normalizeOrder(base({ expectedFinal: 1 }), menus, cfn);
check('브라우저가 보낸 금액이 서버 계산과 다르면 거절(price_mismatch)', r.error === 'price_mismatch' && r.http === 409);
r = normalizeOrder(base({ items: [{ menuId: 'americano', temp: 'ICE', qty: 1, opts: {}, price: 1 }] }), menus, cfn);
check('항목에 끼워 넣은 price 필드는 무시', !r.error && r.record.total_price === 2000);
check('없는 메뉴는 거절', normalizeOrder(base({ items: [{ menuId: 'nope', temp: 'ICE', qty: 1, opts: {} }] }), menus, cfn).error === 'menu_not_found');
check('수량 0/21/소수는 거절', ['0', 21, 1.5].every((q) => normalizeOrder(base({ items: [{ menuId: 'americano', temp: 'ICE', qty: q === '0' ? 0 : q, opts: {} }] }), menus, cfn).error === 'invalid_quantity'));
check('HOT/ICE 둘 다 되는 메뉴에서 온도가 없으면 거절', normalizeOrder(base({ items: [{ menuId: 'americano', temp: null, qty: 1, opts: {} }] }), menus, cfn).error === 'temperature_required');
check('ICE 전용 옵션(얼음 양)을 HOT에 붙이면 거절', normalizeOrder(base({ items: [{ menuId: 'americano', temp: 'HOT', qty: 1, opts: { ice: '1' } }] }), menus, cfn).error === 'invalid_option');
check('모르는 옵션/선택지는 거절', normalizeOrder(base({ items: [{ menuId: 'americano', temp: 'ICE', qty: 1, opts: { shot: '9' } }] }), menus, cfn).error === 'invalid_option' && normalizeOrder(base({ items: [{ menuId: 'americano', temp: 'ICE', qty: 1, opts: { zzz: '1' } }] }), menus, cfn).error === 'invalid_option');
const unpriced = menus.find((m) => m.price == null && !m.tempPrices);
check('가격 미확인 메뉴는 거절(결제 확정 불가)', normalizeOrder(base({ items: [{ menuId: unpriced.id, temp: (unpriced.temperature || [])[0] || null, qty: 1, opts: {} }] }), menus, cfn).error === 'price_unconfirmed', unpriced.id);
check('paymentKey가 UUID가 아니면 거절', normalizeOrder(base({ paymentKey: 'abc' }), menus, cfn).error === 'invalid_payment_key');
check('channel/mode 값 검증', normalizeOrder(base({ channel: 'x' }), menus, cfn).error === 'invalid_channel' && normalizeOrder(base({ mode: 'x' }), menus, cfn).error === 'invalid_mode');
const disc = cdata.coupons.find((c) => c.type === 'discount' && c.kioskUsable && c.kind === 'percent');
const subtotalForCoupon = Math.max(disc.minOrder, 6000);
const q = Math.ceil(subtotalForCoupon / 2000);
const cr = cfn(disc.code, [{ menuId: 'americano', temp: 'ICE', qty: q, opts: {} }]);
r = normalizeOrder(base({ couponCode: disc.code, expectedFinal: q * 2000 - cr.discount, items: [{ menuId: 'americano', temp: 'ICE', qty: q, opts: {} }] }), menus, cfn);
check(`쿠폰(${disc.code}) 할인을 서버가 계산해 total/discount에 반영`, !r.error && r.record.discount_amount === cr.discount && r.record.total_price === q * 2000 - cr.discount && r.record.coupon_code === disc.code, JSON.stringify(r.error || r.record));
r = normalizeOrder(base({ couponCode: 'NOPE-CODE', expectedFinal: 2000 }), menus, cfn);
check('확인되지 않는 쿠폰은 거절', r.error === 'coupon_invalid');
check('주문번호 표시: 1→A-001, 12→A-012, 1000→A-1000', formatOrderNo(1) === 'A-001' && formatOrderNo(12) === 'A-012' && formatOrderNo(1000) === 'A-1000');
const kj = toKitchenJson({ id: 'x', order_number: 5, created_at: '2026-11-26T01:00:00Z', order_status: 'received', order_type: 'takeout', order_channel: 'voice', customer_session_id: 's', kiosk_id: 'KIOSK-01' }, [{ menu_id: 'americano', menu_name: '아메리카노', quantity: 2, temperature: 'ICE', size: null, options: [{ group_label: '샷', choice_label: '샷 1개 추가', price: 500 }] }]);
check('주방 JSON 변환: 번호·유형·채널·옵션 평탄화', kj.orderNumber === 'A-005' && kj.orderType === 'takeout' && kj.channel === 'voice' && kj.items[0].options[0].choice === '샷 1개 추가');

console.log('--- saveOrder 단위 (fetch 모의) ---');
process.env.SUPABASE_URL = 'https://example.supabase.co'; process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
let call;
const mk = (resp) => async (u, o) => { call = { u, o }; return resp; };
let s = await saveOrder({ a: 1 }, { fetchImpl: mk({ ok: true, status: 200, json: async () => ({ order_number: 7, duplicate: false }) }) });
check('RPC URL·apikey 헤더, sb_secret_ 키에는 Authorization Bearer를 보내지 않음', call.u === 'https://example.supabase.co/rest/v1/rpc/create_order' && call.o.headers.apikey === KEY && !call.o.headers.authorization && s.orderNumber === 7);
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOi.fake.jwt';
await saveOrder({ a: 1 }, { fetchImpl: mk({ ok: true, status: 200, json: async () => ({ order_number: 1 }) }) });
check('레거시 JWT service_role 키는 Bearer도 함께 전송', call.o.headers.authorization === 'Bearer eyJhbGciOi.fake.jwt');
process.env.SUPABASE_SERVICE_ROLE_KEY = KEY;
s = await saveOrder({}, { fetchImpl: mk({ ok: false, status: 500, json: async () => ({ message: 'boom' }) }) });
check('HTTP 500 → ok:false(http_500), 키 값이 결과에 없음', s.ok === false && s.reason === 'http_500' && !JSON.stringify(s).includes(KEY));
s = await saveOrder({}, { fetchImpl: async () => { throw new Error('ECONNRESET'); } });
check('네트워크 오류 → ok:false(network)', s.ok === false && s.reason === 'network');

console.log('--- HTTP 통합 (서버 + 모의 Supabase) ---');
const FAKE = 54321, PORT = 54322, PORT_OFF = 54323;
const fake = await startFakeSupabase(FAKE, KEY);
const start = (port, env) => spawn('node', ['server.js'], { cwd: new URL('..', import.meta.url).pathname, env: { ...process.env, PORT: port, LIVE_ENABLED: 'false', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
let log = '';
const srv = start(PORT, { SUPABASE_URL: `http://127.0.0.1:${FAKE}`, SUPABASE_SERVICE_ROLE_KEY: KEY });
srv.stdout.on('data', (d) => (log += d)); srv.stderr.on('data', (d) => (log += d));
const off = start(PORT_OFF, { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' });
await sleep(1200);
const post = async (port, path, b) => { const x = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', body: JSON.stringify(b) }); return { http: x.status, ...(await x.json()) }; };
const state = async () => (await fetch(`http://127.0.0.1:${FAKE}/__state`)).json();
const reset = () => fetch(`http://127.0.0.1:${FAKE}/__reset`, { method: 'POST' });
async function payAndOrder(over = {}, payOver = {}) {
  const o = base(over);
  const total = over.expectedFinal ?? 2000;
  const p = await post(PORT, '/api/pay', { method: o.methodId || 'card', amount: total, key: o.paymentKey, attempt: 1, ...payOver });
  o.txId = p.txId;
  return { o, p, r: await post(PORT, '/api/orders', o) };
}
try {
  let h = await (await fetch(`http://127.0.0.1:${PORT}/api/orders/health`)).json();
  check('health: 활성 + 키 값은 노출하지 않음', h.enabled === true && !JSON.stringify(h).includes(KEY), JSON.stringify(h));
  let x = await payAndOrder();
  check('결제 승인 후 주문 저장 → saved + A-001', x.r.http === 200 && x.r.status === 'saved' && x.r.orderNo === 'A-001', JSON.stringify(x.r));
  let st = await state();
  check('저장된 레코드: 세션 UUID·결제키(idempotency)·채널·옵션 스냅샷', st.orders.length === 1 && st.orders[0].record.customer_session_id === x.o.sessionId && st.orders[0].record.idempotency_key === x.o.paymentKey && st.orders[0].record.order_channel === 'touch');
  check('서버가 보낸 헤더: 서비스 키는 apikey로만, 브라우저 응답에는 키 없음', st.seen[0].apikey === KEY && st.seen[0].authorization === null && !JSON.stringify(x).includes(KEY));
  const again = await post(PORT, '/api/orders', x.o);
  st = await state();
  check('같은 paymentKey 재요청 → 기존 번호 반환(duplicate), 중복 저장 없음', again.status === 'duplicate' && again.orderNo === 'A-001' && st.orders.length === 1, JSON.stringify(again));
  const par = await Promise.all([1, 2, 3, 4].map(() => post(PORT, '/api/orders', x.o)));
  st = await state();
  check('동시 4건 재요청에도 1건만 저장', par.every((z) => z.orderNo === 'A-001') && st.orders.length === 1);

  await reset();
  for (const [ch, label] of [['voice', '음성'], ['touch', '터치'], ['mixed', '혼합']]) {
    const y = await payAndOrder({ channel: ch, mode: ch === 'voice' ? 'take' : 'dine' });
    const ss = await state();
    check(`${label} 주문 → order_channel=${ch}로 저장`, y.r.status === 'saved' && ss.orders.at(-1).record.order_channel === ch, JSON.stringify(y.r));
  }
  await reset();
  x = await payAndOrder({ mode: 'take', channel: 'mixed', expectedFinal: 6000 + latP, items: [{ menuId: 'americano', temp: 'ICE', qty: 2, opts: { shot: '1', syrup: '1' } }, { menuId: 'latte', temp: 'HOT', qty: 1, opts: {} }] }, { amount: 6000 + latP - 0 });
  st = await state();
  check('복수 메뉴·옵션 주문이 한 번의 호출로 items 2줄 저장', x.r.status === 'saved' && st.orders[0].record.items.length === 2 && st.calls === 1, JSON.stringify(x.r));

  await reset();
  x = { o: base() }; 
  let y = await post(PORT, '/api/orders', x.o);
  check('결제 내역이 없는 주문키 → 402 payment_not_found, 저장 안 함', y.http === 402 && y.code === 'payment_not_found' && (await state()).calls === 0);
  const ok = await post(PORT, '/api/pay', { method: 'card', amount: 2000, key: x.o.paymentKey, attempt: 1 });
  y = await post(PORT, '/api/orders', { ...x.o, txId: 'ffffffff' });
  check('다른 txId는 거절(payment_mismatch)', y.http === 409 && y.code === 'payment_mismatch');
  const k2 = randomUUID(); const p2 = await post(PORT, '/api/pay', { method: 'card', amount: 2500, key: k2, attempt: 1 });
  y = await post(PORT, '/api/orders', base({ paymentKey: k2, txId: p2.txId, expectedFinal: 2000 }));
  check('결제 금액(2,500)과 주문 금액(2,000)이 다르면 거절', y.http === 409 && y.code === 'payment_mismatch', JSON.stringify(y));
  const k3 = randomUUID(); const p3 = await post(PORT, '/api/pay', { method: 'payco', amount: 2000, key: k3, attempt: 1 });
  y = await post(PORT, '/api/orders', base({ paymentKey: k3, txId: p3.txId, methodId: 'card' }));
  check('결제 수단이 다르면 거절', y.http === 409 && y.code === 'payment_mismatch');
  const failM = (await (await fetch(`http://127.0.0.1:${PORT}/api/payment-methods`)).json()).methods.find((m) => m.mock === 'pending');
  if (failM) {
    const k4 = randomUUID(); const p4 = await post(PORT, '/api/pay', { method: failM.id, amount: 2000, key: k4, attempt: 1 });
    y = await post(PORT, '/api/orders', base({ paymentKey: k4, txId: p4.txId, methodId: failM.id }));
    check('승인 대기(pending) 상태의 결제는 저장 거절', p4.status === 'pending' && y.http === 402 && y.code === 'payment_not_approved', JSON.stringify(y));
    await sleep(3200);
    y = await post(PORT, '/api/orders', base({ paymentKey: k4, txId: p4.txId, methodId: failM.id }));
    check('승인된 뒤에는 같은 요청이 저장됨', y.status === 'saved', JSON.stringify(y));
  }

  console.log('--- 저장 실패 → 결제 재실행 없이 저장만 재시도 ---');
  await reset();
  const kf = randomUUID();
  const pf = await post(PORT, '/api/pay', { method: 'card', amount: 2000, key: kf, attempt: 1 });
  await fetch(`http://127.0.0.1:${FAKE}/__fail?n=1`, { method: 'POST' });
  const of = base({ paymentKey: kf, txId: pf.txId });
  y = await post(PORT, '/api/orders', of);
  check('DB 장애 → 503 unavailable, 번호를 주지 않음, 저장 0건', y.http === 503 && y.status === 'unavailable' && !y.orderNo && (await state()).orders.length === 0, JSON.stringify(y));
  const pf2 = await post(PORT, '/api/pay', { method: 'card', amount: 2000, key: kf, attempt: 2 });
  check('같은 key로 /api/pay를 다시 불러도 같은 txId(중복 결제 없음)', pf2.txId === pf.txId);
  y = await post(PORT, '/api/orders', of);
  check('복구 후 같은 요청 재시도 → saved(1건)', y.status === 'saved' && (await state()).orders.length === 1, JSON.stringify(y));
  await fetch(`http://127.0.0.1:${FAKE}/__fail?n=1`, { method: 'POST' });
  const dup = await post(PORT, '/api/orders', of);
  check('이미 저장된 주문은 DB가 실패해도 재요청 시 일관되게 처리(장애 시 503, 번호 임의 생성 안 함)', dup.http === 503 && !dup.orderNo);

  console.log('--- 환경변수 없는 개발 환경 ---');
  h = await (await fetch(`http://127.0.0.1:${PORT_OFF}/api/orders/health`)).json();
  const d1 = await post(PORT_OFF, '/api/orders', base());
  check('키 없음: status=disabled(저장 성공으로 표시하지 않음), 에러 없이 200', h.enabled === false && d1.http === 200 && d1.status === 'disabled' && !d1.orderNo, JSON.stringify([h, d1]));
  check('서버 로그에 서비스 키 값이 없음', !log.includes(KEY));
  const bd = await fetch(`http://127.0.0.1:${PORT}/api/orders`, { method: 'POST', body: '{bad' }); const bj = await bd.json();
  check('깨진 JSON → 400급 거절, 서버는 계속 동작', bd.status === 400 && bj.status === 'rejected');
} finally { srv.kill(); off.kill(); fake.close(); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
