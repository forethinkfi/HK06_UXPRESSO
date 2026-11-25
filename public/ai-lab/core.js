// AI Lab shared helpers. Every string from the server is inserted with textContent (never innerHTML).
export const $ = (id) => document.getElementById(id);
export const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => { if (k !== null && k !== undefined && k !== false) n.append(k instanceof Node ? k : document.createTextNode(String(k))); });
  return n;
};
export const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage may be blocked */ } },
};
export const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;
export const TEMP = { HOT: '따뜻하게', ICE: '차갑게' };
export const kv = (k, v) => el('li', {}, el('span', {}, k), el('b', {}, v));
export const badge = (text, cls) => el('span', { className: `badge ${cls}` }, text);

// Shared state. `host` is the bridge to the kiosk when this page runs inside the kiosk overlay (see index.js).
export const ctx = { config: null, calls: 0, mock: false, host: { embedded: false }, logEl: null, counterEl: null };

export function log(kind, label, detail = '') {
  if (!ctx.logEl) return;
  const t = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  ctx.logEl.prepend(el('li', {}, el('time', {}, t), el('span', { className: kind }, kind === 'ok' ? '성공' : kind === 'warn' ? '주의' : '실패'), el('span', {}, `${label}${detail ? ' · ' + detail : ''}`)));
}
export const showCounter = () => { if (ctx.counterEl) ctx.counterEl.textContent = `이 페이지에서 보낸 요청 ${ctx.calls}건`; };

// Same-origin fetch with the optional access token. Resolves with { http, ms, json } and never throws.
export async function api(path, body) {
  ctx.calls++; showCounter();
  const headers = { 'content-type': 'application/json' };
  const tok = store.get('aiLabToken');
  if (tok) headers['x-ai-lab-token'] = tok;
  const t0 = performance.now();
  try {
    const res = await fetch(path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: 'bad_response', message: '서버 응답을 읽을 수 없어요.' }));
    return { http: res.status, ms: Math.round(performance.now() - t0), json };
  } catch {
    return { http: 0, ms: Math.round(performance.now() - t0), json: { error: 'network', message: '서버에 연결하지 못했어요. 인터넷 연결을 확인하거나, Render 서비스가 잠들어 있다면 잠시 뒤 다시 시도해 주세요.' } };
  }
}

// Placeholder used by features that are designed but not built yet.
export function soonCard(title, phase, bullets) {
  return el('div', { className: 'ocard warn' },
    el('div', { className: 'ohead' }, el('h3', {}, title), badge(`${phase} · 준비 중`, 'warn')),
    el('p', { className: 'note' }, '아직 만들지 않은 기능이에요. 이 탭에 같은 방식으로 붙일 예정이에요.'),
    el('ul', { className: 'issues' }, ...bullets.map((b) => el('li', {}, b))));
}
