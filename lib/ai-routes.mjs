// /api/ai/* routes for the AI Lab (experiment branch only). Public test API → every POST is guarded.
import { checkGemini, isConfigured } from './gemini.mjs';
import { analyzeOrder, cleanText } from './ai-order.mjs';
import { LIMITS, enabled, tokenRequired, tokenOk, sameOrigin, rateLimit, takeBudget, readJson } from './guard.mjs';

const fail = (send, res, code, error, message, extra = {}) => send(res, code, { error, message, ...extra });

// Shared gate for POST routes. Returns null when the request may proceed, otherwise has already answered.
function gate(req, res, send, bucket, max, cost) {
  if (!sameOrigin(req)) return fail(send, res, 403, 'cross_origin', '이 사이트에서 보낸 요청만 받을 수 있어요.');
  if (!tokenOk(req)) return fail(send, res, 401, 'token_required', '접근 토큰이 필요하거나 올바르지 않아요. 페이지 오른쪽 위에서 토큰을 입력해 주세요.');
  const rl = rateLimit(req, bucket, max);
  if (!rl.ok) return fail(send, res, 429, 'rate_limited', `요청이 너무 많아요. ${rl.retryAfter}초 뒤에 다시 시도해 주세요.`, { retryAfter: rl.retryAfter });
  if (cost) {
    const b = takeBudget(cost);
    if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)를 모두 썼어요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
  }
  return null;
}

function badBody(req, res, send, e) {
  if (e.closeAfterReply) res.once('finish', () => req.destroy()); // answer 413 first, then stop reading the oversized upload
  return fail(send, res, e.code || 400, e.message, e.code === 413 ? `요청이 너무 커요. ${LIMITS.maxBody}바이트 이하로 보내 주세요.` : '요청 형식이 올바르지 않아요.');
}

let statusCache = null; // GET /api/ai/status: at most one real check per minute
export async function aiRoute(req, res, url, { send, loadMenus }) {
  const p = url.pathname;
  if (!enabled()) return fail(send, res, 404, 'disabled', 'AI Lab이 꺼져 있어요.');

  if (req.method === 'GET' && p === '/api/ai/config') {
    return send(res, 200, { enabled: true, keyConfigured: isConfigured(), tokenRequired: tokenRequired(), limits: { maxChars: LIMITS.maxChars, checkPerMin: LIMITS.checkPerMin, orderPerMin: LIMITS.orderPerMin, hourlyCap: LIMITS.hourlyCap } });
  }

  if (req.method === 'GET' && p === '/api/ai/status') {
    const rl = rateLimit(req, 'status', 6);
    if (!rl.ok) return fail(send, res, 429, 'rate_limited', `요청이 너무 많아요. ${rl.retryAfter}초 뒤에 다시 시도해 주세요.`, { retryAfter: rl.retryAfter });
    if (!statusCache || Date.now() - statusCache.at > 60000) {
      const b = isConfigured() ? takeBudget(2) : { ok: true };
      if (!b.ok) return fail(send, res, 429, 'budget_exhausted', '이번 시간의 AI 호출 한도를 모두 썼어요.', { retryAfter: b.retryAfter });
      statusCache = { at: Date.now(), p: checkGemini({ runs: 1 }) };
    }
    return send(res, 200, await statusCache.p);
  }

  if (req.method === 'POST' && p === '/api/ai/check') {
    // cost 2 = models.list + one generateContent
    const stop = gate(req, res, send, 'check', LIMITS.checkPerMin, isConfigured() ? 2 : 0);
    if (stop !== null) return stop;
    try { await readJson(req); } catch (e) { return badBody(req, res, send, e); }
    return send(res, 200, await checkGemini({ runs: 1 }));
  }

  if (req.method === 'POST' && p === '/api/ai/order') {
    const stop = gate(req, res, send, 'order', LIMITS.orderPerMin, 0); // origin → token → rate limit, all before reading the body
    if (stop !== null) return stop;
    const body = await readJson(req).catch((e) => e);
    if (body instanceof Error) return badBody(req, res, send, body);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(send, res, 400, 'bad_json', '요청 형식이 올바르지 않아요.');
    const text = cleanText(body.text);
    const mock = body.mock === true;
    if (typeof body.text !== 'string' || !text) return fail(send, res, 400, 'invalid_text', '주문 문장을 입력해 주세요.');
    if (text.length > LIMITS.maxChars) return fail(send, res, 400, 'text_too_long', `주문 문장은 ${LIMITS.maxChars}자까지만 입력할 수 있어요. (지금 ${text.length}자)`);
    if (!mock) { // Mock makes no Gemini request, so it costs no budget
      const b = takeBudget(1);
      if (!b.ok) return fail(send, res, 429, 'budget_exhausted', `이번 시간의 AI 호출 한도(${LIMITS.hourlyCap}회)를 모두 썼어요. 약 ${Math.ceil(b.retryAfter / 60)}분 뒤에 다시 시도해 주세요.`, { retryAfter: b.retryAfter });
    }
    const out = await analyzeOrder(text, { menus: await loadMenus(), mock });
    console.log(`[ai] order source=${out.source} ok=${out.ok} status=${out.result?.status ?? '-'} http=${out.httpStatus ?? '-'} ms=${out.ms ?? '-'}`); // no customer text, no key
    return send(res, 200, out);
  }

  return fail(send, res, 404, 'not_found', '없는 주소예요.');
}
