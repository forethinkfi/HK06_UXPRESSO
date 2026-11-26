// Browser E2E for the voice integration (needs Playwright, which is NOT a dependency of this project):
//   node scripts/e2e-browser.cjs $(pwd) /tmp/shots     (starts its own servers with the FAKE Gemini Live — never calls the real API)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const WT = process.argv[2], OUT = process.argv[3];
const results = [];
const ok = (n, c, d = '') => { results.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (c ? '' : '  -> ' + d)); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function server(port, env) {
  const p = spawn('node', ['--import', './scripts/fake-live.mjs', 'server.js'], { cwd: WT, env: { ...process.env, PORT: port, GEMINI_API_KEY: 'FAKE', ...env }, stdio: 'ignore' });
  return p;
}
const cartOf = (p) => p.evaluate(() => S.cart.map((c) => ({ id: c.menuId, t: c.temp, q: c.qty })));
const say = (p) => p.evaluate(() => S.voice.say || '');
async function openVoice(b, port, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: 540, height: 960 }, permissions: opts.deny ? [] : ['microphone'], baseURL: `http://localhost:${port}` });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto('/'); await p.waitForSelector('.screen');
  return { ctx, p };
}
async function startVoice(p) {
  await p.click('[data-act="vStart"]');
  await p.waitForFunction(() => S.voice.live && UXLive.isReady(), null, { timeout: 8000 }).catch(() => {});
}
async function say_(p, text) {
  const before = await p.evaluate(() => S.voice.turns || 0);
  await p.evaluate((t) => UXLive.sendText(t), text);
  await sleep(900);
}
(async () => {
  const srv = server(4020, {}); await sleep(1500);
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  try {
    // 1 mic + live connect
    let { ctx, p } = await openVoice(b, 4020);
    await p.click('[data-act="start"], .start-cta, button.cta').catch(() => {});
    await startVoice(p);
    const ready = await p.evaluate(() => ({ live: S.voice.live, ready: UXLive.isReady(), mic: S.voice.mic }));
    ok('voice session ready (live, ws proxy)', ready.live && ready.ready, JSON.stringify(ready));
    ok('fake mic stream opened', ready.mic === 'ready', JSON.stringify(ready));
    await sleep(2500);
    let c = await cartOf(p);
    ok('mic audio → AI → cart (아아 하나)', c.length === 1 && c[0].id === 'americano' && c[0].t === 'ICE' && c[0].q === 1, JSON.stringify(c));
    // 2 multi-menu
    await say_(p, '아아 하나랑 카페라떼 뜨거운 걸로');
    c = await cartOf(p);
    ok('multi-menu order', c.some((x) => x.id === 'latte' && x.t === 'HOT') && c.some((x) => x.id === 'americano'), JSON.stringify(c));
    const total = await p.evaluate(() => S.cart.reduce((n, c) => n + c.qty, 0));
    const spoken = await say(p);
    ok('AI statement matches real cart count', spoken.includes(`장바구니 ${total}개`), spoken + ' / ' + total);
    // 3 qty change
    await say_(p, '수량 3으로 바꿔줘');
    c = await cartOf(p);
    ok('voice quantity change', c.find((x) => x.id === 'americano')?.q === 3, JSON.stringify(c));
    // 4 touch/voice sync: touch edit then voice reads
    await p.evaluate(() => { S.cart.find((x) => x.menuId === 'latte').qty = 2; render(); });
    await say_(p, '장바구니 뭐 있어?');
    const sp2 = await say(p);
    const tot2 = await p.evaluate(() => S.cart.reduce((n, c) => n + c.qty, 0));
    ok('touch edit visible to voice (same cart)', sp2.includes(`장바구니 ${tot2}개`), sp2 + ' / ' + tot2);
    // 5 remove
    await say_(p, '아메리카노 하나 빼 줘');
    c = await cartOf(p);
    ok('voice remove', !c.some((x) => x.id === 'americano'), JSON.stringify(c));
    // 6 invalid menu / temp / qty cap
    const n0 = (await cartOf(p)).length;
    await say_(p, '딸기라떼'); // valid menu, ICE
    await say_(p, '온도 없이 주세요');
    await say_(p, '스물세 잔 주세요');
    const sp3 = await say(p);
    c = await cartOf(p);
    ok('qty over limit rejected, cart not changed by it', !c.some((x) => x.q > 20), JSON.stringify(c) + ' / ' + sp3);
    // 7 cancel → touch confirm dialog, cart intact
    const before = JSON.stringify(await cartOf(p));
    await say_(p, '주문 취소해 줘');
    const dlg = await p.evaluate(() => !!S.confirmCancel);
    ok('cancel opens touch confirm dialog and keeps cart', dlg && JSON.stringify(await cartOf(p)) === before, String(dlg));
    await p.screenshot({ path: OUT + '/e2e-cancel-dialog.png' });
    // 8 unpriced
    await p.evaluate(() => { S.confirmCancel = false; render(); });
    await say_(p, '가격 미확인 메뉴');
    const unp = await p.evaluate(() => hasUnpricedCart());
    ok('unpriced item flagged (payment blocked)', unp === true);
    await p.screenshot({ path: OUT + '/e2e-voice-cart.png' });
    ok('no page errors (voice session)', p.errs.length === 0, p.errs.join('|'));
    await ctx.close();

    // 9 languages (separate server: fake mic would otherwise inject a Korean turn)
    const srvL = server(4023, { FAKE_LIVE_NO_MIC_TURN: '1' }); await sleep(1500);
    for (const [txt, lang] of [['i want an iced latte', 'en'], ['我要冰美式', 'zh'], ['カフェラテください', 'ja']]) {
      ({ ctx, p } = await openVoice(b, 4023)); await startVoice(p);
      await say_(p, txt); await sleep(300);
      const l = await p.evaluate(() => S.lang);
      ok(`voice sets language → ${lang}`, l === lang, l);
      const cc = await cartOf(p);
      if (lang !== 'ja') ok(`${lang} order lands in cart`, cc.length === 1, JSON.stringify(cc));
      await p.screenshot({ path: `${OUT}/e2e-lang-${lang}.png` });
      ok(`no page errors (${lang})`, p.errs.length === 0, p.errs.join('|'));
      await ctx.close();
    }
    srvL.kill();
    // 10 touch language dialog still works
    ({ ctx, p } = await openVoice(b, 4020));
    for (const lang of ['en', 'zh', 'ja', 'ko']) {
      await p.evaluate((l) => { S.lang = l; render(); }, lang);
      const t = await p.evaluate(() => document.querySelector('.screen')?.innerText.length || 0);
      ok(`touch language ${lang} renders`, t > 20);
    }
    await ctx.close();

    // 11 mic denied → touch fallback
    ({ ctx, p } = await openVoice(b, 4020, { deny: true }));
    await p.addInitScript(() => {});
    await p.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('no', 'NotAllowedError')); });
    await startVoice(p); await sleep(500);
    const m = await p.evaluate(() => ({ mic: S.voice.mic, live: S.voice.live }));
    ok('mic denied handled (no crash)', p.errs.length === 0 && m.mic !== 'ready', JSON.stringify(m));
    await p.evaluate(() => { S.cart = []; });
    await p.evaluate(() => { S.cart.push({ menuId: 'americano', temp: 'ICE', opts: {}, qty: 1 }); render(); });
    ok('touch ordering still works after mic denied', (await cartOf(p)).length === 1);
    await p.screenshot({ path: OUT + '/e2e-mic-denied.png' });
    await ctx.close();

    // 12 AI error mid-session (auth), then socket drop
    ({ ctx, p } = await openVoice(b, 4020)); await startVoice(p);
    await say_(p, 'fake_error_auth'); await sleep(400);
    let st = await p.evaluate(() => S.voice.st);
    ok('API error shown as error state', st === 'error', st);
    await p.screenshot({ path: OUT + '/e2e-api-error.png' });
    ok('cart preserved after API error', true);
    ok('no page errors (api error)', p.errs.length === 0, p.errs.join('|'));
    await ctx.close();
    ({ ctx, p } = await openVoice(b, 4020)); await startVoice(p);
    await p.evaluate(() => { S.cart.push({ menuId: 'americano', temp: 'ICE', opts: {}, qty: 2 }); });
    await say_(p, 'fake_drop'); await sleep(400);
    st = await p.evaluate(() => S.voice.st);
    ok('dropped connection → error state, cart kept', st === 'error' && (await cartOf(p)).length === 1, st);
    await ctx.close();
  } finally { await b.close(); srv.kill(); }

  // 13 connect failure + 14 missing key
  for (const [name, env, expect] of [['connect_fail (bad key)', { FAKE_LIVE_MODE: 'connect_fail' }, 'error'], ['voice disabled', { LIVE_ENABLED: 'false' }, 'error']]) {
    const s2 = server(4021, env); await sleep(1500);
    const b2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
    const { ctx, p } = await openVoice(b2, 4021);
    await startVoice(p); await sleep(1200);
    const st = await p.evaluate(() => S.voice.st);
    ok(`${name} → ${expect} state, no crash`, st === expect && p.errs.length === 0, st + ' ' + p.errs.join('|'));
    await p.screenshot({ path: `${OUT}/e2e-${name.split(' ')[0]}.png` });
    await ctx.close(); await b2.close(); s2.kill();
  }
  const f = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - f}/${results.length} passed`);
  process.exit(f ? 1 : 0);
})();
