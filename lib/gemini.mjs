// Gemini REST helpers (zero-dependency). The API key is read from the server environment only;
// it is never returned to the client, logged or printed (all error text is redacted).

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const keyEnv = () => (process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : null);
const getKey = () => { const k = keyEnv(); return k ? process.env[k] : null; };
const redact = (s) => { const k = getKey(); return k ? String(s).split(k).join('[REDACTED]') : String(s); };

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

// GEMINI_MODEL if set, else the newest stable "flash" model that supports generateContent.
export function pickModel(names) {
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;
  const ver = (n) => Number((n.match(/^gemini-([\d.]+)/) || [])[1]) || 0;
  return names.filter((n) => /^gemini-[\d.]+-flash$/.test(n)).sort((a, b) => ver(b) - ver(a))[0]
    || names.find((n) => n.includes('flash') && !n.includes('lite'))
    || names[0];
}

// Real connectivity check: models.list + `runs` generateContent calls. Returns plain data without secrets.
export async function checkGemini({ runs = 1 } = {}) {
  const out = { real: false, checkedAt: new Date().toISOString(), configured: !!keyEnv(), keyEnv: keyEnv(), ok: false, model: null, modelSource: null, models: null, calls: [], error: null };
  if (!out.configured) { out.error = 'GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in this environment. No API call was made.'; return out; }

  out.real = true; // a real request to Google is made from here on (never a mock)
  const list = await gemini('/models?pageSize=200');
  out.list = { status: list.status, ms: list.ms };
  if (list.status !== 200) { out.error = `models.list failed: HTTP ${list.status} ${errText(list)}`; return out; }
  const usable = (list.json.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent')).map((m) => m.name.replace('models/', ''));
  out.models = { total: list.json.models?.length ?? 0, generateContent: usable.length, gemini: usable.filter((n) => n.startsWith('gemini')).slice(0, 30) };
  out.model = pickModel(usable);
  out.modelSource = process.env.GEMINI_MODEL ? 'GEMINI_MODEL' : 'auto';
  if (!out.model) { out.error = 'No model supporting generateContent is available for this key.'; return out; }

  const prompt = '손님이 "아아 하나 주세요"라고 말했다. 아아는 아이스 아메리카노다. 다음 JSON만 출력해: {"menu":"메뉴 이름","temperature":"HOT 또는 ICE","qty":숫자}';
  for (let i = 0; i < runs; i++) {
    const r = await gemini(`/models/${out.model}:generateContent`, {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    });
    const call = { status: r.status, ms: r.ms };
    if (r.status === 200) {
      const cand = r.json.candidates?.[0];
      const text = cand?.content?.parts?.map((p) => p.text).join('') ?? '';
      try { call.parsed = JSON.parse(text); call.jsonOk = true; } catch { call.jsonOk = false; call.raw = text.slice(0, 160); }
      call.finishReason = cand?.finishReason;
      call.tokensIn = r.json.usageMetadata?.promptTokenCount;
      call.tokensOut = r.json.usageMetadata?.candidatesTokenCount;
    } else call.error = errText(r);
    out.calls.push(call);
  }
  out.ok = out.calls.length > 0 && out.calls.every((c) => c.status === 200 && c.jsonOk);
  if (!out.ok) out.error = out.calls.find((c) => c.error)?.error || 'generateContent did not return valid JSON.';
  return out;
}
