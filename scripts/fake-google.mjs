// TEST ONLY — never used in production. Preload that replaces calls to Google with FAKE responses so the real server
// and the browser pages can be exercised without an API key:  node --import ./scripts/fake-google.mjs server.js
// FAKE_MODE: ok | flaky (gemini-2.5-flash-lite always 503) | down (every model 503) | badkey (400) | forbidden (403) | quota (429)
// Nothing here says anything about how well the real Gemini understands Korean orders.
const mode = process.env.FAKE_MODE || 'ok';
const TEXT = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-pro', 'gemini-3.8-flash', 'gemini-3-flash-preview'];
const OTHER = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-image', 'gemini-3.5-transcribe', 'gemini-embedding-001'];
const realFetch = globalThis.fetch;
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const err = (status, st, message) => json(status, { error: { code: status, status: st, message } });
const gen = (obj) => json(200, { candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 321, candidatesTokenCount: 45 } });
const item = (menuId, temperature, qty, options = {}) => ({ menuId, temperature, qty, options });

function order(u) {
  const t = u.replace(/\s+/g, ' ').trim();
  if (t === '아아 하나') return { intent: 'order', items: [item('americano', 'ICE', 1)], reply: '아이스 아메리카노 한 잔이에요.' };
  if (t === '뜨아 두 잔') return { intent: 'order', items: [item('americano', 'HOT', 2)], reply: '따뜻한 아메리카노 두 잔이에요.' };
  if (t === '아아 하나랑 카페라떼 뜨거운 거') return { intent: 'order', items: [item('americano', 'ICE', 1), item('latte', 'HOT', 1)] };
  if (t === '아아 두 개 중 하나만 샷 추가') return { intent: 'order', items: [item('americano', 'ICE', 1), item('americano', 'ICE', 1, { shot: '1' })] };
  if (t === '아메리카노 하나') return { intent: 'order', items: [item('americano', null, 1)], question: '따뜻하게 드릴까요, 차갑게 드릴까요?' };
  if (t === '딸기라떼 하나') return { intent: 'order', items: [item('strawberry_latte', 'ICE', 1)] }; // a menu that does not exist
  return { intent: 'clarify', items: [], question: '어떤 메뉴를 드릴까요?' };
}
const pick = (...ids) => ids.map((id) => ({ menuId: id, reason: `${id} 추천 이유(가짜 응답)` }));
function recommend(u) {
  if (u.includes('달달')) return { intent: 'recommend', criteria: { maxPrice: null, temperature: null }, picks: pick('vanilla', 'caramel', 'condensed'), note: null };
  if (u.includes('3,000원')) return { intent: 'recommend', criteria: { maxPrice: 3000, temperature: null }, picks: pick('americano', 'vanilla', 'chamomile'), note: null }; // vanilla breaks the price rule on purpose
  if (u.includes('추운')) return { intent: 'recommend', criteria: { maxPrice: null, temperature: 'HOT' }, picks: pick('latte', 'coldbrew', 'yuja'), note: null }; // coldbrew is ICE-only on purpose
  if (u.includes('카페인')) return { intent: 'recommend', criteria: { maxPrice: null, temperature: null }, picks: pick('decaf'), note: '영양 정보는 확인할 수 없어요. 이름에 디카페인이 드러난 메뉴만 골랐어요.' };
  if (u.includes('부드러운')) return { intent: 'recommend', criteria: { maxPrice: null, temperature: null }, picks: pick('coldbrew', 'latte', 'ghost_menu'), note: null }; // ghost_menu does not exist
  return { intent: 'recommend', criteria: { maxPrice: null, temperature: null }, picks: [], note: '비슷한 메뉴가 없어요. 다른 취향이나 가격으로 말씀해 주세요.' };
}

globalThis.fetch = async (url, init) => {
  const u = String(url);
  if (!u.startsWith('https://generativelanguage.googleapis.com/')) return realFetch(url, init);
  await new Promise((r) => setTimeout(r, 40));
  if (mode === 'badkey') return err(400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.');
  if (mode === 'forbidden') return err(403, 'PERMISSION_DENIED', 'Requests from this client are blocked.');
  if (u.includes('/models?')) return json(200, { models: [...TEXT, ...OTHER].map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) });
  const model = (u.match(/models\/([^:]+):generateContent/) || [])[1];
  if (mode === 'down' || (mode === 'flaky' && model === 'gemini-2.5-flash-lite')) return err(503, 'UNAVAILABLE', 'This model is currently experiencing high demand. Spikes in demand are usually temporary.');
  if (mode === 'quota') return err(429, 'RESOURCE_EXHAUSTED', 'Quota exceeded.');
  const prompt = JSON.parse(init.body).contents[0].parts[0].text;
  const utter = (() => { const m = prompt.match(/손님 발화\(JSON 문자열\): (".*")\s*$/m); try { return m ? JSON.parse(m[1]) : ''; } catch { return ''; } })();
  if (prompt.includes('메뉴 추천기')) return gen(recommend(utter));
  if (prompt.includes('주문 해석기')) return gen(order(utter));
  return gen({ menu: '아이스 아메리카노', temperature: 'ICE', qty: 1 }); // connection test prompt
};
console.log(`[FAKE GOOGLE] mode=${mode} — responses are fabricated for testing`);
