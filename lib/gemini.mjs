// Gemini REST helpers (zero-dependency). The API key is read from the server environment only;
// it is never returned to the client, logged or printed (all error text is redacted).

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const keyEnv = () => (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null);
const getKey = () => { const k = keyEnv(); return k ? process.env[k] : null; };
const redact = (s) => { const k = getKey(); return k ? String(s).split(k).join('[REDACTED]') : String(s); };

export const isConfigured = () => !!keyEnv();

export async function gemini(path, body) {
  const t0 = performance.now();
  try {
    const res = await fetch(BASE + path, {
      method: body ? 'POST' : 'GET',
      headers: { 'x-goog-api-key': getKey(), ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* keep raw text */ }
    return { status: res.status, ms: Math.round(performance.now() - t0), json, text: redact(text) };
  } catch (e) {
    return { status: 0, ms: Math.round(performance.now() - t0), json: null, text: redact(`${e.name}: ${e.message}`) };
  }
}

export const errText = (r) => redact(r.json?.error ? `${r.json.error.status || ''} ${r.json.error.message || ''}`.trim() : r.text.slice(0, 200));

// Plain-Korean cause + fix for the most common failures (shown on the AI Lab page).
export function hintFor(status, message = '') {
  if (status === 'not_configured') return '서버가 GEMINI_API_KEY를 읽지 못했어요. Render → Environment에 이름을 정확히 GEMINI_API_KEY로 추가하고 저장한 뒤 다시 배포(Deploy)해 주세요.';
  if (status === 0) return '서버가 Google API에 연결하지 못했거나 20초 안에 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요. 계속되면 Render 로그를 확인해 주세요.';
  if (status === 400 && /api key/i.test(message)) return 'API 키가 올바르지 않아요. Google AI Studio에서 키를 확인하고, Render의 GEMINI_API_KEY 값을 다시 저장한 뒤 재배포해 주세요.';
  if (status === 400) return 'Google이 요청 형식을 받아들이지 않았어요. 아래 오류 내용을 개발 담당자에게 전달해 주세요.';
  if (status === 401 || status === 403) return '키 권한 문제예요. 키가 폐기되지 않았는지, Generative Language API가 사용 설정되어 있는지, 키에 IP·사이트 제한이 걸려 있지 않은지 Google AI Studio·Cloud Console에서 확인해 주세요.';
  if (status === 404) return '선택한 모델을 찾을 수 없어요. Render에 GEMINI_MODEL이 있다면 지우거나 올바른 모델 이름으로 바꿔 주세요. (비워 두면 자동 선택)';
  if (status === 429) return '사용 한도를 넘었어요. 잠시 후 다시 시도하거나, Google AI Studio에서 사용량·요금제를 확인해 주세요.';
  if (status >= 500) return 'Google 서버의 일시적인 오류예요. 잠시 후 다시 시도해 주세요.';
  return '예상하지 못한 오류예요. 아래 오류 내용을 확인해 주세요.';
}

// GEMINI_MODEL if set, else the newest stable "flash" model that supports generateContent.
export function pickModel(names) {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  const ver = (n) => Number((n.match(/^gemini-([\d.]+)/) || [])[1]) || 0;
  return names.filter((n) => /^gemini-[\d.]+-flash$/.test(n)).sort((a, b) => ver(b) - ver(a))[0]
    || names.find((n) => n.includes('flash') && !n.includes('lite'))
    || names[0];
}

let modelCache = null; // { model, at, listMs, total } — refreshed every 10 min
export async function resolveModel() {
  if (process.env.GEMINI_MODEL) return { model: process.env.GEMINI_MODEL, source: 'GEMINI_MODEL' };
  if (modelCache && Date.now() - modelCache.at < 600000) return { model: modelCache.model, source: 'auto(cached)' };
  const list = await gemini('/models?pageSize=200');
  if (list.status !== 200) return { error: `models.list failed: HTTP ${list.status} ${errText(list)}`, status: list.status, ms: list.ms };
  const names = (list.json.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
  const model = pickModel(names);
  if (!model) return { error: 'No model supporting generateContent is available for this key.', status: 404, ms: list.ms };
  modelCache = { model, at: Date.now() };
  return { model, source: 'auto', ms: list.ms };
}

// One real generateContent call that must answer in JSON. Never falls back to a mock.
export async function generateJSON(prompt, { maxOutputTokens = 2048 } = {}) {
  const base = { real: true };
  if (!isConfigured()) return { ...base, ok: false, status: 'not_configured', error: '서버에 GEMINI_API_KEY 환경변수가 없어요. Gemini 호출은 하지 않았어요.', hint: hintFor('not_configured') };
  const m = await resolveModel();
  if (m.error) return { ...base, ok: false, status: m.status, ms: m.ms, error: m.error, hint: hintFor(m.status, m.error) };
  const r = await gemini(`/models/${m.model}:generateContent`, {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens, responseMimeType: 'application/json' },
  });
  const out = { ...base, model: m.model, modelSource: m.source, status: r.status, ms: r.ms };
  if (r.status !== 200) {
    if (r.status === 404) modelCache = null;
    return { ...out, ok: false, error: errText(r), hint: hintFor(r.status, errText(r)) };
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

// Real connectivity check: models.list + `runs` generateContent calls. Returns plain data without secrets.
export async function checkGemini({ runs = 1 } = {}) {
  const out = { real: false, checkedAt: new Date().toISOString(), configured: isConfigured(), keyEnv: keyEnv(), ok: false, model: null, modelSource: null, models: null, calls: [], error: null, hint: null };
  if (!out.configured) { out.error = '서버에 GEMINI_API_KEY 환경변수가 없어요. Gemini 호출은 하지 않았어요.'; out.hint = hintFor('not_configured'); return out; }

  out.real = true; // a real request to Google is made from here on (never a mock)
  const list = await gemini('/models?pageSize=200');
  out.list = { status: list.status, ms: list.ms };
  if (list.status !== 200) { out.error = `models.list failed: HTTP ${list.status} ${errText(list)}`; out.hint = hintFor(list.status, errText(list)); return out; }
  const usable = (list.json.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
  out.models = { total: list.json.models?.length ?? 0, generateContent: usable.length, gemini: usable.filter((n) => n.startsWith('gemini')).slice(0, 30) };
  out.model = pickModel(usable);
  out.modelSource = process.env.GEMINI_MODEL ? 'GEMINI_MODEL' : 'auto';
  if (!out.model) { out.error = 'No model supporting generateContent is available for this key.'; out.hint = hintFor(404); return out; }

  const prompt = '손님이 "아아 하나 주세요"라고 말했다. 아아는 아이스 아메리카노다. 다음 JSON만 출력해: {"menu":"메뉴 이름","temperature":"HOT 또는 ICE","qty":숫자}';
  for (let i = 0; i < runs; i++) {
    const r = await gemini(`/models/${out.model}:generateContent`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 512, responseMimeType: 'application/json' },
    });
    const call = { status: r.status, ms: r.ms };
    if (r.status === 200) {
      const cand = r.json.candidates?.[0];
      const text = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
      call.text = text.slice(0, 300);
      try { call.parsed = JSON.parse(text); call.jsonOk = true; } catch { call.jsonOk = false; call.raw = text.slice(0, 160); }
      call.finishReason = cand?.finishReason;
      call.tokensIn = r.json.usageMetadata?.promptTokenCount;
      call.tokensOut = r.json.usageMetadata?.candidatesTokenCount;
    } else { call.error = errText(r); call.hint = hintFor(r.status, call.error); }
    out.calls.push(call);
  }
  out.ok = out.calls.length > 0 && out.calls.every((c) => c.status === 200 && c.jsonOk);
  if (!out.ok) {
    const bad = out.calls.find((c) => c.error);
    out.error = bad?.error || 'generateContent가 올바른 JSON을 돌려주지 않았어요.';
    out.hint = bad?.hint || '모델이 JSON이 아닌 응답을 돌려줬어요. 응답 내용을 확인하고, 계속되면 GEMINI_MODEL을 다른 모델로 지정해 보세요.';
  }
  return out;
}
