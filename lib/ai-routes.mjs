// /api/ai/* routes for the AI Lab (experiment branch only). Public test API → every POST is guarded.
import { checkGemini, isConfigured, getModels, probeModels, rankModels, buildCandidates, PREFERRED, POLICY, TIER_LABEL, hintFor } from './gemini.mjs';
import { analyzeOrder, cleanText, BENCH, judgeBench } from './ai-order.mjs';
import { analyzeRecommend } from './ai-recommend.mjs';
import { LIMITS, enabled, tokenRequired, tokenOk, sameOrigin, rateLimit, peekBudget, spendOne, readJson } from './guard.mjs';

const fail = (send, res, code, error, message, extra = {}) => send(res, code, { error, message, ...extra });

// Shared gate for POST routes: origin → token → rate limit → (optional) hourly budget pre-check.
// The budget is only *peeked* here; lib/gemini.mjs charges one unit per real Google request (retries and fallbacks included).
// Returns null when the request may proceed, otherwise has already answered.
function gate(req, res, send, bucket, max, cost = 0) {
  if (!sameOrigin(req)) return fail(send, res, 403, 'cross_origin', '이 사이트에서 보낸 요청만 받을 수 있어요.');
  if (!tokenOk(req)) return fail(send, res, 401, 'token_required', '접근 토큰이 필요하거나 올바르지 않아요. 연결 상태 카드에서 토큰을 입력해 주세요.');
  const rl = rateLimit(req, bucket, max);
  if (!rl.ok) return fail(send, res, 429, 'rate_limited', `요청이 너무 많아요. ${rl.retryAfter}초 뒤에 다시 시도해 주세요.`, { retryAfter: rl.retryAfter });
  if (cost) {
    const b = peekBudget(cost);
    if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)를 모두 썼어요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
  }
  return null;
}

function badBody(req, res, send, e) {
  if (e.closeAfterReply) res.once('finish', () => req.destroy()); // answer 413 first, then stop reading the oversized upload
  return fail(send, res, e.code || 400, e.message, e.code === 413 ? `요청이 너무 커요. ${LIMITS.maxBody}바이트 이하로 보내 주세요.` : '요청 형식이 올바르지 않아요.');
}
const readObject = async (req, res, send) => {
  const body = await readJson(req).catch((e) => e);
  if (body instanceof Error) { badBody(req, res, send, body); return null; }
  if (!body || typeof body !== 'object' || Array.isArray(body)) { fail(send, res, 400, 'bad_json', '요청 형식이 올바르지 않아요.'); return null; }
  return body;
};
// 'auto' or a model name shaped like a Gemini model id. Whether this key may use it is checked against the live catalog.
const modelParam = (v) => (v === undefined || v === null || v === 'auto' ? 'auto' : typeof v === 'string' && /^[a-z0-9][a-z0-9.-]{0,59}$/i.test(v) ? v : null);

let statusCache = null; // GET /api/ai/status: at most one real check per minute
export async function aiRoute(req, res, url, { send, loadMenus }) {
  const p = url.pathname;
  if (!enabled()) return fail(send, res, 404, 'disabled', 'AI Lab이 꺼져 있어요.');

  if (req.method === 'GET' && p === '/api/ai/config') {
    return send(res, 200, {
      enabled: true, keyConfigured: isConfigured(), tokenRequired: tokenRequired(), pinnedModel: process.env.GEMINI_MODEL || null,
      limits: { maxChars: LIMITS.maxChars, checkPerMin: LIMITS.checkPerMin, orderPerMin: LIMITS.orderPerMin, hourlyCap: LIMITS.hourlyCap },
      policy: { retriesPerModel: POLICY.retries, backoffMs: POLICY.backoffMs, maxModels: POLICY.maxModels, maxAttempts: POLICY.maxAttempts },
    });
  }

  if (req.method === 'GET' && p === '/api/ai/status') {
    const rl = rateLimit(req, 'status', 6);
    if (!rl.ok) return fail(send, res, 429, 'rate_limited', `요청이 너무 많아요. ${rl.retryAfter}초 뒤에 다시 시도해 주세요.`, { retryAfter: rl.retryAfter });
    if (!statusCache || Date.now() - statusCache.at > 60000) {
      if (isConfigured() && !peekBudget(2).ok) return fail(send, res, 429, 'budget_exhausted', '이번 시간의 AI 호출 한도를 모두 썼어요.');
      statusCache = { at: Date.now(), p: checkGemini({ budget: spendOne }) };
    }
    return send(res, 200, await statusCache.p);
  }

  // Catalog of text models this key can call (Flash-Lite / Flash / Pro / other), cached for 10 minutes.
  if (req.method === 'GET' && p === '/api/ai/models') {
    const rl = rateLimit(req, 'models', LIMITS.modelsPerMin);
    if (!rl.ok) return fail(send, res, 429, 'rate_limited', `요청이 너무 많아요. ${rl.retryAfter}초 뒤에 다시 시도해 주세요.`, { retryAfter: rl.retryAfter });
    if (!isConfigured()) return send(res, 200, { ok: false, configured: false, models: [], error: '서버에 GEMINI_API_KEY 환경변수가 없어요.', hint: hintFor('not_configured') });
    const cat = await getModels({ budget: spendOne, force: url.searchParams.get('refresh') === '1' }); // only a live refresh spends budget
    if (!cat.ok) return send(res, 200, { ok: false, configured: true, models: [], status: cat.status, error: cat.error, hint: hintFor(cat.status, cat.error) });
    const names = cat.models.map((m) => m.name);
    return send(res, 200, {
      ok: true, configured: true, cached: cat.cached, ms: cat.ms, total: cat.total,
      models: cat.models.map((m) => ({ ...m, preferred: PREFERRED.includes(m.name) })),
      autoOrder: buildCandidates({ requested: 'auto', fallback: true, textNames: names }),
      pinned: process.env.GEMINI_MODEL || null, tiers: TIER_LABEL,
    });
  }

  if (req.method === 'POST' && p === '/api/ai/check') {
    const stop = gate(req, res, send, 'check', LIMITS.checkPerMin, isConfigured() ? 2 : 0);
    if (stop !== null) return stop;
    const body = await readObject(req, res, send);
    if (!body) return;
    const model = modelParam(body.model);
    if (model === null) return fail(send, res, 400, 'invalid_model', '모델 이름 형식이 올바르지 않아요.');
    return send(res, 200, await checkGemini({ model, fallback: body.fallback !== false, budget: spendOne }));
  }

  // "Which models can actually answer right now?" — one tiny real request per model, no retries, no fallback.
  if (req.method === 'POST' && p === '/api/ai/probe') {
    const stop = gate(req, res, send, 'probe', LIMITS.probePerMin);
    if (stop !== null) return stop;
    const body = await readObject(req, res, send);
    if (!body) return;
    if (!isConfigured()) return send(res, 200, { ok: false, configured: false, results: [], error: '서버에 GEMINI_API_KEY 환경변수가 없어요.', hint: hintFor('not_configured') });
    const cat = await getModels({ budget: spendOne });
    if (!cat.ok) return send(res, 200, { ok: false, configured: true, results: [], status: cat.status, error: cat.error, hint: hintFor(cat.status, cat.error) });
    const names = cat.models.map((m) => m.name);
    let targets;
    if (Array.isArray(body.models)) {
      targets = [...new Set(body.models.map(String))];
      if (!targets.length || targets.length > LIMITS.probeMax || targets.some((n) => !names.includes(n))) return fail(send, res, 400, 'invalid_model', `점검할 모델은 1~${LIMITS.probeMax}개이고 모두 모델 목록에 있어야 해요.`);
    } else { // default: the Flash / Flash-Lite models, ranked order first
      const lite = cat.models.filter((m) => m.tier === 'flash-lite' || m.tier === 'flash').map((m) => m.name);
      targets = [...rankModels(names).filter((n) => lite.includes(n)), ...lite].filter((n, i, a) => a.indexOf(n) === i).slice(0, LIMITS.probeMax);
    }
    const b = peekBudget(targets.length);
    if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)가 부족해요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
    const t0 = performance.now();
    const results = await probeModels(targets, { budget: spendOne });
    console.log(`[ai] probe models=${results.length} ok=${results.filter((r) => r.ok).length} ms=${Math.round(performance.now() - t0)}`);
    return send(res, 200, { ok: true, configured: true, results, callable: results.filter((r) => r.ok).length, totalMs: Math.round(performance.now() - t0) });
  }

  // One benchmark case: sentence #index analysed by one model. The browser loops over models × 5 sentences (progress + stop button).
  if (req.method === 'POST' && p === '/api/ai/bench') {
    const stop = gate(req, res, send, 'bench', LIMITS.benchPerMin, 1);
    if (stop !== null) return stop;
    const body = await readObject(req, res, send);
    if (!body) return;
    const model = modelParam(body.model);
    const i = body.index;
    if (model === null) return fail(send, res, 400, 'invalid_model', '모델 이름 형식이 올바르지 않아요.');
    if (!Number.isInteger(i) || i < 0 || i >= BENCH.length) return fail(send, res, 400, 'invalid_index', `index는 0~${BENCH.length - 1}이어야 해요.`);
    const out = await analyzeOrder(BENCH[i].text, { menus: await loadMenus(), model, fallback: body.fallback === true, budget: spendOne });
    const j = judgeBench(i, out);
    console.log(`[ai] bench #${i} model=${out.model ?? model} ok=${out.ok} pass=${j.pass} http=${out.httpStatus ?? '-'} ms=${out.totalMs ?? '-'}`);
    return send(res, 200, {
      index: i, text: BENCH[i].text, expected: BENCH[i].label, pass: j.pass, got: j.got, reason: j.reason ?? null,
      ok: out.ok, error: out.error ?? null, hint: out.hint ?? null, status: out.result?.status ?? null,
      requestedModel: out.requestedModel, model: out.model, modelChanged: out.modelChanged, retries: out.retries, attempts: out.attempts,
      httpStatus: out.httpStatus, ms: out.ms, totalMs: out.totalMs,
    });
  }

  if (req.method === 'POST' && p === '/api/ai/order') {
    const stop = gate(req, res, send, 'order', LIMITS.orderPerMin); // origin → token → rate limit, all before reading the body
    if (stop !== null) return stop;
    const body = await readObject(req, res, send);
    if (!body) return;
    const text = cleanText(body.text);
    const mock = body.mock === true;
    const model = modelParam(body.model);
    if (typeof body.text !== 'string' || !text) return fail(send, res, 400, 'invalid_text', '주문 문장을 입력해 주세요.');
    if (text.length > LIMITS.maxChars) return fail(send, res, 400, 'text_too_long', `주문 문장은 ${LIMITS.maxChars}자까지만 입력할 수 있어요. (지금 ${text.length}자)`);
    if (model === null) return fail(send, res, 400, 'invalid_model', '모델 이름 형식이 올바르지 않아요.');
    if (!mock) { // Mock makes no Gemini request, so it costs no budget
      const b = peekBudget(1);
      if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)를 모두 썼어요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
    }
    const out = await analyzeOrder(text, { menus: await loadMenus(), mock, model, fallback: body.fallback !== false, budget: spendOne });
    console.log(`[ai] order source=${out.source} ok=${out.ok} status=${out.result?.status ?? '-'} model=${out.model ?? '-'} retries=${out.retries ?? 0} changed=${out.modelChanged ?? false} http=${out.httpStatus ?? '-'} ms=${out.totalMs ?? out.ms ?? '-'}`); // no customer text, no key
    return send(res, 200, out);
  }

  // Natural-language menu recommendation (real Gemini only; picks are re-validated against the menu data).
  if (req.method === 'POST' && p === '/api/ai/recommend') {
    const stop = gate(req, res, send, 'recommend', LIMITS.orderPerMin);
    if (stop !== null) return stop;
    const body = await readObject(req, res, send);
    if (!body) return;
    const text = cleanText(body.text);
    const model = modelParam(body.model);
    if (typeof body.text !== 'string' || !text) return fail(send, res, 400, 'invalid_text', '추천 요청 문장을 입력해 주세요.');
    if (text.length > LIMITS.maxChars) return fail(send, res, 400, 'text_too_long', `문장은 ${LIMITS.maxChars}자까지만 입력할 수 있어요. (지금 ${text.length}자)`);
    if (model === null) return fail(send, res, 400, 'invalid_model', '모델 이름 형식이 올바르지 않아요.');
    const b = peekBudget(1);
    if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)를 모두 썼어요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
    const out = await analyzeRecommend(text, { menus: await loadMenus(), model, fallback: body.fallback !== false, budget: spendOne });
    console.log(`[ai] recommend ok=${out.ok} status=${out.result?.status ?? '-'} picks=${out.result?.picks?.length ?? '-'} model=${out.model ?? '-'} retries=${out.retries ?? 0} changed=${out.modelChanged ?? false} http=${out.httpStatus ?? '-'} ms=${out.totalMs ?? '-'}`); // no customer text, no key
    return send(res, 200, out);
  }

  return fail(send, res, 404, 'not_found', '없는 주소예요.');
}
