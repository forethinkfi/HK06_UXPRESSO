// UXPRESSO kiosk prototype server: zero-dependency static host + menu API (+ optional OpenAI).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const KEY = process.env.OPENAI_API_KEY; // server-side only, never sent to client
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };

const load = async () => JSON.parse(await readFile(join(ROOT, 'data/menus.json'), 'utf8'));
const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((ok) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch { ok({}); } }); });

async function openai(system, user) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
    signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ model: MODEL, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
  });
  if (!r.ok) throw new Error('openai ' + r.status);
  return JSON.parse((await r.json()).choices[0].message.content);
}

// Catalog sent to AI contains menu info only — never personal or payment data.
const catalog = (menus) => menus.filter((m) => m.available).map(({ id, name, category, description, tags, temperature, price }) => ({ id, name, category, description, tags, temperature, price }));

// Fallback search: match query words against name/category/tags/description.
const SYN = { 달콤: '달콤', 단: '달콤', 달아: '달콤', 차가: '시원', 시원: '시원', 아이스: '시원', 따뜻: '따뜻', 뜨거: '따뜻', 상큼: '상큼', 새콤: '상큼', 고소: '고소', 진한: '진한', 부드: '부드러운', 과일: '과일', '커피 말고': '!커피', 커피말고: '!커피', 논커피: '!커피', 우유: '우유' };
function keywordSearch(menus, q) {
  const hits = Object.entries(SYN).filter(([k]) => q.includes(k)).map(([, v]) => v);
  const wantNo = hits.includes('!커피');
  const want = hits.filter((h) => h !== '!커피');
  return menus.filter((m) => m.available).map((m) => {
    if (wantNo && m.tags.includes('커피')) return [m, -1];
    const hay = [m.name, m.category, m.description, ...m.tags, ...m.temperature.map((t) => (t === 'ICE' ? '시원' : '따뜻'))].join(' ');
    return [m, want.filter((w) => hay.includes(w)).length + (hay.includes(q) ? 2 : 0)];
  }).filter(([, s]) => s > 0 && (want.length === 0 || s >= Math.min(2, want.length))).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([m]) => m.id);
}

async function api(req, res, url) {
  const data = await load();
  const p = url.pathname;
  if (req.method === 'GET' && p === '/api/categories') return send(res, 200, data.categories);
  if (req.method === 'GET' && p === '/api/menus') {
    const tags = (url.searchParams.get('tags') || '').split(',').filter(Boolean);
    return send(res, 200, data.menus.filter((m) => tags.every((t) => m.tags.includes(t))));
  }
  const one = p.match(/^\/api\/menus\/([\w-]+)$/);
  if (req.method === 'GET' && one) {
    const m = data.menus.find((x) => x.id === one[1]);
    return m ? send(res, 200, m) : send(res, 404, { error: 'not_found' });
  }
  if (req.method === 'POST' && p === '/api/search') {
    const { query = '' } = await readBody(req);
    const q = String(query).slice(0, 100);
    let ids, via = 'keyword';
    if (KEY) {
      try {
        const out = await openai('너는 카페 키오스크의 메뉴 검색기다. 주어진 메뉴 목록에서 고객 요청에 맞는 메뉴 id만 골라 {"ids":[...]} JSON으로 최대 6개 반환한다. 목록에 없는 id는 절대 만들지 않는다.', `메뉴: ${JSON.stringify(catalog(data.menus))}\n요청: ${q}`);
        ids = out.ids; via = 'ai';
      } catch { /* fall through to keyword search */ }
    }
    ids ??= keywordSearch(data.menus, q);
    const valid = new Set(data.menus.filter((m) => m.available).map((m) => m.id));
    return send(res, 200, { via, ids: [...new Set(ids)].filter((i) => valid.has(i)) }); // AI output re-validated against registry
  }
  if (req.method === 'POST' && p === '/api/ask') {
    const { question = '', menuId } = await readBody(req);
    const m = data.menus.find((x) => x.id === menuId);
    const fallback = { via: 'none', answer: '이 질문은 제가 확인할 수 없어요. 아래 "직원 도움 요청"을 눌러 주세요.' };
    if (!KEY || !m) return send(res, 200, fallback);
    try {
      const out = await openai('너는 카페 키오스크 도우미다. 주어진 메뉴 정보에 있는 내용만 쉬운 한국어 두 문장 이내로 {"answer":"..."} JSON으로 답한다. 정보에 없으면 "확인되지 않았어요"라고 답한다. 가격·옵션·알레르기·영양정보를 지어내지 않는다. 알레르기 질문은 직원 확인을 안내한다.', `메뉴 정보: ${JSON.stringify(m)}\n질문: ${String(question).slice(0, 200)}`);
      return send(res, 200, { via: 'ai', answer: String(out.answer || fallback.answer) });
    } catch { return send(res, 200, fallback); }
  }
  send(res, 404, { error: 'not_found' });
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    let f = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const base = f.startsWith('/data/') ? ROOT : join(ROOT, 'public');
    const buf = await readFile(join(base, f));
    res.writeHead(200, { 'content-type': (MIME[extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(buf);
  } catch { send(res, 404, { error: 'not_found' }); }
}).listen(PORT, () => console.log(`UXPRESSO kiosk → http://localhost:${PORT}  (AI: ${KEY ? 'on' : 'off, keyword fallback'})`));
