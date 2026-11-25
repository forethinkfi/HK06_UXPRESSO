// PHASE 2 — verify that the Gemini API is really callable with the server-side key.
// Usage: GEMINI_API_KEY=... node scripts/gemini-check.mjs   (optional: GEMINI_MODEL, CHECK_RUNS)
// The key is read from the environment only and is never printed (all output is redacted).

const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const RUNS = Math.max(1, Number(process.env.CHECK_RUNS) || 3);
const redact = (s) => (KEY ? String(s).split(KEY).join('[REDACTED]') : String(s));
const log = (...a) => console.log(...a.map((x) => (typeof x === 'string' ? redact(x) : x)));

if (!KEY) {
  log('FAIL  GEMINI_API_KEY (or GOOGLE_API_KEY) is not set. No real API call was made.');
  process.exit(2);
}

async function call(path, body) {
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-goog-api-key': KEY, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep raw text */ }
    return { status: res.status, ms: Math.round(performance.now() - t0), json, text };
  } catch (e) {
    return { status: 0, ms: Math.round(performance.now() - t0), json: null, text: `${e.name}: ${e.message}` };
  }
}
const errOf = (r) => redact(r.json?.error ? `${r.json.error.status || ''} ${r.json.error.message || ''}`.trim() : r.text.slice(0, 200));

let failed = false;

// 1) list models available to this key
const list = await call('/models?pageSize=200');
log(`1. models.list  HTTP ${list.status}  ${list.ms}ms`);
if (list.status !== 200) {
  log(`   FAIL  ${errOf(list)}`);
  process.exit(1);
}
const usable = (list.json.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'));
log(`   models: ${list.json.models?.length ?? 0} total, ${usable.length} support generateContent`);
log(`   gemini models: ${usable.map((m) => m.name.replace('models/', '')).filter((n) => n.startsWith('gemini')).slice(0, 20).join(', ') || '(none)'}`);

// 2) choose a model: GEMINI_MODEL, else the newest stable "flash"
const stable = (n) => /^gemini-[\d.]+-flash$/.test(n);
const ver = (n) => Number((n.match(/^gemini-([\d.]+)/) || [])[1]) || 0;
const names = usable.map((m) => m.name.replace('models/', ''));
const model = process.env.GEMINI_MODEL
  || names.filter(stable).sort((a, b) => ver(b) - ver(a))[0]
  || names.find((n) => n.includes('flash') && !n.includes('lite'))
  || names[0];
if (!model) { log('FAIL  no model with generateContent for this key'); process.exit(1); }
log(`2. model        ${model}${process.env.GEMINI_MODEL ? ' (from GEMINI_MODEL)' : ' (auto-selected)'}`);

// 3) real generateContent calls with a JSON-shaped Korean order prompt
const prompt = '손님이 "아아 하나 주세요"라고 말했다. 아아는 아이스 아메리카노다. '
  + '다음 JSON만 출력해: {"menu":"메뉴 이름","temperature":"HOT 또는 ICE","qty":숫자}';
const times = [];
for (let i = 1; i <= RUNS; i++) {
  const r = await call(`/models/${model}:generateContent`, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  });
  if (r.status !== 200) { failed = true; log(`3.${i} generateContent  HTTP ${r.status}  ${r.ms}ms  FAIL  ${errOf(r)}`); continue; }
  const cand = r.json.candidates?.[0];
  const text = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* not JSON */ }
  const u = r.json.usageMetadata || {};
  times.push(r.ms);
  if (!parsed) failed = true;
  log(`3.${i} generateContent  HTTP ${r.status}  ${r.ms}ms  finish=${cand?.finishReason}  tokens(in/out)=${u.promptTokenCount}/${u.candidatesTokenCount}  json=${parsed ? 'ok' : 'INVALID'}`);
  log(`     response: ${text.replace(/\s+/g, ' ').slice(0, 160)}`);
}

if (times.length) log(`4. latency      min ${Math.min(...times)}ms / avg ${Math.round(times.reduce((a, b) => a + b, 0) / times.length)}ms / max ${Math.max(...times)}ms (${times.length}/${RUNS} ok)`);
log(failed || !times.length ? 'RESULT  FAIL — see errors above' : 'RESULT  OK — real Gemini API call succeeded (not a mock)');
process.exit(failed || !times.length ? 1 : 0);
