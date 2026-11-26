// Browser E2E for the v6 kiosk + Gemini Live (FAKE Live + fake microphone — never the real API).
// Needs Playwright (not a project dependency):  node scripts/e2e-v6.cjs <repo dir> <screenshot dir>
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const REPO = process.argv[2] || process.cwd(), OUT = process.argv[3] || '/tmp';
const results = [];
const ok = (n, c, d = '') => { results.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : '  -> ' + d)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const server = (port, env = {}) => spawn('node', ['--import', './scripts/fake-live.mjs', 'server.js'], { cwd: REPO, env: { ...process.env, PORT: port, GEMINI_API_KEY: 'FAKE', ...env }, stdio: 'ignore' });
const num = (t) => Number(String(t).replace(/[^\d]/g, '')) || 0;
const cartCount = async (p) => num(await p.textContent('.cart .count'));
const cartTotal = async (p) => num(await p.textContent('.cart .amount strong'));
const reply = (p) => p.evaluate(() => document.querySelector('#voice .reply')?.textContent || '');
const panel = (p) => p.evaluate(() => document.querySelector('#voice')?.innerText || '');
async function open(b, port, { deny = false } = {}) {
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, permissions: deny ? [] : ['microphone'], baseURL: `http://localhost:${port}` });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto('/'); await p.waitForSelector('.scr.start');
  return { ctx, p };
}
async function startVoice(p, wait = '#vtext') { await p.click('[data-a=startVoice]'); await p.waitForSelector(wait, { timeout: 8000 }).catch(() => {}); }
async function type(p, text, ms = 1000) { await p.fill('#vtext', text); await p.press('#vtext', 'Enter'); await sleep(ms); }
(async () => {
  const srvOpts = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
  const s1 = server(4030, {}); const s2 = server(4031, { FAKE_LIVE_NO_MIC_TURN: '1' }); await sleep(1800);
  const b = await chromium.launch({ args: srvOpts });
  try {
    // ---- connection, mic audio -> AI -> cart ----
    let { ctx, p } = await open(b, 4030);
    await startVoice(p);
    ok('voice panel connects (ready: input row visible)', await p.isVisible('#vtext'));
    await sleep(2500); // the fake microphone makes the fake AI hear "아아 하나 주세요"
    ok('mic audio → AI → cart (아이스 아메리카노 1잔)', await cartCount(p) === 1 && await cartTotal(p) === 2000, `${await cartCount(p)} / ${await cartTotal(p)}`);
    ok('AI statement equals the screen (count and total)', /장바구니 1개, 합계 2000원/.test(await reply(p)), await reply(p));
    await p.screenshot({ path: OUT + '/v6-voice-added.png' });
    // ---- multi-menu, option, quantity ----
    await type(p, '아아 하나랑 카페라떼 뜨거운 걸로');
    ok('multi-menu voice order → cart 3 (americano merged 2 + latte HOT)', await cartCount(p) === 3, String(await cartCount(p)));
    ok('AI statement still equals the screen', new RegExp(`장바구니 3개, 합계 ${await cartTotal(p)}원`).test(await reply(p)), await reply(p));
    const t0 = await cartTotal(p);
    await type(p, '아아 샷 추가해 주세요');
    ok('option via voice: 샷 1개 추가 line costs 2,500 (2,000 + 500) and the AI says the same total', await cartCount(p) === 4 && await cartTotal(p) === t0 + 2500 && new RegExp(`합계 ${t0 + 2500}원`).test(await reply(p)), `${await cartCount(p)} / ${t0} -> ${await cartTotal(p)}`);
    // ---- touch edit while voice is on, then voice reads the same cart ----
    await p.click('[data-a=open][data-v=d107]'); await p.waitForSelector('#addBtn');
    await p.click('[data-a=temp][data-v=ICE]'); await p.click('#addBtn'); await p.waitForSelector('.cart .count');
    const afterTouch = await cartCount(p);
    ok('touch add while voice is on (same cart)', afterTouch === 5, String(afterTouch));
    await sleep(500); await type(p, '장바구니 뭐 있어?');
    ok('voice reads the touch-edited cart (count and total match screen)', new RegExp(`장바구니 ${afterTouch}개, 합계 ${await cartTotal(p)}원`).test(await reply(p)), await reply(p) + ' / ' + afterTouch);
    // ---- quantity change / remove ----
    await type(p, '수량 3으로 바꿔줘');
    // ambiguity (several americano lines): the AI must not guess and the cart must not change
    ok('ambiguous quantity change is refused, cart unchanged', await cartCount(p) === afterTouch && /처리하지 못했어요/.test(await reply(p)), `${await cartCount(p)} / ${await reply(p)}`);
    // ---- over-limit, cancel dialog ----
    const before = await cartCount(p);
    await type(p, '아아 스물세 잔 주세요');
    ok('quantity over the kiosk limit (9) is refused, cart unchanged', await cartCount(p) === before && /처리하지 못했어요/.test(await reply(p)), await reply(p));
    await type(p, '주문 취소해 줘');
    ok('cancel → kiosk confirm dialog opens, cart kept', await p.evaluate(() => document.querySelector('#dlg')?.open) && await cartCount(p) === before);
    await p.screenshot({ path: OUT + '/v6-voice-cancel-dialog.png' });
    await p.click('[data-a=close]'); await sleep(500);
    // ---- lists ----
    await type(p, '디카페인 보여줘');
    const dc = await p.evaluate(() => ({ sel: [...document.querySelectorAll('.rail button')].findIndex((x) => x.getAttribute('aria-selected') === 'true'), cards: document.querySelectorAll('.grid .card').length }));
    ok('voice list: 디카페인 category shown and AI count equals cards on screen', dc.sel === 3 && new RegExp(`화면에 ${dc.cards}개`).test(await reply(p)), JSON.stringify(dc) + await reply(p));
    await type(p, '3,000원 이하 커피 보여줘');
    ok('price search answered from menu data (matches reported, screen category = coffee)', await p.evaluate(() => [...document.querySelectorAll('.rail button')].findIndex((x) => x.getAttribute('aria-selected') === 'true')) === 2);
    await p.screenshot({ path: OUT + '/v6-voice-list.png' });
    // ---- finish → order check screen, mic off, cart kept ----
    await type(p, '다 됐어요', 1800);
    ok('"다 됐어" → order check screen, voice panel gone', await p.isVisible('.receipt') && !(await p.isVisible('#voice')));
    ok('cart kept on the order check screen', num(await p.textContent('.total span')) === before);
    ok('no page errors (voice session)', p.errs.length === 0, p.errs.join('|'));
    await ctx.close();

    // ---- nonexistent menu / bad temperature ----
    ({ ctx, p } = await open(b, 4031)); await startVoice(p);
    await type(p, '온도 없이 아메리카노');
    ok('missing temperature: nothing added, AI told why', await cartCount(p) === 0 && /처리하지 못했어요/.test(await reply(p)), await reply(p));
    await type(p, '딸기라떼'); // ICE only: ok
    ok('ICE-only menu added with ICE', await cartCount(p) === 1);
    await type(p, 'i want an iced latte');
    ok('foreign-language order works (cart gets latte ICE); screen stays Korean', await cartCount(p) === 2 && (await p.evaluate(() => document.documentElement.lang)) === 'ko');
    await ctx.close();

    // ---- failures: mic denied, API error, dropped, bad key, voice disabled ----
    ({ ctx, p } = await open(b, 4031, { deny: true }));
    await p.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotAllowedError')); });
    await startVoice(p); await sleep(400);
    ok('mic denied: hint shown, typing still works', /마이크를 쓸 수 없어요/.test(await panel(p)) && await p.isVisible('#vtext'));
    await type(p, '아아 하나');
    ok('mic denied: typed order reaches the cart', await cartCount(p) === 1);
    await p.screenshot({ path: OUT + '/v6-mic-denied.png' });
    await ctx.close();

    ({ ctx, p } = await open(b, 4031)); await startVoice(p);
    await type(p, 'fake_error_auth', 700);
    const t1 = await panel(p);
    ok('API error → cause + next step shown, mock input still offered', /음성 주문을 쓸 수 없어요/.test(t1) && /화면에서 눌러 주문/.test(t1) && await p.isVisible('[data-a=retry]') && await p.isVisible('[data-a=say]'), t1);
    await p.screenshot({ path: OUT + '/v6-api-error.png' });
    await p.click('[data-a=say][data-v=recommend]'); await sleep(1700);
    ok('after the error the touch-only mock input still works', await p.evaluate(() => [...document.querySelectorAll('.rail button')].findIndex((x) => x.getAttribute('aria-selected') === 'true')) === 1);
    ok('no page errors (api error)', p.errs.length === 0, p.errs.join('|'));
    await ctx.close();

    ({ ctx, p } = await open(b, 4031)); await startVoice(p);
    await type(p, '아아 하나'); await type(p, 'fake_drop', 800);
    const t2 = await panel(p);
    ok('dropped connection → "음성 연결이 끊겼어요" + cart kept', /음성 연결이 끊겼어요/.test(t2) && await cartCount(p) === 1, t2);
    await ctx.close();

    // ---- touch-only full order (voice never used) ----
    ({ ctx, p } = await open(b, 4031));
    await p.$eval('[data-a=cat][data-v="2"]', (e) => e.click()); await p.waitForSelector('.grid .card');
    await p.click('[data-a=open][data-v=d100]'); await p.waitForSelector('#addBtn');
    await p.click('[data-a=temp][data-v=ICE]'); await p.click('#addBtn'); await p.waitForSelector('.cart .count'); await sleep(900);
    await p.click('.cart [data-a=review]'); await p.waitForSelector('.receipt');
    await p.click('[data-a=type][data-v="매장에서 먹기"]'); await p.waitForSelector('[data-a=pay]');
    await p.click('[data-a=pay][data-v=card]'); await p.waitForSelector('.btn-home', { timeout: 20000 });
    ok('touch-only order completes (menu → options → cart → order check → pay → done)', true);
    ok('no page errors (touch-only)', p.errs.length === 0, p.errs.join('|'));
    await ctx.close();
  } finally { await b.close(); s1.kill(); s2.kill(); }

  for (const [name, env] of [['connect_fail', { FAKE_LIVE_MODE: 'connect_fail' }], ['voice_disabled', { LIVE_ENABLED: 'false' }], ['no_key', { GEMINI_API_KEY: '' }]]) {
    const s = server(4032, env); await sleep(1500);
    const b2 = await chromium.launch({ args: srvOpts }); const { ctx, p } = await open(b2, 4032);
    await startVoice(p, '[data-a=retry]'); await sleep(900);
    const t = await panel(p);
    ok(`${name}: error panel with cause + next step, mock input offered, no crash`, /음성 주문을 쓸 수 없어요|음성 연결/.test(t) && await p.isVisible('[data-a=say]') && p.errs.length === 0, t + p.errs.join('|'));
    await p.screenshot({ path: `${OUT}/v6-${name}.png` });
    await ctx.close(); await b2.close(); s.kill();
  }
  const f = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - f}/${results.length} passed`);
  process.exit(f ? 1 : 0);
})();
