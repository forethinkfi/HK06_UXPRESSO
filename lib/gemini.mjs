// Gemini REST helpers (zero-dependency). The API key is read from the server environment only;
// it is never returned to the client, logged or printed (all error text is redacted).
//
// Reliability policy (real calls only — a failure is reported, never replaced by a mock):
//   * 500/502/503/504 → the SAME model is retried after a short pause (RETRIES, BACKOFF_MS)
//   * still failing, or 0 (timeout/network) / 404 / 429 → the NEXT model is tried (only when fallback is allowed)
//   * 400/401/403 → stop at once (another model or another try cannot fix a bad key or request)
//   * hard caps: MAX_MODELS models and MAX_ATTEMPTS Google requests per user request; every request is also
//     charged against the hourly budget through the `budget` callback, so retries cannot run away.

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const keyEnv = () => (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null);
const getKey = () => { const k = keyEnv(); return k ? process.env[k] : null; };
const redact = (s) => { const k = getKey(); return k ? String(s).split(k).join('[REDACTED]') : String(s); };
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

export const isConfigured = () => !!keyEnv();
export const POLICY = { retries: 1, backoffMs: [600, 1500], maxModels: 3, maxAttempts: 5, timeoutMs: 15000 };
const RETRY_SAME = new Set([500, 502, 503, 504]);
const SWITCHABLE = new Set([0, 404, 429, 500, 502, 503, 504]);

export async function gemini(path, body, timeoutMs = 20000) {
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-goog-api-key': getKey(), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep raw text */ }
    return { status: res.status, ms: Math.round(performance.now() - t0), json, text: redact(text) };
  } catch (e) {
    return { status: 0, ms: Math.round(performance.now() - t0), json: null, text: redact(`${e.name}: ${e.message}`) };
  }
}
// Budget-aware call: `budget()` must return true for the request to be sent (and charges one unit).
async function call(path, body, { timeoutMs, budget } = {}) {
  if (budget && !budget()) return { status: 'budget_exhausted', ms: 0, json: null, text: '' };
  return gemini(path, body, timeoutMs);
}

export const errText = (r) => redact(r.json?.error ? `${r.json.error.status || ''} ${r.json.error.message || ''}`.trim() : r.text.slice(0, 200));

// Plain-Korean cause + fix, per HTTP status (shown on the AI Lab page).
export function hintFor(status, message = '') {
  if (status === 'not_configured') return '서버가 GEMINI_API_KEY를 읽지 못했어요. Render → Environment에 이름을 정확히 GEMINI_API_KEY로 추가하고 저장한 뒤 다시 배포(Deploy)해 주세요.';
  if (status === 'budget_exhausted') return '이번 시간의 AI 호출 한도를 모두 썼어요. 잠시 후 다시 시도하거나, Render의 AI_HOURLY_CAP 값을 올려 주세요.';
  if (status === 'invalid_model') return '선택한 모델을 쓸 수 없어요. 모델 목록을 새로 고침하거나 "자동"을 선택해 주세요.';
  if (status === 0) return '서버가 Google API에 연결하지 못했거나 시간 안에 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 Render 로그를 확인해 주세요.';
  if (status === 400 && /api key/i.test(message)) return 'API 키가 올바르지 않아요. Google AI Studio에서 키를 확인하고, Render의 GEMINI_API_KEY 값을 다시 저장한 뒤 재배포해 주세요.';
  if (status === 400) return 'Google이 요청 형식을 받아들이지 않았어요. 아래 오류 내용을 개발 담당자에게 전달해 주세요.';
  if (status === 401) return '키가 인증되지 않았어요(401). Render의 GEMINI_API_KEY가 비어 있거나 잘못 복사됐을 수 있어요. Google AI Studio에서 새 키를 발급해 다시 저장하고 재배포해 주세요.';
  if (status === 403) return '키 권한 문제예요(403). 키가 폐기되지 않았는지, Generative Language API가 사용 설정되어 있는지, 키에 IP·사이트 제한이 걸려 있지 않은지, 지역 제한이 없는지 Google AI Studio·Cloud Console에서 확인해 주세요.';
  if (status === 404) return '선택한 모델을 찾을 수 없어요. 모델 목록을 새로 고침하거나 "자동"을 선택해 주세요. (Render에 GEMINI_MODEL이 있다면 지우거나 올바른 이름으로 바꿔 주세요.)';
  if (status === 429) return '사용 한도를 넘었어요(429). 잠시 후 다시 시도하거나, 다른 모델을 선택하거나, Google AI Studio에서 사용량·요금제를 확인해 주세요.';
  if (status === 503) return 'Google 쪽 모델에 수요가 몰려 있어요(503, 일시적). 같은 모델로 짧게 다시 시도했고 필요하면 다른 모델로 바꿔 봤어요. 잠시 후 다시 시도하거나 다른 모델을 직접 선택해 보세요.';
  if (status >= 500) return 'Google 서버의 일시적인 오류예요. 잠시 후 다시 시도해 주세요.';
  return '예상하지 못한 오류예요. 아래 오류 내용을 확인해 주세요.';
}

// ---- model catalog ----
const NON_TEXT = /image|tts|transcribe|embedding|imagen|veo|live|audio|omni|robotics|computer-use|customtools|nano-banana|aqa|vision/i;
const TIER_ORDER = { 'flash-lite': 0, flash: 1, pro: 2, other: 3 };
export const TIER_LABEL = { 'flash-lite': '경량 (Flash-Lite)', flash: 'Flash', pro: 'Pro', other: '기타' };
export function classify(name) { // -> null for non-text models
  if (!/^gemini/.test(name) || NON_TEXT.test(name)) return null;
  const tier = /flash-lite/.test(name) ? 'flash-lite' : /flash/.test(name) ? 'flash' : /pro/.test(name) ? 'pro' : 'other';
  return { name, tier, preview: /preview|-exp/.test(name), alias: /-latest$/.test(name) };
}
const ver = (n) => Number((n.match(/^gemini-([\d.]+)/) || [])[1]) || 0;

// Default order for ORDER ANALYSIS: lightweight, long-established models first (a simple structured-extraction task).
// A newer version number is NOT treated as better: unproven new/preview models only come after these.
export const PREFERRED = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-lite-latest', 'gemini-flash-latest'];
export function rankModels(textNames) {
  const set = new Set(textNames);
  const stable = (tier) => textNames.filter((n) => { const c = classify(n); return c && c.tier === tier && !c.preview && !c.alias && !PREFERRED.includes(n); }).sort((a, b) => ver(b) - ver(a));
  const previews = textNames.filter((n) => { const c = classify(n); return c && (c.tier === 'flash-lite' || c.tier === 'flash') && c.preview && !PREFERRED.includes(n); });
  return [...PREFERRED.filter((n) => set.has(n)), ...stable('flash-lite'), ...stable('flash'), ...previews].filter((n, i, a) => a.indexOf(n) === i);
}
export const pickModel = (names) => rankModels(names)[0];

// Candidate models for one request. `requested` is 'auto' or a model name from the catalog.
//   auto  → GEMINI_MODEL if set, else the ranked list (max POLICY.maxModels); fallback=false keeps only the first
//   named → that model first; fallback=true appends the ranked models as substitutes
export function buildCandidates({ requested = 'auto', fallback = true, textNames }) {
  const auto = process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL] : rankModels(textNames);
  let list;
  if (!requested || requested === 'auto') list = fallback ? auto : auto.slice(0, 1);
  else list = fallback ? [requested, ...rankModels(textNames).filter((n) => n !== requested)] : [requested];
  return list.slice(0, POLICY.maxModels);
}

let modelCache = null; // { models:[{name,tier,preview,alias}], at, total } — refreshed every 10 min
export const clearModelCache = () => { modelCache = null; };
export async function getModels({ budget, force = false } = {}) {
  if (!force && modelCache && Date.now() - modelCache.at < 600000) return { ok: true, models: modelCache.models, total: modelCache.total, cached: true, ms: 0 };
  const list = await call('/models?pageSize=200', undefined, { budget });
  if (list.status !== 200) return { ok: false, status: list.status, ms: list.ms, error: list.status === 'budget_exhausted' ? '이번 시간의 AI 호출 한도를 모두 썼어요.' : `models.list failed: HTTP ${list.status} ${errText(list)}` };
  const names = (list.json.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
  const models = names.map(classify).filter(Boolean).sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier] || a.name.localeCompare(b.name));
  modelCache = { models, at: Date.now(), total: names.length };
  return { ok: true, models, total: names.length, cached: false, ms: list.ms };
}

// Try `models` in order under POLICY. Every attempt is recorded so the UI can show exactly what happened.
export async function tryModels(models, body, { retries = POLICY.retries, backoffMs = POLICY.backoffMs, maxAttempts = POLICY.maxAttempts, timeoutMs = POLICY.timeoutMs, budget, sleep = sleepMs } = {}) {
  const t0 = performance.now();
  const attempts = [];
  let r = null, waitMs = 0, stopped = null;
  outer: for (const model of models) {
    for (let t = 1; t <= 1 + retries; t++) {
      if (attempts.length >= maxAttempts) { stopped = 'max_attempts'; break outer; }
      r = await call(`/models/${model}:generateContent`, body, { timeoutMs, budget });
      attempts.push({ model, try: t, status: r.status, ms: r.ms, ...(r.status === 200 ? {} : { error: errText(r) }) });
      if (r.status === 200) break outer;
      if (r.status === 'budget_exhausted') { stopped = 'budget'; break outer; }
      if (!SWITCHABLE.has(r.status)) break outer; // 400/401/403: nothing to gain from retrying or switching
      if (RETRY_SAME.has(r.status) && t <= retries) { const d = backoffMs[Math.min(t - 1, backoffMs.length - 1)]; waitMs += d; await sleep(d); continue; }
      break; // give up on this model, go to the next one
    }
  }
  return { r, model: attempts.at(-1)?.model ?? models[0], attempts, retries: attempts.filter((a) => a.try > 1).length, waitMs, totalMs: Math.round(performance.now() - t0), stopped };
}

const summary = (t, requested, candidates) => ({
  requestedModel: requested || 'auto', model: t.model, firstChoice: candidates[0],
  modelChanged: t.model !== candidates[0], retries: t.retries, waitMs: t.waitMs, attempts: t.attempts, stopped: t.stopped,
});

// One real generateContent call that must answer in JSON.
// opts: { model:'auto'|name, fallback:true, budget, maxOutputTokens, retries, sleep }
export async function generateJSON(prompt, { model: requested = 'auto', fallback = true, budget, maxOutputTokens = 4096, retries, sleep } = {}) {
  const t0 = performance.now();
  const base = { real: true };
  if (!isConfigured()) return { ...base, ok: false, status: 'not_configured', error: '서버에 GEMINI_API_KEY 환경변수가 없어요. Gemini 호출은 하지 않았어요.', hint: hintFor('not_configured') };
  const cat = await getModels({ budget });
  if (!cat.ok) return { ...base, ok: false, status: cat.status, ms: cat.ms, totalMs: Math.round(performance.now() - t0), error: cat.error, hint: hintFor(cat.status, cat.error) };
  const names = cat.models.map((m) => m.name);
  if (requested !== 'auto' && !names.includes(requested)) return { ...base, ok: false, status: 'invalid_model', error: `"${String(requested).slice(0, 60)}" 모델은 이 키로 쓸 수 없어요.`, hint: hintFor('invalid_model') };
  const candidates = buildCandidates({ requested, fallback, textNames: names });
  if (!candidates.length) return { ...base, ok: false, status: 404, error: '글 생성(generateContent)을 지원하는 모델이 없어요.', hint: hintFor(404) };

  const t = await tryModels(candidates, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens, responseMimeType: 'application/json' },
  }, { budget, retries, sleep });
  const r = t.r;
  const out = { ...base, ...summary(t, requested, candidates), fallbackUsed: t.model !== candidates[0], status: r.status, ms: r.ms, totalMs: Math.round(performance.now() - t0), modelSource: requested !== 'auto' ? 'selected' : process.env.GEMINI_MODEL ? 'GEMINI_MODEL' : 'auto' };
  if (r.status !== 200) {
    const msg = r.status === 'budget_exhausted' ? '이번 시간의 AI 호출 한도를 모두 썼어요.' : errText(r);
    return { ...out, ok: false, error: msg, hint: hintFor(r.status, msg) };
  }
  const cand = r.json.candidates?.[0];
  return {
    ...out, ok: true,
    text: cand?.content?.parts?.map((p) => p.text).join('') ?? '',
    finishReason: cand?.finishReason,
    tokensIn: r.json.usageMetadata?.promptTokenCount,
    tokensOut: r.json.usageMetadata?.candidatesTokenCount,
    blocked: r.json.promptFeedback?.blockReason || null,
  };
}

// Real connectivity check: models.list + one generateContent (same retry/fallback policy).
export async function checkGemini({ model: requested = 'auto', fallback = true, budget, sleep } = {}) {
  const t0 = performance.now();
  const out = { real: false, checkedAt: new Date().toISOString(), configured: isConfigured(), keyEnv: keyEnv(), ok: false, model: null, requestedModel: requested, modelSource: null, models: null, calls: [], error: null, hint: null };
  if (!out.configured) { out.error = '서버에 GEMINI_API_KEY 환경변수가 없어요. Gemini 호출은 하지 않았어요.'; out.hint = hintFor('not_configured'); return out; }

  out.real = true; // a real request to Google is made from here on (never a mock)
  const cat = await getModels({ budget, force: true });
  out.list = { status: cat.ok ? 200 : cat.status, ms: cat.ms };
  if (!cat.ok) { out.error = cat.error; out.hint = hintFor(cat.status, cat.error); out.totalMs = Math.round(performance.now() - t0); return out; }
  const names = cat.models.map((m) => m.name);
  out.models = { total: cat.total, generateContent: cat.total, text: names.length, gemini: names.slice(0, 40) };
  if (requested !== 'auto' && !names.includes(requested)) { out.error = `"${String(requested).slice(0, 60)}" 모델은 이 키로 쓸 수 없어요.`; out.hint = hintFor('invalid_model'); return out; }
  const candidates = buildCandidates({ requested, fallback, textNames: names });
  out.modelSource = requested !== 'auto' ? 'selected' : process.env.GEMINI_MODEL ? 'GEMINI_MODEL' : 'auto';
  out.candidates = candidates;
  if (!candidates.length) { out.error = '글 생성(generateContent)을 지원하는 모델이 없어요.'; out.hint = hintFor(404); return out; }

  const prompt = '손님이 "아아 하나 주세요"라고 말했다. 아아는 아이스 아메리카노다. 다음 JSON만 출력해: {"menu":"메뉴 이름","temperature":"HOT 또는 ICE","qty":숫자}';
  const t = await tryModels(candidates, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 1024, responseMimeType: 'application/json' },
  }, { budget, sleep });
  const r = t.r;
  const call1 = { model: t.model, status: r.status, ms: r.ms, attempts: t.attempts, retries: t.retries, modelChanged: t.model !== candidates[0], totalMs: t.totalMs, stopped: t.stopped };
  if (r.status === 200) {
    const cand = r.json.candidates?.[0];
    const text = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
    call1.text = text.slice(0, 300);
    try { call1.parsed = JSON.parse(text); call1.jsonOk = true; } catch { call1.jsonOk = false; call1.raw = text.slice(0, 160); }
    call1.finishReason = cand?.finishReason;
    call1.tokensIn = r.json.usageMetadata?.promptTokenCount;
    call1.tokensOut = r.json.usageMetadata?.candidatesTokenCount;
  } else { call1.error = r.status === 'budget_exhausted' ? '이번 시간의 AI 호출 한도를 모두 썼어요.' : errText(r); call1.hint = hintFor(r.status, call1.error); }
  out.calls.push(call1);
  out.model = t.model;
  out.totalMs = Math.round(performance.now() - t0);
  out.ok = call1.status === 200 && call1.jsonOk === true;
  if (!out.ok) {
    out.error = call1.error || 'generateContent가 올바른 JSON을 돌려주지 않았어요.';
    out.hint = call1.hint || '모델이 JSON이 아닌 응답을 돌려줬어요. 응답 내용을 확인하고, 계속되면 다른 모델을 선택해 보세요.';
  }
  return out;
}

// Which models can actually answer right now? One tiny real request per model (no retries, no fallback).
export async function probeModels(names, { budget, timeoutMs = 12000 } = {}) {
  const results = [];
  for (const name of names) {
    const c = classify(name);
    const r = await call(`/models/${name}:generateContent`, {
      contents: [{ role: 'user', parts: [{ text: 'JSON {"ok":true} 만 출력해.' }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 256, responseMimeType: 'application/json' },
    }, { timeoutMs, budget });
    const stopped = r.status === 'budget_exhausted';
    results.push({ model: name, tier: c?.tier ?? 'other', preview: !!c?.preview, status: r.status, ms: r.ms, ok: r.status === 200, ...(r.status === 200 ? {} : { error: stopped ? '호출 한도 초과' : errText(r), hint: hintFor(r.status, errText(r)) }) });
    if (stopped) break;
  }
  return results;
}
