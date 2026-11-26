// TEST ONLY — never used in production. A scripted stand-in for Gemini Live so the real server and the kiosk page can be
// exercised without an API key or a microphone:
//     GEMINI_API_KEY=FAKE node --import ./scripts/fake-live.mjs server.js
// It reacts to keywords in the customer's text (ko/en/zh/ja), calls the kiosk tools exactly like the model would, WAITS for
// the real tool results, and then "speaks" a sentence built from those results. A test can therefore compare what the AI
// said with what the cart really contains. It says nothing about how well the real Gemini understands orders.
// FAKE_LIVE_MODE: ok (default) | connect_fail (the connection is refused like a bad key)
import { readFileSync } from 'node:fs';

// FAKE_LIVE_CATALOG: v6 (default, the kiosk's own menu data) | ai128 (the AI Studio list, used by the server tests)
const catalog = process.env.FAKE_LIVE_CATALOG === 'ai128' ? 'ai128' : 'v6';
const menus = catalog === 'ai128'
  ? JSON.parse(readFileSync(new URL('../data/ai/menus-128.json', import.meta.url), 'utf8')).menus
  : JSON.parse(readFileSync(new URL('../public/v6/menu-data.json', import.meta.url), 'utf8')).products;
const unpriced = catalog === 'ai128' ? menus.find((m) => m.price == null && !m.tempPrices) : null; // v6 has a price for every item
const ID = catalog === 'ai128' ? {} : { americano: 'd100', latte: 'd107', strawberry_latte: 'd019', mega_001: 'd100' };
const mid = (id) => ID[id] || id;
const mode = process.env.FAKE_LIVE_MODE || 'ok';
const pcm = (() => { const n = 3600, b = Buffer.alloc(n * 2); for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 8) * 6000), i * 2); return b.toString('base64'); })(); // 0.15 s tone @24 kHz
const log = (...a) => console.log('[fake-live]', ...a);
const add = (menuId, temp, qty = 1, extra = {}) => ({ name: 'add_to_cart', args: { menuId: mid(menuId), ...(temp ? { temp } : {}), qty, ...extra } });

function plan(text) {
  const t = String(text).toLowerCase();
  if (/fake_error_auth/.test(t)) return { error: 'API_KEY_INVALID' };
  if (/fake_error_billing/.test(t)) return { error: 'Error 1011: Your prepayment credits are depleted. Please go to AI Studio to manage your project and billing.' };
  if (/fake_close_billing/.test(t)) return { closeReason: 'Your prepayment credits are depleted.' };
  if (/fake_drop/.test(t)) return { drop: true };
  if (/아아 하나랑 카페라떼 뜨거운/.test(t)) return { calls: [add('americano', 'ICE', 1), add('latte', 'HOT', 1)] };
  if (/아아 두 잔|two iced americano|两杯冰美式/.test(t)) return { calls: [add('americano', 'ICE', 2)] };
  if (/샷 추가/.test(t)) return { calls: [add('americano', 'ICE', 1, { shot: '1' })] };
  if (/i want an iced latte/.test(t)) return { calls: [{ name: 'set_language', args: { lang: 'en' } }, add('latte', 'ICE', 1)] };
  if (/我要冰美式/.test(t)) return { calls: [{ name: 'set_language', args: { lang: 'zh' } }, add('americano', 'ICE', 1)] };
  if (/カフェラテください/.test(t)) return { calls: [{ name: 'set_language', args: { lang: 'ja' } }], say: 'ホットとアイス、どちらにしますか？' };
  if (/아아 하나/.test(t)) return { calls: [add('americano', 'ICE', 1)] };
  if (/메가리카노 두 잔/.test(t)) return { calls: [add('mega_001', 'ICE', 2)] };
  if (/가격 미확인/.test(t)) return unpriced ? { calls: [add(unpriced.id, (unpriced.temperature || [])[0] || undefined, 1)] } : { say: '가격이 없는 메뉴는 없어요.' };
  if (/딸기라떼/.test(t)) return { calls: [add('strawberry_latte', 'ICE', 1)] };
  if (/온도 없이/.test(t)) return { calls: [add('americano', undefined, 1)] };
  if (/스물세 잔|23잔/.test(t)) return { calls: [add('americano', 'ICE', 23)] };
  if (/수량.*3/.test(t)) return { calls: [{ name: 'update_cart_quantity', args: { menuId: mid('americano'), qty: 3 } }] };
  if (/아이스 아메리카노 수량.*2/.test(t)) return { calls: [{ name: 'update_cart_quantity', args: { menuId: mid('americano'), temp: 'ICE', qty: 2 } }] };
  if (/하나 빼|빼 줘|remove/.test(t)) return { calls: [{ name: 'remove_from_cart', args: { menuId: mid('americano') } }] };
  if (/장바구니 뭐|what.*cart/.test(t)) return { calls: [{ name: 'get_cart', args: {} }] };
  if (/주문 취소|cancel my order/.test(t)) return { calls: [{ name: 'request_cancel_order', args: {} }] };
  if (/3,?000원 이하 커피/.test(t)) return { calls: [{ name: 'show_menu_list', args: { category: 'coffee', maxPrice: 3000, label: '3,000원 이하 커피' } }] };
  if (/디카페인/.test(t)) return { calls: [{ name: 'show_menu_list', args: { category: 'decaf', label: '디카페인' } }] };
  if (/감자빵/.test(t)) return { calls: [{ name: 'show_menu_list', args: { category: 'food', query: '감자빵', label: '감자빵 검색 결과' } }] };
  if (/매장에서/.test(t)) return { calls: [{ name: 'set_order_mode', args: { mode: 'dine' } }] };
  if (/다 됐어|finish/.test(t)) return { calls: [{ name: 'finish_ordering_to_confirm', args: {} }] };
  if (/결제/.test(t)) return { say: '결제는 화면에서 직접 눌러 진행해 주세요.' };
  return { say: '무엇을 드릴까요?' };
}

// the sentence the "AI" says AFTER seeing the real tool results
function speak(responses) {
  const parts = [];
  let cart = null;
  for (const r of responses) {
    const x = r.response || {};
    if (x.cart) cart = x.cart;
    if (x.ok === false) parts.push(`처리하지 못했어요: ${x.error}.`);
    else if (r.name === 'add_to_cart') parts.push(`${x.added.name} ${x.added.qty}잔을 담았어요.`);
    else if (r.name === 'update_cart_quantity') parts.push(`수량을 ${x.updated.qty}잔으로 바꿨어요.`);
    else if (r.name === 'remove_from_cart') parts.push('장바구니에서 뺐어요.');
    else if (r.name === 'show_menu_list') parts.push(`화면에 ${x.screenCount}개 메뉴를 보여드려요.`);
    else if (r.name === 'request_cancel_order') parts.push('화면의 확인 창에서 직접 눌러 주세요.');
    else if (r.name === 'set_language') parts.push(`Language ${x.lang}.`);
  }
  if (cart) parts.push(cart.hasUnpriced ? `장바구니 ${cart.count}개, 가격 미확인 메뉴가 있어요.` : `장바구니 ${cart.count}개, 합계 ${cart.total}원.`);
  return parts.join(' ');
}

globalThis.__UXPRESSO_TEST_LIVE_FACTORY = () => ({
  live: {
    connect({ model, config, callbacks }) {
      log(`connect model=${model} tools=${(config.tools?.[0]?.functionDeclarations || []).map((d) => d.name).join(',')} sysPromptChars=${String(config.systemInstruction || '').length}`);
      if (mode === 'connect_fail') return Promise.reject(new Error('403 PERMISSION_DENIED: the key is not allowed'));
      let seq = 0, audioChunks = 0, heard = false, waiting = null;
      const emit = (serverContent, toolCall) => setTimeout(() => callbacks.onmessage({ serverContent, toolCall }), 15);
      const finish = (text) => {
        emit({ outputTranscription: { text } });
        emit({ modelTurn: { parts: [{ inlineData: { data: pcm, mimeType: 'audio/pcm;rate=24000' } }] } });
        emit({ turnComplete: true });
        log(`say "${text}"`);
      };
      const run = (text) => {
        log(`input "${text}"`);
        const p = plan(text);
        if (p.error) return callbacks.onerror(new Error(p.error));
        if (p.drop) return callbacks.onclose({});
        if (p.closeReason) return callbacks.onclose({ code: 1011, reason: p.closeReason });
        if (!p.calls) return finish(p.say);
        const ids = p.calls.map(() => `fc-${++seq}`);
        waiting = { n: p.calls.length, got: [], say: p.say };
        emit({}, { functionCalls: p.calls.map((c, i) => ({ id: ids[i], name: c.name, args: c.args })) });
      };
      const session = {
        sendRealtimeInput(inp) {
          if (inp.text !== undefined) { if (/^\[(System|시스템|系统|システム)/.test(inp.text)) { log('init prompt received'); finish('어서 오세요. 무엇을 드릴까요?'); return; } run(inp.text); }
          if (inp.audio) { audioChunks++; if (audioChunks === 3 && !heard && !process.env.FAKE_LIVE_NO_MIC_TURN) { heard = true; log(`mic audio arrived (${audioChunks} chunks, ${inp.audio.mimeType})`); emit({ inputTranscription: { text: '아아 하나 주세요' } }); setTimeout(() => run('아아 하나 주세요'), 60); } }
        },
        sendToolResponse({ functionResponses }) {
          if (!waiting) return;
          waiting.got.push(...functionResponses);
          if (waiting.got.length >= waiting.n) { const w = waiting; waiting = null; finish(w.say || speak(w.got)); }
        },
        close() { log('session closed'); },
      };
      setTimeout(() => callbacks.onopen(), 10);
      return Promise.resolve(session);
    },
  },
});
log(`fake Gemini Live installed (mode=${mode}) — responses are scripted for testing`);
