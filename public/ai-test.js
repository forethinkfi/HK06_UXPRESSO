// UXPRESSO AI Lab — browser side. All text from the server is inserted with textContent (never innerHTML).
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => n.append(k instanceof Node ? k : document.createTextNode(String(k))));
  return n;
};
const store = { get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage may be blocked */ } } };

const S = { config: null, calls: 0 };

// ---------- log ----------
function log(kind, label, detail = '') {
  const t = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  $('log').prepend(el('li', {}, el('time', {}, t), el('span', { className: kind }, kind === 'ok' ? '성공' : kind === 'warn' ? '주의' : '실패'), el('span', {}, `${label}${detail ? ' · ' + detail : ''}`)));
}
$('btnClear').onclick = () => { $('log').replaceChildren(); S.calls = 0; $('counter').textContent = '이 페이지에서 보낸 요청 0건'; };

// ---------- api helper ----------
export async function api(path, body) {
  S.calls++;
  $('counter').textContent = `이 페이지에서 보낸 요청 ${S.calls}건`;
  const headers = { 'content-type': 'application/json' };
  const tok = $('token').value || store.get('aiLabToken');
  if (tok) headers['x-ai-lab-token'] = tok;
  const t0 = performance.now();
  try {
    const res = await fetch(path, body === undefined ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: 'bad_response', message: '서버 응답을 읽을 수 없어요.' }));
    return { http: res.status, ms: Math.round(performance.now() - t0), json };
  } catch (e) {
    return { http: 0, ms: Math.round(performance.now() - t0), json: { error: 'network', message: '서버에 연결하지 못했어요. 인터넷 연결을 확인하거나 Render 서비스가 잠들어 있다면 잠시 뒤 다시 시도해 주세요.' } };
  }
}
$('token').addEventListener('change', () => store.set('aiLabToken', $('token').value));

// ---------- connection panel ----------
const kv = (k, v) => el('li', {}, el('span', {}, k), el('b', {}, v));
function showConfig() {
  const c = S.config;
  $('connInfo').replaceChildren(
    kv('GEMINI_API_KEY 환경변수', c ? (c.keyConfigured ? '설정됨' : '설정 안 됨') : '확인 중…'),
    kv('접근 토큰', c ? (c.tokenRequired ? '필요' : '없음') : '확인 중…'),
    kv('입력 길이 제한', c ? `${c.limits.maxChars}자` : '-'),
    kv('요청 제한', c ? `연결 테스트 분당 ${c.limits.checkPerMin}회 · 주문 분석 분당 ${c.limits.orderPerMin}회 · 전체 시간당 ${c.limits.hourlyCap}회` : '-'),
  );
  $('tokenBox').hidden = !(c && c.tokenRequired);
  if (c && !c.keyConfigured) $('btnCheck').title = '키가 없어도 눌러서 원인과 해결 방법을 확인할 수 있어요.';
}

function showCheck(r) {
  const box = $('checkResult');
  box.hidden = false;
  const j = r.json;
  if (r.http !== 200) {
    box.className = 'result err';
    box.replaceChildren(el('h3', {}, el('span', { className: 'badge err' }, '실패'), ' 요청이 거절됐어요'), el('div', { className: 'hint' }, j.message || '알 수 없는 오류'), el('p', { className: 'note' }, `HTTP ${r.http}${j.error ? ' · ' + j.error : ''}`));
    return;
  }
  const call = j.calls && j.calls[0];
  box.className = `result ${j.ok ? 'ok' : 'err'}`;
  const rows = [
    kv('결과', el('span', { className: `badge ${j.ok ? 'ok' : 'err'}` }, j.ok ? '연결 성공 (실제 Gemini)' : '연결 실패')),
    kv('실제 API 호출', j.real ? '예' : '아니요 (호출하지 않음)'),
    kv('사용 모델', j.model ? `${j.model} (${j.modelSource === 'GEMINI_MODEL' ? 'GEMINI_MODEL 지정' : '자동 선택'})` : '-'),
    kv('모델 목록 조회', j.list ? `HTTP ${j.list.status} · ${j.list.ms}ms` : '-'),
    kv('사용 가능한 모델', j.models ? `${j.models.generateContent}개 (전체 ${j.models.total}개)` : '-'),
    kv('generateContent', call ? `HTTP ${call.status} · ${call.ms}ms` : '-'),
    kv('토큰(입력/출력)', call && call.tokensIn !== undefined ? `${call.tokensIn} / ${call.tokensOut}` : '-'),
  ];
  const parts = [el('ul', { className: 'kv' }, rows)];
  if (call && call.text) parts.push(el('details', { open: true }, el('summary', {}, 'Gemini가 돌려준 실제 응답'), el('pre', {}, call.text)));
  if (j.models && j.models.gemini.length) parts.push(el('details', {}, el('summary', {}, `사용 가능한 Gemini 모델 (${j.models.gemini.length}개)`), el('pre', {}, j.models.gemini.join('\n'))));
  if (!j.ok) parts.push(el('div', { className: 'hint' }, el('b', {}, '원인: '), j.error || '알 수 없음', el('br'), el('b', {}, '해결 방법: '), j.hint || ''));
  box.replaceChildren(...parts);
}

$('btnCheck').onclick = async () => {
  const b = $('btnCheck');
  b.disabled = true; b.textContent = '확인하는 중…';
  const r = await api('/api/ai/check', {});
  b.disabled = false; b.textContent = '실제 API 연결 테스트';
  showCheck(r);
  if (r.http !== 200) log('err', '연결 테스트', `${r.json.error || 'error'} (HTTP ${r.http})`);
  else log(r.json.ok ? 'ok' : 'err', '연결 테스트', `${r.json.model || '모델 없음'} · ${r.json.calls[0] ? r.json.calls[0].ms + 'ms' : '호출 안 함'}`);
};

// ---------- boot ----------
(async () => {
  if (store.get('aiLabToken')) $('token').value = store.get('aiLabToken');
  showConfig();
  const r = await api('/api/ai/config');
  S.calls = 0; $('counter').textContent = '이 페이지에서 보낸 요청 0건';
  if (r.http === 200) { S.config = r.json; showConfig(); } else { $('connInfo').replaceChildren(kv('서버 상태', r.json.message || `HTTP ${r.http}`)); }
  $('kBody').append(el('p', { className: 'note' }, '주문 분석 화면은 다음 커밋에서 이어서 붙여요.'));
})();
