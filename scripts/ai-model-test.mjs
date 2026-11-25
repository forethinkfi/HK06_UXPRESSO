// Offline test of model choice + transient-error fallback (lib/gemini.mjs).
// IMPORTANT: Google is replaced by a fake fetch here — this proves the selection/fallback logic, not the real API.
// Usage: node scripts/ai-model-test.mjs
process.env.GEMINI_API_KEY = 'TESTKEY-never-print-me-123456';
delete process.env.GEMINI_MODEL;
const { rankModels, tryModels, generateJSON, checkGemini } = await import('../lib/gemini.mjs');

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  → ${extra}`}`); };

// Model list copied from the real production /api/ai/status response (the newest-version model was overloaded there).
const NAMES = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-4-argon'];

console.log('--- model ranking ---');
let r = rankModels(NAMES);
check('가장 높은 버전(3.8)이 아니라 검증된 2.5-flash를 먼저 고름', r[0] === 'gemini-2.5-flash' && !r.includes('gemini-3.8-flash'), r.join());
check('후보는 최대 3개', r.length === 3, r.join());
check('2.5-flash가 없으면 flash-latest', rankModels(['gemini-flash-latest', 'gemini-3.8-flash'])[0] === 'gemini-flash-latest');
check('선호 모델이 하나도 없으면 최신 stable flash', rankModels(['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-2.5-pro'])[0] === 'gemini-3.8-flash');
process.env.GEMINI_MODEL = 'my-pinned-model';
check('GEMINI_MODEL을 지정하면 그것만 사용(대체 없음)', JSON.stringify(rankModels(NAMES)) === '["my-pinned-model"]');
delete process.env.GEMINI_MODEL;

// ---- fake fetch ----
let script = []; const calls = [];
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), key: init?.headers?.['x-goog-api-key'] });
  const next = script.shift() ?? { status: 500, body: { error: { status: 'X', message: 'script exhausted' } } };
  if (next.throw) throw Object.assign(new Error(next.throw), { name: 'TimeoutError' });
  return new Response(JSON.stringify(next.body), { status: next.status, headers: { 'content-type': 'application/json' } });
};
const ok = (text) => ({ status: 200, body: { candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 } } });
const err = (status, message, st = 'ERR') => ({ status, body: { error: { code: status, status: st, message } } });
const list = () => ({ status: 200, body: { models: NAMES.map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) } });
const body = { contents: [] };
const reset = (...s) => { script = s; calls.length = 0; };

console.log('--- fallback on transient errors ---');
reset(err(503, 'high demand', 'UNAVAILABLE'), ok('{}'));
let t = await tryModels(['a', 'b', 'c'], body);
check('503 → 다음 모델로 대체해 성공, 시도 기록 2건', t.r.status === 200 && t.model === 'b' && t.attempts.length === 2 && t.attempts[0].status === 503, JSON.stringify(t.attempts));
reset(err(400, 'API key not valid'), ok('{}'));
t = await tryModels(['a', 'b'], body);
check('400(키 오류)은 모델을 바꿔도 소용없으니 즉시 중단', t.r.status === 400 && t.attempts.length === 1);
reset(err(403, 'denied'), ok('{}'));
t = await tryModels(['a', 'b'], body);
check('403도 즉시 중단', t.attempts.length === 1 && t.r.status === 403);
reset(err(404, 'model not found'), ok('{}'));
t = await tryModels(['a', 'b'], body);
check('404(없는 모델) → 다음 모델 시도', t.model === 'b' && t.r.status === 200);
reset(err(429, 'quota'), err(503, 'busy'), err(503, 'busy'));
t = await tryModels(['a', 'b', 'c'], body);
check('전부 실패하면 마지막 오류 그대로 반환(3건 기록)', t.r.status === 503 && t.attempts.length === 3);
reset({ throw: 'timed out' }, ok('{}'));
t = await tryModels(['a', 'b'], body);
check('네트워크 오류/시간 초과(status 0) → 다음 모델', t.model === 'b' && t.attempts[0].status === 0);

console.log('--- generateJSON end to end (fake Google) ---');
globalThis.__resetModelCache = undefined;
reset(list(), err(503, 'This model is currently experiencing high demand', 'UNAVAILABLE'), ok('{"intent":"order"}'));
let g = await generateJSON('prompt');
check('1순위 모델이 503이면 2순위로 대체하고 fallbackUsed 표시', g.ok && g.fallbackUsed === true && g.attempts.length === 2 && g.model === 'gemini-flash-latest', JSON.stringify({ ok: g.ok, m: g.model, a: g.attempts }));
check('요청에 키가 헤더로 전달됨(본문·URL에는 없음)', calls.every((c) => c.key === process.env.GEMINI_API_KEY && !c.url.includes('TESTKEY')));
reset(err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'));
g = await generateJSON('prompt'); // model list is cached from the previous call
check('전부 503이면 ok:false + 한국어 안내(Mock 아님)', g.ok === false && g.real === true && /수요/.test(g.hint) && g.attempts.length === 3, JSON.stringify(g).slice(0, 200));
reset(err(400, `API key not valid: ${process.env.GEMINI_API_KEY}`, 'INVALID_ARGUMENT'));
g = await generateJSON('prompt');
check('오류 메시지에 키가 섞여 있어도 가려짐', !JSON.stringify(g).includes('TESTKEY'), JSON.stringify(g).slice(0, 200));

console.log('--- checkGemini (connection test) ---');
reset(list(), err(503, 'busy', 'UNAVAILABLE'), ok('{"menu":"아이스 아메리카노","temperature":"ICE","qty":1}'));
let c = await checkGemini();
check('연결 테스트도 대체 모델로 성공, 어느 모델이 답했는지 기록', c.ok === true && c.model === 'gemini-flash-latest' && c.calls[0].attempts.length === 2, JSON.stringify({ ok: c.ok, m: c.model, e: c.error }));
reset(list(), err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'));
c = await checkGemini();
check('전부 실패하면 ok:false + 원인/해결', c.ok === false && c.hint && c.calls[0].attempts.length === 3);

console.log(`\n${pass} passed, ${fail} failed  (FAKE Google responses — not a real Gemini result)`);
process.exit(fail ? 1 : 0);
