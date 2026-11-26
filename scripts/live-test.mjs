// Tests for the Gemini Live voice-ordering server (lib/live-kiosk.js, lib/live-guard.js, server.js /api/live).
// The Gemini side is FAKE (scripts/fake-live.mjs): this proves validation, protection and the cart round trip,
// NOT how well the real Gemini understands Korean/English/Chinese/Japanese orders.   Usage: node scripts/live-test.mjs
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import WebSocket from 'ws';

process.env.GEMINI_API_KEY = 'TESTKEY-never-print-me-123456';
const K = await import('../lib/live-kiosk.js');
const G = await import('../lib/live-guard.js');
const menusData = JSON.parse(readFileSync(new URL('../data/ai/menus-128.json', import.meta.url), 'utf8'));

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  → ${extra}`}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- unit: tool validation
console.log('--- tool validation (before anything reaches the kiosk) ---');
const sent = [];
const kiosk = async (name, args) => { sent.push({ name, args }); return { ok: true, echoed: args }; };
const run = async (name, args) => { sent.length = 0; const r = await K.runKioskTool(name, args, menusData, { lang: 'ko' }, kiosk); return { r, sent: [...sent] }; };

let x = await run('add_to_cart', { menuId: 'strawberry_latte', qty: 1 });
check('없는 메뉴는 키오스크에 보내지 않고 거절', x.r.ok === false && x.sent.length === 0, JSON.stringify(x));
x = await run('add_to_cart', { menuId: 'americano', qty: 1 });
check('HOT/ICE 둘 다 되는데 온도가 없으면 거절(되묻기)', x.r.ok === false && /HOT or ICE/.test(x.r.error) && x.sent.length === 0, JSON.stringify(x));
x = await run('add_to_cart', { menuId: 'lemonade', temp: 'HOT', qty: 1 });
check('ICE 전용 메뉴를 HOT으로 요청하면 조용히 ICE로 담지 않고 거절', x.r.ok === false && /only available/.test(x.r.error) && x.sent.length === 0, JSON.stringify(x));
x = await run('add_to_cart', { menuId: 'lemonade', qty: 2 });
check('ICE 전용 메뉴는 온도를 생략하면 ICE로 확정', x.sent[0]?.args.temp === 'ICE' && x.sent[0]?.args.qty === 2, JSON.stringify(x.sent));
x = await run('add_to_cart', { menuId: 'americano', temp: 'ICE', qty: 2, shot: '1', syrup: '9' });
check('옵션: 유효한 샷 추가는 전달, 없는 선택지(시럽 9)는 버림', JSON.stringify(x.sent[0]?.args.opts) === '{"shot":"1"}', JSON.stringify(x.sent));
x = await run('add_to_cart', { menuId: 'latte', temp: 'HOT', qty: 1, ice: '1' });
check('HOT에는 얼음 양(ICE 전용) 옵션을 붙이지 않음', !('ice' in (x.sent[0]?.args.opts || {})), JSON.stringify(x.sent));
x = await run('add_to_cart', { menuId: 'americano', temp: 'ICE', qty: 99 });
check('수량 99(한도 20 초과) → 거절, 키오스크 호출 없음', x.r.ok === false && x.sent.length === 0);
x = await run('add_to_cart', { menuId: 'americano', temp: 'ICE', qty: 0 });
check('수량 0/없음 → 1', x.sent[0]?.args.qty === 1);
x = await run('add_to_cart', { menuId: '아아', temp: 'ICE', qty: 1 });
check('별칭(아아)도 메뉴 id로 변환', x.sent[0]?.args.menuId === 'americano', JSON.stringify(x.sent));
x = await run('add_to_cart', { menuId: 'mega_001', temp: 'ICE', qty: 1 });
check('메가커피 메뉴 데이터(mega_001)도 사용 가능', x.sent[0]?.args.menuId === 'mega_001');
x = await run('add_to_cart', null);
check('인자가 객체가 아니어도 죽지 않음', x.r.ok === false);
x = await run('update_cart_quantity', { menuId: 'americano', qty: 99 });
check('수량 변경도 한도 초과는 거절', x.r.ok === false && x.sent.length === 0);
x = await run('update_cart_quantity', { menuId: 'ghost', qty: 1 });
check('수량 변경: 없는 메뉴 거절', x.r.ok === false && x.sent.length === 0);
x = await run('remove_from_cart', { menuId: 'ghost' });
check('삭제: 없는 메뉴 거절', x.r.ok === false && x.sent.length === 0);
x = await run('show_menu_list', { category: 'hack', sub: 'x', tags: ['커피', '<script>'], maxPrice: 'abc', query: 'q'.repeat(500), label: 'L'.repeat(500) });
const a = x.sent[0]?.args;
check('메뉴 목록 필터 값 정리(허용 목록 밖은 기본값, 길이 제한)', a.category === 'all' && a.sub === 'all' && JSON.stringify(a.tags) === '["커피"]' && a.maxPrice === 0 && a.query.length === 60 && a.label.length === 80, JSON.stringify(a).slice(0, 160));
x = await run('set_language', { lang: 'fr' });
check('지원하지 않는 언어(fr)는 en으로', x.sent[0]?.args.lang === 'en');
x = await run('set_order_mode', { mode: 'x' });
check('주문 방식 값 정리(dine 기본)', x.sent[0]?.args.mode === 'dine');
for (const n of ['get_cart', 'request_cancel_order', 'finish_ordering_to_confirm']) { x = await run(n, {}); check(`${n}는 키오스크에 그대로 전달`, x.sent[0]?.name === n); }
x = await run('format_disk', {});
check('알 수 없는 도구 거절', x.r.ok === false && x.sent.length === 0);

console.log('--- v6 catalog (the kiosk\'s own menu data) ---');
const { loadCatalog } = await import('../lib/catalog.js');
const v6 = await loadCatalog('v6');
const raw = JSON.parse(readFileSync(new URL('../public/v6/menu-data.json', import.meta.url), 'utf8'));
const run6 = async (name, args) => { sent.length = 0; const r = await K.runKioskTool(name, args, v6, { lang: 'ko' }, kiosk); return { r, sent: [...sent] }; };
check('v6 catalog = every product of public/v6/menu-data.json (same file the kiosk loads)', v6.menus.length === raw.products.length && v6.menus.every((m, i) => m.id === raw.products[i].id && m.name === raw.products[i].name), `${v6.menus.length}/${raw.products.length}`);
const am = v6.menus.find((m) => m.id === 'd100');
check('v6 prices come straight from sample_price (아메리카노 HOT 1,500 / ICE 2,000)', am.tempPrices.HOT === raw.products.find((p) => p.id === 'd100').sample_price.HOT && am.tempPrices.ICE === 2000);
check('v6 menus with no price in the data stay unpriced (nothing invented)', v6.menus.every((m) => (m.tempPrices ? Object.values(m.tempPrices) : [m.price]).every((v) => v === null || Number.isFinite(v))));
x = await run6('add_to_cart', { menuId: 'd100', temp: 'HOT', qty: 2, shot: '1', ice: '1' });
check('v6: HOT 샷 추가는 전달, ICE 전용 얼음 옵션은 HOT에서 제외', x.sent[0]?.args.opts?.shot === '1' && !('ice' in x.sent[0].args.opts) && x.sent[0].args.qty === 2, JSON.stringify(x.sent));
x = await run6('add_to_cart', { menuId: 'd100', qty: 1 });
check('v6: 온도 없이 아메리카노 → 거절', x.r.ok === false && x.sent.length === 0);
x = await run6('add_to_cart', { menuId: 'd019', temp: 'HOT', qty: 1 });
check('v6: ICE 전용 딸기라떼를 HOT으로 → 거절', x.r.ok === false && x.sent.length === 0);
x = await run6('add_to_cart', { menuId: 'd100', temp: 'ICE', qty: 10 });
check('v6: 키오스크 한도(9) 초과 수량 → 거절', x.r.ok === false && /at most 9/.test(x.r.error) && x.sent.length === 0, JSON.stringify(x));
x = await run6('add_to_cart', { menuId: 'mega_001', temp: 'ICE', qty: 1 });
check('v6: 128 목록에만 있는 id는 거절(키오스크에 없는 메뉴)', x.r.ok === false && x.sent.length === 0);
x = await run6('add_to_cart', { menuId: '감자빵', qty: 1 });
check('v6: 메뉴 이름으로도 찾음(감자빵, 온도 없음)', x.sent[0]?.args.menuId === 'f035' && x.sent[0].args.temp === null, JSON.stringify(x.sent));
x = await run6('show_menu_list', { category: 'goods' });
check('v6: show_menu_list category goods/new 허용', x.sent[0]?.args.category === 'goods');

console.log('--- error mapping / guard ---');
const ce = (m) => K.classifyError(new Error(m)).code;
check('오류 분류: 키 오류/권한/한도/모델/과부하', ce('API_KEY_INVALID') === 'AUTH' && ce('403 PERMISSION_DENIED') === 'AUTH' && ce('429 RESOURCE_EXHAUSTED') === 'QUOTA' && ce('404 model not found') === 'MODEL' && ce('503 UNAVAILABLE high demand') === 'MODEL_BUSY' && ce('boom') === 'UNKNOWN');
check('크레딧 소진(1011 prepayment credits are depleted)은 BILLING으로 구분, 한도(429)·키 오류와 다름', ce('Error 1011: Your prepayment credits are depleted. Please go to AI Studio') === 'BILLING' && ce('429 RESOURCE_EXHAUSTED quota') === 'QUOTA' && ce('API_KEY_INVALID') === 'AUTH');
check('오류 설명에서 키 값이 가려짐', !K.classifyError(new Error(`bad ${process.env.GEMINI_API_KEY}`)).detail.includes('TESTKEY'));
const req = (origin, host = 'kiosk.test') => ({ headers: { origin, host }, socket: { remoteAddress: '1.2.3.4' } });
check('출처 검사: Origin 없음 거절', G.originAllowed(req(undefined)) === false);
check('출처 검사: 같은 사이트 허용', G.originAllowed(req('https://kiosk.test')) === true);
check('출처 검사: 다른 사이트 거절', G.originAllowed(req('https://evil.example')) === false);
process.env.LIVE_ALLOWED_ORIGINS = 'https://extra.example';
check('출처 검사: 허용 목록에 추가한 사이트만 추가 허용', G.originAllowed(req('https://extra.example')) === true && G.originAllowed(req('https://extra.example.evil.com')) === false);
delete process.env.LIVE_ALLOWED_ORIGINS;
process.env.LIVE_MAX_PER_IP = '2'; process.env.LIVE_MAX_SESSIONS = '3'; process.env.LIVE_SESSIONS_PER_HOUR = '100';
const s1 = G.acquire('ip-a'), s2 = G.acquire('ip-a'), s3 = G.acquire('ip-a');
check('IP당 동시 세션 2개 제한', !!s1.release && !!s2.release && s3.reason === 'ip_busy');
const s4 = G.acquire('ip-b'), s5 = G.acquire('ip-c');
check('전체 동시 세션 제한(3개)', !!s4.release && s5.reason === 'busy', JSON.stringify(s5));
s1.release(); s1.release(); // idempotent
check('release는 여러 번 불러도 한 번만 반영', G.activeSessions() === 2, String(G.activeSessions()));
[s2, s4].forEach((s) => s.release?.());
process.env.LIVE_SESSIONS_PER_HOUR = '3';
check('시간당 세션 수 제한', G.acquire('ip-z').reason === 'hourly');
delete process.env.LIVE_MAX_PER_IP; delete process.env.LIVE_MAX_SESSIONS; delete process.env.LIVE_SESSIONS_PER_HOUR;

// ---------------------------------------------------------------- integration: real server + fake Gemini + a simulated kiosk
console.log('--- WebSocket protocol against the real server (fake Gemini) ---');
let port = 3900;
async function startServer(env = {}, preload = true) {
  const p = port++;
  const child = spawn('node', [...(preload ? ['--import', './scripts/fake-live.mjs'] : []), 'server.js'], { env: { ...process.env, PORT: String(p), GEMINI_API_KEY: 'FAKEKEY-for-tests-123456', FAKE_LIVE_CATALOG: 'ai128', ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  child.stdout.on('data', (d) => { out += d; }); child.stderr.on('data', (d) => { out += d; });
  for (let i = 0; i < 60 && !/UXPRESSO kiosk/.test(out); i++) await sleep(100);
  return { port: p, out: () => out, stop: () => child.kill() };
}
const openWs = (port, origin = `http://localhost:${port}`, headers = {}) => new Promise((resolve) => {
  const ws = new WebSocket(`ws://localhost:${port}/api/live?catalog=ai128`, { origin, headers, maxPayload: 1 << 20 });
  const msgs = [];
  ws.on('message', (d) => { try { msgs.push(JSON.parse(d.toString())); } catch {} });
  ws.on('open', () => resolve({ ws, msgs, ok: true }));
  ws.on('unexpected-response', (_, res) => resolve({ ok: false, status: res.statusCode }));
  ws.on('error', () => {});
});
const waitFor = async (fn, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = fn(); if (v) return v; await sleep(25); } return null; };

// a tiny stand-in for the kiosk: keeps a cart and answers every action like app.js does
function simKiosk(client, { answer = true } = {}) {
  const cart = []; const actions = [];
  const price = (id, temp) => { const m = menusData.menus.find((y) => y.id === id); return m.tempPrices && temp ? m.tempPrices[temp] : m.price; };
  const snap = () => ({ count: cart.reduce((s, l) => s + l.qty, 0), total: cart.reduce((s, l) => s + price(l.menuId, l.temp) * l.qty, 0), hasUnpriced: false, lines: cart.map((l) => ({ ...l })) });
  client.ws.on('message', (d) => {
    const m = JSON.parse(d.toString());
    if (m.type !== 'action') return;
    actions.push(m);
    if (!answer) return;
    let r = { ok: true };
    if (m.name === 'add_to_cart') { const hit = cart.find((l) => l.menuId === m.args.menuId && l.temp === m.args.temp && JSON.stringify(l.opts) === JSON.stringify(m.args.opts)); hit ? (hit.qty += m.args.qty) : cart.push({ ...m.args }); r.added = { name: menusData.menus.find((y) => y.id === m.args.menuId).name, qty: m.args.qty }; }
    if (m.name === 'update_cart_quantity') { const l = cart.find((y) => y.menuId === m.args.menuId); if (l) l.qty = m.args.qty; r.updated = { qty: m.args.qty }; }
    if (m.name === 'remove_from_cart') { const i = cart.findIndex((y) => y.menuId === m.args.menuId); if (i >= 0) cart.splice(i, 1); }
    if (m.name === 'show_menu_list') r.screenCount = 7;
    if (m.name === 'set_language') r.lang = m.args.lang;
    r.cart = snap();
    client.ws.send(JSON.stringify({ type: 'actionResult', id: m.id, result: r }));
  });
  return { cart, actions, snap };
}
const said = (c) => c.msgs.filter((m) => m.type === 'outputTranscript').map((m) => m.text).join(' ');
const say = async (c, text, expectSpeech = true) => { const before = c.msgs.length; c.ws.send(JSON.stringify({ type: 'text', text })); if (expectSpeech) await waitFor(() => c.msgs.slice(before).some((m) => m.type === 'turnComplete')); return c.msgs.slice(before); };

let srv = await startServer({ LIVE_MAX_PER_IP: '2' });
try {
  let r = await new Promise((resolve) => { const ws = new WebSocket(`ws://localhost:${srv.port}/api/live`); ws.on('unexpected-response', (_, res) => resolve({ status: res.statusCode })); ws.on('open', () => resolve({ status: 'open' })); ws.on('error', () => {}); });
  check('Origin 헤더가 없는 접속 거절(403)', r.status === 403, JSON.stringify(r));
  r = await openWs(srv.port, 'https://evil.example');
  check('다른 사이트에서의 접속 거절(403)', r.status === 403, JSON.stringify(r));
  r = await new Promise((resolve) => { const ws = new WebSocket(`ws://localhost:${srv.port}/other`, { origin: `http://localhost:${srv.port}` }); ws.on('unexpected-response', (_, res) => resolve({ status: res.statusCode })); ws.on('open', () => resolve({ status: 'open' })); ws.on('error', () => {}); });
  check('/api/live 이외 경로의 업그레이드는 404', r.status === 404, JSON.stringify(r));

  const A = await openWs(srv.port);
  check('같은 사이트 접속 허용 + ready 수신', A.ok && !!(await waitFor(() => A.msgs.find((m) => m.type === 'ready'))), JSON.stringify(A.msgs));
  const ka = simKiosk(A);
  A.ws.send(JSON.stringify({ type: 'context', init: true, lang: 'ko', screen: 'menu', mode: 'dine', cartCount: 0, hasUnpriced: false }));
  await waitFor(() => /init prompt/.test(srv.out()));
  check('시작 시 안내 프롬프트가 모델에 전달됨', /init prompt received/.test(srv.out()));
  check('init 안내 후 AI가 고객 발화 없이 먼저 말함(출력 자막·음성 전달)', await waitFor(() => A.msgs.find((m) => m.type === 'outputTranscript' && /어서 오세요/.test(m.text))) && A.msgs.some((m) => m.type === 'audio'));
  check('서버 로그에 Gemini 첫 오디오 수신 시각 기록(내용 없이 카운터만)', /first audio from Gemini after \d+ms/.test(srv.out()) && !/어서 오세요/.test(srv.out().replace(/\[fake-live\][^\n]*/g, '')));
  A.ws.send(JSON.stringify({ type: 'context', init: true, lang: 'ko', screen: 'menu', mode: 'dine', cartCount: 0, hasUnpriced: false }));
  await sleep(300);
  check('세션당 첫 안내는 한 번만(init를 다시 보내도 중복 안내 없음)', (srv.out().match(/init prompt received/g) || []).length === 1, String((srv.out().match(/init prompt received/g) || []).length));
  check('모델에 도구 11개(수량 변경·취소·장바구니 조회 포함)와 메뉴 128종 프롬프트 전달', /tools=set_language,set_order_mode,show_menu_list,open_menu_detail,add_to_cart,update_cart_quantity,remove_from_cart,get_cart,request_cancel_order,finish_ordering_to_confirm/.test(srv.out()) && /sysPromptChars=\d{5,}/.test(srv.out()), srv.out().split('\n').find((l) => /connect model/.test(l)));

  let m = await say(A, '아아 두 잔 주세요');
  const act = ka.actions.at(-1);
  check('음성/텍스트 주문 → 키오스크에 add_to_cart(americano, ICE, 2) 전달', act?.name === 'add_to_cart' && act.args.menuId === 'americano' && act.args.temp === 'ICE' && act.args.qty === 2, JSON.stringify(act));
  const snap1 = ka.snap();
  check('키오스크 장바구니 = 2잔', snap1.count === 2 && ka.cart.length === 1);
  const speech1 = said(A);
  check('AI가 한 말(장바구니 2개·합계)이 키오스크의 실제 장바구니와 일치', speech1.includes(`장바구니 ${snap1.count}개`) && speech1.includes(`합계 ${snap1.total}원`), `${speech1} | cart=${JSON.stringify({ c: snap1.count, t: snap1.total })}`);
  check('음성 응답 오디오와 턴 종료 이벤트 수신', m.some((x) => x.type === 'audio' && x.data.length > 100) && m.some((x) => x.type === 'turnComplete'));

  m = await say(A, '아아 하나랑 카페라떼 뜨거운 거');
  const adds = ka.actions.filter((a2) => a2.name === 'add_to_cart');
  check('복수 메뉴 주문 → 도구 2회 호출(아메리카노 ICE + 카페라떼 HOT)', adds.length === 3 && adds.at(-1).args.menuId === 'latte' && adds.at(-1).args.temp === 'HOT' && adds.at(-2).args.menuId === 'americano', JSON.stringify(adds.map((a2) => a2.args)));
  const snap2 = ka.snap();
  check('복수 주문 후에도 AI 발언과 실제 장바구니 일치(합계)', said(A).includes(`합계 ${snap2.total}원`) && snap2.count === 4, `${snap2.count}/${snap2.total} | ${said(A).slice(-60)}`);

  await say(A, '수량을 3잔으로 바꿔줘');
  check('수량 변경 → update_cart_quantity 전달 + 실제 반영', ka.actions.at(-1).name === 'update_cart_quantity' && ka.cart.find((l) => l.menuId === 'americano').qty === 3);
  await say(A, '하나 빼줘');
  check('삭제 → remove_from_cart 전달 + 실제 반영', ka.actions.at(-1).name === 'remove_from_cart' && !ka.cart.some((l) => l.menuId === 'americano'));
  await say(A, '주문 취소해줘');
  check('주문 취소 → request_cancel_order 전달(직접 비우지 않고 화면 확인 대기)', ka.actions.at(-1).name === 'request_cancel_order' && ka.cart.length >= 1);
  await say(A, '3,000원 이하 커피 보여줘');
  check('메뉴 검색 → show_menu_list(coffee, maxPrice 3000) + 실제 화면 개수(7)를 AI가 말함', ka.actions.at(-1).name === 'show_menu_list' && ka.actions.at(-1).args.maxPrice === 3000 && /7개 메뉴/.test(said(A)), said(A).slice(-50));

  const nBefore = ka.actions.length;
  await say(A, '딸기라떼 주세요');
  check('존재하지 않는 메뉴: 서버가 키오스크 호출 없이 거절, AI는 실패를 말함', ka.actions.length === nBefore && /처리하지 못했어요/.test(said(A)), said(A).slice(-60));
  await say(A, '온도 없이 아메리카노 주세요');
  check('온도 누락 주문: 키오스크 호출 없이 거절(되묻기 유도)', ka.actions.length === nBefore && /HOT or ICE/.test(said(A)));
  await say(A, '아아 스물세 잔 주세요');
  check('수량 23(한도 초과) → 키오스크 호출 없이 거절', ka.actions.length === nBefore && /처리하지 못했어요/.test(said(A)));

  const B = await openWs(srv.port); await waitFor(() => B.msgs.find((m2) => m2.type === 'ready'));
  const C = await openWs(srv.port);
  check('같은 IP의 3번째 동시 접속 거절(429)', C.ok === false && C.status === 429, JSON.stringify(C.status));
  B.ws.close(); await sleep(150);
  const D = await openWs(srv.port);
  check('세션이 끝나면 슬롯이 반환되어 다시 접속 가능', D.ok === true);
  D.ws.close(); A.ws.close(); await sleep(400); // free every slot before the next checks

  // long text is cut, oversized frames are refused
  await sleep(400);
  const E1 = await openWs(srv.port); await waitFor(() => E1.msgs.find((m2) => m2.type === 'ready'));
  E1.ws.send(JSON.stringify({ type: 'text', text: '가'.repeat(1000) })); await sleep(300);
  const inLine = srv.out().split('\n').filter((l) => /\[fake-live\] input "가/.test(l)).pop() || '';
  check('텍스트는 200자로 잘려 모델에 전달', inLine.replace(/.*input "|"$/g, '').length === 200, String(inLine.length));
  const closed = new Promise((res) => E1.ws.on('close', (code) => res(code)));
  E1.ws.send(Buffer.alloc(300 * 1024, 65));
  check('256KB 초과 메시지는 연결 종료', (await Promise.race([closed, sleep(2000).then(() => 'timeout')])) !== 'timeout');

  // too many messages per second
  await sleep(400);
  const F = await openWs(srv.port); await waitFor(() => F.msgs.find((m2) => m2.type === 'ready'));
  for (let i = 0; i < 80; i++) F.ws.send(JSON.stringify({ type: 'audio', data: 'AAAA' }));
  check('초당 메시지 폭주 시 세션 종료', !!(await waitFor(() => F.msgs.find((m2) => m2.type === 'closed' && m2.reason === 'too_fast'), 2000)));

  // session errors reach the browser as codes only (no key, no raw message)
  await sleep(400);
  const G1 = await openWs(srv.port); await waitFor(() => G1.msgs.find((m2) => m2.type === 'ready'));
  G1.ws.send(JSON.stringify({ type: 'text', text: 'FAKE_ERROR_AUTH' }));
  const er = await waitFor(() => G1.msgs.find((m2) => m2.type === 'error'));
  check('모델 오류는 코드(AUTH)만 브라우저로 전달', er?.code === 'AUTH' && Object.keys(er).sort().join() === 'code,type', JSON.stringify(er));
  { const B1 = await openWs(srv.port); await waitFor(() => B1.msgs.find((m2) => m2.type === 'ready'));
    B1.ws.send(JSON.stringify({ type: 'text', text: 'FAKE_ERROR_BILLING' }));
    const eb = await waitFor(() => B1.msgs.find((m2) => m2.type === 'error'));
    check('크레딧 소진 오류는 코드(BILLING)만 전달(원문·계정 안내는 브라우저로 안 감)', eb?.code === 'BILLING' && Object.keys(eb).sort().join() === 'code,type' && !JSON.stringify(B1.msgs).includes('prepayment'), JSON.stringify(eb));
    try { B1.ws.close(); } catch {} await sleep(300);
    const B2 = await openWs(srv.port); await waitFor(() => B2.msgs.find((m2) => m2.type === 'ready'));
    B2.ws.send(JSON.stringify({ type: 'text', text: 'FAKE_CLOSE_BILLING' }));
    const ec = await waitFor(() => B2.msgs.find((m2) => m2.type === 'error'));
    check('Gemini가 사유와 함께 연결을 닫는 경우(1011)도 BILLING으로 전달(일반 끊김 아님)', ec?.code === 'BILLING' && !B2.msgs.some((m2) => m2.type === 'closed'), JSON.stringify(B2.msgs.filter((m2) => m2.type !== 'audio')));
    try { B2.ws.close(); } catch {} await sleep(300); }
  check('모델 오류 뒤 서버가 세션을 닫고 슬롯 반환', await new Promise((res) => { if (G1.ws.readyState === WebSocket.CLOSED) res(true); G1.ws.on('close', () => res(true)); setTimeout(() => res(false), 2000); }));
  check('서버 로그에 API 키 값이 없음', !srv.out().includes('FAKEKEY-for-tests') && !srv.out().includes('TESTKEY'));

  // kiosk that never answers: the model must be told the change was NOT confirmed
  await sleep(400);
  const H = await openWs(srv.port); await waitFor(() => H.msgs.find((m2) => m2.type === 'ready'));
  simKiosk(H, { answer: false });
  H.ws.send(JSON.stringify({ type: 'text', text: '아아 하나 주세요' }));
  const slow = await waitFor(() => /did not respond/.test(said(H)) || H.msgs.some((m2) => m2.type === 'turnComplete'), 8000);
  check('키오스크가 5초 안에 답이 없으면 AI에게 "반영 안 됨"으로 전달', !!slow && /처리하지 못했어요/.test(said(H)) && /did not respond/.test(said(H)), said(H));
  H.ws.close();

  // health endpoint
  const h1 = await (await fetch(`http://localhost:${srv.port}/api/live/health`)).text();
  const hj = JSON.parse(h1);
  check('health: 키 값은 없고 설정 여부·모델·제한만 표시', !h1.includes('FAKEKEY') && hj.keyConfigured === true && hj.wsPath === '/api/live' && typeof hj.model === 'string' && hj.limits.maxSeconds === 300, h1.slice(0, 200));
  check('health: 모델 존재 여부를 Google에 확인(가짜 키라 key_rejected가 정상)', hj.modelStatus?.checked === true, JSON.stringify(hj.modelStatus));
  let limited = 0; for (let i = 0; i < 14; i++) if ((await fetch(`http://localhost:${srv.port}/api/live/health`)).status === 429) limited++;
  check('health: 요청 횟수 제한', limited >= 1, String(limited));
} finally { srv.stop(); }

console.log('--- other server configurations ---');
srv = await startServer({ LIVE_ENABLED: 'false' });
try {
  const r = await openWs(srv.port);
  check('LIVE_ENABLED=false → 음성 접속 404, 키오스크 화면은 정상', r.ok === false && r.status === 404 && (await fetch(`http://localhost:${srv.port}/`)).status === 200, JSON.stringify(r));
  check('LIVE_ENABLED=false → health에 enabled:false', (await (await fetch(`http://localhost:${srv.port}/api/live/health`)).json()).enabled === false);
} finally { srv.stop(); }

srv = await startServer({ GEMINI_API_KEY: '' }, false);
try {
  const r = await openWs(srv.port);
  const e = r.ok ? await waitFor(() => r.msgs.find((m) => m.type === 'error')) : null;
  check('키가 없으면 MISSING_API_KEY 코드만 전달하고 연결 종료', e?.code === 'MISSING_API_KEY', JSON.stringify(r.ok ? r.msgs : r));
  const hj = await (await fetch(`http://localhost:${srv.port}/api/live/health`)).json();
  check('키가 없으면 health가 keyConfigured:false', hj.keyConfigured === false && hj.modelStatus.checked === false);
  check('키가 없어도 기존 키오스크 API는 정상', (await fetch(`http://localhost:${srv.port}/api/menus/americano`)).status === 200);
} finally { srv.stop(); }

srv = await startServer({ FAKE_LIVE_MODE: 'connect_fail' });
try {
  const r = await openWs(srv.port);
  const e = r.ok ? await waitFor(() => r.msgs.find((m) => m.type === 'error')) : null;
  check('Gemini 연결 실패(403)는 AUTH 코드로 전달', e?.code === 'AUTH', JSON.stringify(r.ok ? r.msgs : r));
} finally { srv.stop(); }

srv = await startServer({ LIVE_MAX_SECONDS: '2', LIVE_IDLE_SECONDS: '600' });
try {
  const r = await openWs(srv.port); await waitFor(() => r.msgs.find((m) => m.type === 'ready'));
  const c = await waitFor(() => r.msgs.find((m) => m.type === 'closed'), 5000);
  check('최대 세션 시간(2초로 설정)이 지나면 종료 안내 후 닫힘', c?.reason === 'max_duration', JSON.stringify(r.msgs.slice(-2)));
} finally { srv.stop(); }

console.log(`\n${pass} passed, ${fail} failed  (FAKE Gemini Live — not a real Gemini result)`);
process.exit(fail ? 1 : 0);
