// "1 API 연결 상태" card: env-var presence, token input, real connection test.
import { el, ctx, api, log, store, kv, badge } from './core.js';

export function mountConnection(container) {
  const info = el('ul', { className: 'kv', id: 'connInfo' });
  const tokenInput = el('input', { id: 'token', type: 'password', autocomplete: 'off', placeholder: '운영자가 알려준 토큰' });
  const tokenBox = el('label', { id: 'tokenBox', className: 'tokenbox', hidden: true }, '접근 토큰 ', tokenInput);
  const btn = el('button', { className: 'btn', id: 'btnCheck' }, '실제 API 연결 테스트');
  const result = el('div', { className: 'result', id: 'checkResult', hidden: true });
  container.append(el('article', { className: 'card' },
    el('h2', {}, '1 API 연결 상태'), info, tokenBox, btn,
    el('p', { className: 'note' }, '버튼을 누르면 서버가 Google Gemini를 실제로 호출해요. 모의 응답으로 대신하지 않아요.'), result));

  if (store.get('aiLabToken')) tokenInput.value = store.get('aiLabToken');
  tokenInput.addEventListener('input', () => store.set('aiLabToken', tokenInput.value));

  function showConfig() {
    const c = ctx.config;
    info.replaceChildren(
      kv('GEMINI_API_KEY 환경변수', c ? (c.keyConfigured ? '설정됨' : '설정 안 됨') : '확인 중…'),
      kv('접근 토큰', c ? (c.tokenRequired ? '필요' : '없음') : '확인 중…'),
      kv('입력 길이 제한', c ? `${c.limits.maxChars}자` : '-'),
      kv('요청 제한', c ? `연결 테스트 분당 ${c.limits.checkPerMin}회 · 주문 분석 분당 ${c.limits.orderPerMin}회 · 전체 시간당 ${c.limits.hourlyCap}회` : '-'));
    tokenBox.hidden = !(c && c.tokenRequired);
    if (c && !c.keyConfigured) btn.title = '키가 없어도 눌러서 원인과 해결 방법을 확인할 수 있어요.';
  }

  const attemptsList = (attempts) => el('ul', { className: 'issues' }, ...attempts.map((a) => el('li', {}, `${a.model} → ${a.status === 0 ? '응답 없음' : 'HTTP ' + a.status} · ${a.ms}ms${a.error ? ' · ' + a.error.slice(0, 80) : ''}`)));

  function showCheck(r) {
    result.hidden = false;
    const j = r.json;
    if (r.http !== 200) {
      result.className = 'result err';
      result.replaceChildren(el('h3', {}, badge('실패', 'err'), ' 요청이 거절됐어요'), el('div', { className: 'hint' }, j.message || '알 수 없는 오류'), el('p', { className: 'note' }, `HTTP ${r.http}${j.error ? ' · ' + j.error : ''}`));
      return;
    }
    const call = j.calls && j.calls[0];
    const fell = call && call.attempts && call.attempts.length > 1 && call.status === 200;
    result.className = `result ${j.ok ? 'ok' : 'err'}`;
    const parts = [el('ul', { className: 'kv' },
      kv('결과', badge(j.ok ? '연결 성공 (실제 Gemini)' : '연결 실패', j.ok ? 'ok' : 'err')),
      kv('실제 API 호출', j.real ? '예' : '아니요 (호출하지 않음)'),
      kv('답한 모델', j.model ? `${j.model} (${j.modelSource === 'GEMINI_MODEL' ? 'GEMINI_MODEL 지정' : '자동 선택'})${fell ? ' · 대체 모델' : ''}` : '-'),
      kv('모델 목록 조회', j.list ? `HTTP ${j.list.status} · ${j.list.ms}ms` : '-'),
      kv('사용 가능한 모델', j.models ? `${j.models.generateContent}개 (전체 ${j.models.total}개)` : '-'),
      kv('generateContent', call ? `HTTP ${call.status} · ${call.ms}ms` : '-'),
      kv('토큰(입력/출력)', call && call.tokensIn !== undefined ? `${call.tokensIn} / ${call.tokensOut}` : '-'))];
    if (call && call.attempts && call.attempts.length) parts.push(el('details', { open: !j.ok || fell }, el('summary', {}, `시도한 모델 (${call.attempts.length})`), attemptsList(call.attempts)));
    if (fell) parts.push(el('p', { className: 'note warn' }, '첫 번째 모델이 일시적으로 실패해서 다음 모델로 대체했어요. 실제 Gemini 응답이에요.'));
    if (call && call.text) parts.push(el('details', { open: true }, el('summary', {}, 'Gemini가 돌려준 실제 응답'), el('pre', {}, call.text)));
    if (j.models && j.models.gemini.length) parts.push(el('details', {}, el('summary', {}, `사용 가능한 Gemini 모델 (${j.models.gemini.length}개)`), el('pre', {}, j.models.gemini.join('\n'))));
    if (!j.ok) parts.push(el('div', { className: 'hint' }, el('b', {}, '원인: '), j.error || '알 수 없음', el('br'), el('b', {}, '해결 방법: '), j.hint || ''));
    result.replaceChildren(...parts);
  }

  btn.onclick = async () => {
    btn.disabled = true; btn.textContent = '확인하는 중…';
    const r = await api('/api/ai/check', {});
    btn.disabled = false; btn.textContent = '실제 API 연결 테스트';
    showCheck(r);
    if (r.http !== 200) log('err', '연결 테스트', `${r.json.error || 'error'} (HTTP ${r.http})`);
    else log(r.json.ok ? 'ok' : 'err', '연결 테스트', `${r.json.model || '모델 없음'} · ${r.json.calls[0] ? r.json.calls[0].ms + 'ms' : '호출 안 함'}`);
  };

  return { showConfig };
}
