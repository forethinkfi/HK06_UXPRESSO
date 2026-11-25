// Offline test of model choice, limited retry and fallback (lib/gemini.mjs).
// IMPORTANT: Google is replaced by a fake fetch and sleeping is skipped. This proves the policy logic only,
// not the real Gemini API. Usage: node scripts/ai-model-test.mjs
process.env.GEMINI_API_KEY = 'TESTKEY-never-print-me-123456';
delete process.env.GEMINI_MODEL;
const G = await import('../lib/gemini.mjs');
const { rankModels, buildCandidates, classify, tryModels, generateJSON, checkGemini, probeModels, hintFor, getModels, clearModelCache, POLICY } = G;

let pass = 0, fail = 0;
const check = (name, cond, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  → ${extra}`}`); };

// Text-model names copied from the real production /api/ai/status response.
const NAMES = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash-lite', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'gemini-4-argon'];
const NON_TEXT = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-image', 'gemini-3.5-transcribe', 'gemini-omni-flash-preview', 'gemini-3.1-pro-preview-customtools', 'gemini-nano-banana-2.1'];

console.log('--- model catalog / ranking ---');
check('이미지·TTS·전사·omni 같은 비텍스트 모델은 목록에서 제외', NON_TEXT.every((n) => classify(n) === null), NON_TEXT.filter((n) => classify(n)).join());
check('Flash-Lite / Flash / Pro 분류', classify('gemini-2.5-flash-lite').tier === 'flash-lite' && classify('gemini-3.8-flash').tier === 'flash' && classify('gemini-2.5-pro').tier === 'pro' && classify('gemini-4-argon').tier === 'other');
check('preview·latest 표시', classify('gemini-3-flash-preview').preview === true && classify('gemini-flash-latest').alias === true);
let r = rankModels(NAMES);
check('경량(2.5 Flash-Lite) → 2.5 Flash → latest 별칭 순으로 먼저', r.slice(0, 4).join() === 'gemini-2.5-flash-lite,gemini-2.5-flash,gemini-flash-lite-latest,gemini-flash-latest', r.slice(0, 4).join());
check('가장 높은 버전(3.8)을 앞세우지 않음', r.indexOf('gemini-3.8-flash') > 3, r.join());
check('자동 후보는 최대 3개', buildCandidates({ textNames: NAMES }).length === 3);
check('자동 + 대체 끄기 → 1개만', buildCandidates({ textNames: NAMES, fallback: false }).length === 1);
check('모델 직접 선택 + 대체 끄기 → 그 모델만', JSON.stringify(buildCandidates({ requested: 'gemini-3.8-flash', fallback: false, textNames: NAMES })) === '["gemini-3.8-flash"]');
check('모델 직접 선택 + 대체 켜기 → 선택 모델 먼저, 그다음 경량 순', buildCandidates({ requested: 'gemini-3.8-flash', fallback: true, textNames: NAMES }).join() === 'gemini-3.8-flash,gemini-2.5-flash-lite,gemini-2.5-flash');
process.env.GEMINI_MODEL = 'pinned-model';
check('GEMINI_MODEL을 지정하면 자동 모드는 그 모델만', JSON.stringify(buildCandidates({ textNames: NAMES })) === '["pinned-model"]');
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
const list = () => ({ status: 200, body: { models: [...NAMES, ...NON_TEXT].map((n) => ({ name: `models/${n}`, supportedGenerationMethods: ['generateContent'] })) } });
const body = { contents: [] };
const reset = (...s) => { script = s; calls.length = 0; };
const sleeps = []; const sleep = async (ms) => { sleeps.push(ms); };
const resetSleeps = () => { sleeps.length = 0; };

console.log('--- limited retry on the same model ---');
reset(err(503, 'busy', 'UNAVAILABLE'), ok('{}')); resetSleeps();
let t = await tryModels(['a', 'b'], body, { sleep });
check('503 → 0.6초 쉬고 같은 모델 재시도해 성공(모델 변경 없음)', t.r.status === 200 && t.model === 'a' && t.retries === 1 && t.waitMs === 600 && sleeps.join() === '600' && t.attempts.length === 2 && t.attempts[1].try === 2, JSON.stringify(t));
reset(err(503, 'busy'), err(503, 'busy'), ok('{}')); resetSleeps();
t = await tryModels(['a', 'b'], body, { sleep });
check('같은 모델이 재시도에도 503 → 다음 모델로 대체(총 3회 시도)', t.model === 'b' && t.attempts.map((a) => `${a.model}${a.try}:${a.status}`).join() === 'a1:503,a2:503,b1:200' && t.retries === 1, JSON.stringify(t.attempts));
reset(err(429, 'quota'), ok('{}')); resetSleeps();
t = await tryModels(['a', 'b'], body, { sleep });
check('429는 같은 모델을 다시 두드리지 않고 바로 다음 모델', t.model === 'b' && t.retries === 0 && sleeps.length === 0 && t.attempts.length === 2);
reset({ throw: 'timed out' }, ok('{}')); resetSleeps();
t = await tryModels(['a', 'b'], body, { sleep });
check('시간 초과/네트워크 오류(0)는 기다리지 않고 다음 모델', t.model === 'b' && t.attempts[0].status === 0 && sleeps.length === 0);
reset(err(404, 'model not found'), ok('{}'));
t = await tryModels(['a', 'b'], body, { sleep });
check('404(없는 모델) → 다음 모델', t.model === 'b' && t.r.status === 200);
for (const code of [400, 401, 403]) {
  reset(err(code, 'bad'), ok('{}')); resetSleeps();
  t = await tryModels(['a', 'b'], body, { sleep });
  check(`${code}은 재시도·대체 모두 소용없으니 즉시 중단(1회)`, t.attempts.length === 1 && t.r.status === code && sleeps.length === 0);
}

console.log('--- no runaway: hard caps ---');
reset(...Array(10).fill(err(503, 'busy'))); resetSleeps();
t = await tryModels(['a', 'b', 'c'], body, { sleep });
check(`전부 503이어도 Google 요청은 최대 ${POLICY.maxAttempts}회에서 멈춤`, t.attempts.length === POLICY.maxAttempts && t.stopped === 'max_attempts' && calls.length === POLICY.maxAttempts, `${t.attempts.length} ${t.stopped}`);
check('대기 시간 합계는 짧게 제한(3초 미만)', t.waitMs < 3000, String(t.waitMs));
reset(...Array(10).fill(err(503, 'busy'))); resetSleeps();
let allowed = 3; const budget = () => allowed-- > 0;
t = await tryModels(['a', 'b', 'c'], body, { sleep, budget });
check('시간당 예산이 바닥나면 즉시 중단하고 Google을 더 부르지 않음', t.stopped === 'budget' && t.r.status === 'budget_exhausted' && calls.length === 3, `${t.stopped} ${calls.length}`);
reset(err(503, 'busy'), err(503, 'busy')); resetSleeps();
t = await tryModels(['a'], body, { sleep, retries: 5 });
check('retries를 크게 줘도 maxAttempts로 제한', t.attempts.length <= POLICY.maxAttempts);

console.log('--- generateJSON end to end (fake Google) ---');
clearModelCache(); reset(list(), err(503, 'This model is currently experiencing high demand', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'), ok('{"intent":"order"}')); resetSleeps();
let g = await generateJSON('prompt', { sleep });
check('자동: 1순위 2.5-flash-lite 503→재시도 503→2.5-flash로 변경해 성공', g.ok && g.model === 'gemini-2.5-flash' && g.modelChanged === true && g.retries === 1 && g.attempts.length === 3 && g.firstChoice === 'gemini-2.5-flash-lite', JSON.stringify({ ok: g.ok, m: g.model, a: g.attempts }));
check('표시용 정보: 요청 모델·실제 모델·변경 여부·재시도·총 시간', g.requestedModel === 'auto' && typeof g.totalMs === 'number' && g.waitMs === 600 && g.real === true, JSON.stringify(g).slice(0, 200));
check('키는 헤더로만 전달(URL에는 없음)', calls.every((c) => c.key === process.env.GEMINI_API_KEY && !c.url.includes('TESTKEY')));
check('모델 목록은 한 번만 조회(캐시), 비텍스트 모델은 후보에서 제외', calls.filter((c) => c.url.includes('/models?')).length === 1);
reset(err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE')); resetSleeps();
g = await generateJSON('prompt', { model: 'gemini-3.8-flash', fallback: false, sleep });
check('모델을 직접 고르고 대체를 끄면 그 모델만 재시도하고 실패를 그대로 보고', g.ok === false && g.model === 'gemini-3.8-flash' && g.attempts.length === 2 && g.attempts.every((a) => a.model === 'gemini-3.8-flash') && g.modelChanged === false && g.status === 503, JSON.stringify(g.attempts));
check('실패는 실제 API 오류로 표시(real:true) + 503 안내', g.real === true && /수요/.test(g.hint));
reset(); const before = calls.length;
g = await generateJSON('prompt', { model: 'not-a-listed-model', sleep });
check('목록에 없는 모델은 Google을 부르기 전에 거절', g.ok === false && g.status === 'invalid_model' && calls.length === before);
clearModelCache(); reset(err(400, `API key not valid: ${process.env.GEMINI_API_KEY}`, 'INVALID_ARGUMENT'));
g = await generateJSON('prompt', { sleep });
check('오류 메시지에 키가 섞여 있어도 가려짐', !JSON.stringify(g).includes('TESTKEY') && g.ok === false);
check('키 오류(400)는 재시도하지 않음(요청 1회)', calls.length === 1);

console.log('--- error guidance per HTTP status ---');
const hints = { 401: hintFor(401), 403: hintFor(403), 429: hintFor(429), 503: hintFor(503) };
check('401/403/429/503 안내가 서로 다름', new Set(Object.values(hints)).size === 4);
check('401: 키 인증, 403: 권한·API 사용 설정, 429: 한도, 503: 수요 폭주+재시도', /401/.test(hints[401]) && /403/.test(hints[403]) && /API가 사용 설정/.test(hints[403]) && /429/.test(hints[429]) && /한도/.test(hints[429]) && /503/.test(hints[503]) && /수요/.test(hints[503]), JSON.stringify(hints));

console.log('--- connection test + probe ---');
clearModelCache(); reset(list(), err(503, 'busy', 'UNAVAILABLE'), err(503, 'busy', 'UNAVAILABLE'), ok('{"menu":"아이스 아메리카노","temperature":"ICE","qty":1}'));
let c = await checkGemini({ sleep });
check('연결 테스트: 재시도→대체 모델로 성공, 시도 내역 기록', c.ok === true && c.model === 'gemini-2.5-flash' && c.calls[0].attempts.length === 3 && c.calls[0].modelChanged === true && typeof c.totalMs === 'number', JSON.stringify({ ok: c.ok, m: c.model, e: c.error }));
clearModelCache(); reset(list(), err(403, 'denied', 'PERMISSION_DENIED'));
c = await checkGemini({ sleep });
check('연결 테스트: 403이면 즉시 실패 + 403 안내', c.ok === false && c.calls[0].attempts.length === 1 && /403/.test(c.hint));
reset(ok('{}'), err(503, 'busy', 'UNAVAILABLE'), err(404, 'nope'));
const pr = await probeModels(['m1', 'm2', 'm3']);
check('모델 점검: 모델마다 1회씩, 재시도·대체 없이 결과 기록', pr.length === 3 && pr[0].ok && !pr[1].ok && pr[1].status === 503 && pr[2].status === 404 && calls.length === 3, JSON.stringify(pr.map((x) => [x.model, x.status])));
let left = 1; reset(ok('{}'), ok('{}'), ok('{}'));
const pb = await probeModels(['m1', 'm2', 'm3'], { budget: () => left-- > 0 });
check('모델 점검도 예산이 바닥나면 중단', pb.length === 2 && pb[1].status === 'budget_exhausted', JSON.stringify(pb.map((x) => x.status)));

console.log(`\n${pass} passed, ${fail} failed  (FAKE Google responses, sleeping skipped — not a real Gemini result)`);
process.exit(fail ? 1 : 0);
