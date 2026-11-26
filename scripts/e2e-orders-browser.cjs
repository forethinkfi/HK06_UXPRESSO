// Browser E2E for order saving (needs Playwright, which is NOT a dependency of this project):
//   node scripts/e2e-orders-browser.cjs [screenshotDir]      (starts its own server + a FAKE Supabase; never contacts the real one)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const ROOT = path.resolve(__dirname, '..'), OUT = process.argv[2];
const KEY = 'sb_secret_TESTKEY-e2e', FAKE = 54331, PORT = 54332, PORT_OFF = 54333;
let pass = 0, fail = 0;
const ok = (n, c, d = '') => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : '  -> ' + d)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fakeCtl = (p, m = 'GET') => fetch(`http://127.0.0.1:${FAKE}${p}`, { method: m }).then((r) => r.json());
const UUIDRE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const shot = (p, n) => OUT && p.screenshot({ path: path.join(OUT, n + '.png') });

async function main() {
  const { startFakeSupabase } = await import('./fake-supabase.mjs');
  const fake = await startFakeSupabase(FAKE, KEY);
  const run = (port, env) => spawn('node', ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: port, LIVE_ENABLED: 'false', ...env }, stdio: 'ignore' });
  const srv = run(PORT, { SUPABASE_URL: `http://127.0.0.1:${FAKE}`, SUPABASE_SERVICE_ROLE_KEY: KEY });
  const off = run(PORT_OFF, { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '' });
  await sleep(1300);
  const b = await chromium.launch();
  const open = async (port) => {
    const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, baseURL: `http://localhost:${port}` });
    const p = await ctx.newPage(); p.errs = []; p.pays = 0; p.orderCalls = 0;
    p.on('pageerror', (e) => p.errs.push(e.message));
    p.on('request', (r) => { if (r.url().endsWith('/api/pay') && r.method() === 'POST') p.pays++; if (r.url().endsWith('/api/orders') && r.method() === 'POST') p.orderCalls++; });
    await p.goto('/'); await p.waitForSelector('.screen');
    return p;
  };
  const touchAdd = (p, id, temp, opts = {}, qty = 1) => p.evaluate(({ id, temp, opts, qty }) => { openDetail(id); S.dtl.temp = temp; S.dtl.opts = { ...opts }; S.dtl.qty = qty; render(); document.querySelector('[data-act="addCart"]').click(); }, { id, temp, opts, qty });
  const toPayAndPay = async (p, method = 'card') => {
    await p.evaluate(() => go('cart')); await p.click('[data-act="toConfirm"]'); await p.click('[data-act="toPay"]');
    await p.click(`[data-act="selMethod"][data-v="${method}"]`); await p.click('[data-act="payNow"]');
  };
  const last = async () => { const s = await fakeCtl('/__state'); return { s, o: s.orders.at(-1)?.record }; };

  // 1) touch, one item
  await fakeCtl('/__reset', 'POST');
  let p = await open(PORT);
  await p.evaluate(() => { S.mode = 'dine'; go('menu'); });
  const sid1 = await p.evaluate(() => S.sid);
  await touchAdd(p, 'americano', 'ICE');
  await toPayAndPay(p);
  await p.waitForSelector('.screen.done .no', { timeout: 8000 });
  let no = await p.textContent('.screen.done .no');
  let { s, o } = await last();
  ok('터치 주문: 서버 저장 후 A-001 표시', no.trim() === 'A-001', no);
  ok('터치 주문: channel=touch, dine_in, 세션 UUID 저장, 결제키=idempotency_key', o.order_channel === 'touch' && o.order_type === 'dine_in' && o.customer_session_id === sid1 && UUIDRE.test(sid1) && UUIDRE.test(o.idempotency_key), JSON.stringify(o));
  ok('저장 성공 시 데모 문구가 없고 장바구니가 비워짐', (await p.locator('[role=note]').count()) === 0 && (await p.evaluate(() => S.cart.length)) === 0);
  await shot(p, '01-done-saved');
  await p.click('[data-act="reset"]'); await p.waitForSelector('.screen');
  ok('다음 주문은 새 고객 세션 UUID', (await p.evaluate(() => S.sid)) !== sid1);

  // 2) voice (Gemini tools -> same cart)
  await p.evaluate(() => { applyLiveAction('set_order_mode', { mode: 'take' }); applyLiveAction('add_to_cart', { menuId: 'latte', temp: 'HOT', qty: 2 }); });
  await toPayAndPay(p);
  await p.waitForSelector('.screen.done .no', { timeout: 8000 });
  ({ o } = await last());
  no = await p.textContent('.screen.done .no');
  ok('음성 주문: channel=voice, takeout, A-002', o.order_channel === 'voice' && o.order_type === 'takeout' && no.trim() === 'A-002', JSON.stringify([o.order_channel, o.order_type, no]));

  // 3) mixed: voice add + touch quantity change
  await p.click('[data-act="reset"]'); await p.waitForSelector('.screen');
  await p.evaluate(() => { S.mode = 'dine'; applyLiveAction('add_to_cart', { menuId: 'americano', temp: 'ICE', qty: 1 }); go('cart'); });
  await p.click('[data-act="cq"][data-v="1"]');
  await toPayAndPay(p);
  await p.waitForSelector('.screen.done .no', { timeout: 8000 });
  ({ o } = await last());
  ok('혼합 주문(음성 담기 + 터치 수량 변경): channel=mixed, 수량 2', o.order_channel === 'mixed' && o.items[0].quantity === 2, JSON.stringify(o));

  // 4) several lines with options (touch)
  await p.click('[data-act="reset"]'); await p.waitForSelector('.screen');
  await p.evaluate(() => { S.mode = 'dine'; go('menu'); });
  await touchAdd(p, 'americano', 'ICE', { shot: '1', syrup: '1' }, 2);
  await touchAdd(p, 'latte', 'HOT', {}, 1);
  await toPayAndPay(p, 'payco');
  await p.waitForSelector('.screen.done .no', { timeout: 8000 });
  ({ o } = await last());
  const li = o.items.find((i) => i.menu_id === 'americano');
  ok('복수 메뉴: 2줄 저장, 옵션 스냅샷(그룹명·선택지명·가격) 포함', o.items.length === 2 && li.quantity === 2 && li.options.length === 2 && li.options.every((x) => x.group_label && x.choice_label && x.price === 500), JSON.stringify(o.items));
  ok('화면 합계와 저장된 total_price 일치', await p.evaluate((t) => S.order.final === t, o.total_price), String(o.total_price));

  // 5) save failure: payment is NOT repeated, cart kept, no number shown, retry saves once
  await p.click('[data-act="reset"]'); await p.waitForSelector('.screen');
  const before = (await fakeCtl('/__state')).orders.length;
  await fakeCtl('/__fail?n=3', 'POST');
  await p.evaluate(() => { S.mode = 'dine'; go('menu'); });
  await touchAdd(p, 'americano', 'ICE');
  const paysBefore = p.pays;
  await toPayAndPay(p);
  await p.waitForFunction(() => S.pay.phase === 'saveFail', null, { timeout: 15000 });
  ok('저장 실패: 접수 완료/주문번호를 보여주지 않고 오류 안내(원인+해결)', (await p.locator('.screen.done .no').count()) === 0 && /결제는 이미 완료/.test(await p.textContent('.screen')) && /다시 시도/.test(await p.textContent('.screen')));
  ok('저장 실패: 장바구니·결제키 유지, DB 저장 0건 증가', (await p.evaluate(() => S.cart.length)) === 1 && (await fakeCtl('/__state')).orders.length === before);
  await shot(p, '02-save-failed');
  await p.click('[data-act="retrySave"]');
  await p.waitForSelector('.screen.done .no', { timeout: 8000 });
  ok('재시도 성공: 번호 표시, 결제(/api/pay)는 한 번만 호출됨', p.pays - paysBefore === 1 && (await fakeCtl('/__state')).orders.length === before + 1, `pays=${p.pays - paysBefore}`);
  ok('재시도 성공 후 장바구니 비워짐', (await p.evaluate(() => S.cart.length)) === 0);

  // 6) reload while unconfirmed -> background resend, stored once
  await p.click('[data-act="reset"]'); await p.waitForSelector('.screen');
  const n6 = (await fakeCtl('/__state')).orders.length;
  await fakeCtl('/__fail?n=3', 'POST');
  await p.evaluate(() => { S.mode = 'take'; go('menu'); });
  await touchAdd(p, 'latte', 'ICE');
  await toPayAndPay(p);
  await p.waitForFunction(() => S.pay.phase === 'saveFail', null, { timeout: 15000 });
  await p.reload(); await p.waitForSelector('.screen'); await sleep(1000);
  ok('새로고침 후 미확정 주문이 같은 키로 다시 전송되어 1건만 저장', (await fakeCtl('/__state')).orders.length === n6 + 1);
  ok('콘솔 오류 없음', p.errs.length === 0, p.errs.join('|'));

  // 7) dev mode without env: demo behaviour, never reported as saved
  const q = await open(PORT_OFF);
  await q.evaluate(() => { S.mode = 'dine'; go('menu'); });
  await touchAdd(q, 'americano', 'ICE');
  await toPayAndPay(q);
  await q.waitForSelector('.screen.done .no', { timeout: 8000 });
  ok('Supabase 환경변수 없음: 데모 주문 + "저장되지 않았어요" 안내 표시', (await q.locator('[role=note]').count()) === 1 && /저장되지 않았어요/.test(await q.textContent('[role=note]')));
  await shot(q, '03-done-demo');
  await b.close(); srv.kill(); off.kill(); fake.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
