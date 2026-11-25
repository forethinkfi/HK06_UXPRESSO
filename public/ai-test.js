// UXPRESSO AI Lab — browser side. All text from the server is inserted with textContent (never innerHTML).
const $ = (id) => document.getElementById(id);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  kids.flat().forEach((k) => { if (k !== null && k !== undefined && k !== false) n.append(k instanceof Node ? k : document.createTextNode(String(k))); });
  return n;
};
const store = {
  get: (k) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { sessionStorage.setItem(k, v); } catch { /* storage may be blocked */ } },
};
const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`;
const TEMP = { HOT: '따뜻하게', ICE: '차갑게' };
const SAMPLES = ['아아 하나', '뜨아 두 잔', '아아 하나랑 카페라떼 뜨거운 거', '아아 두 개 중 하나만 샷 추가', '아메리카노 하나'];
const MAX_QTY = 10;

const S = { config: null, calls: 0, mock: false, busy: false, cart: [] };
try { const c = JSON.parse(store.get('aiLabCart') || '[]'); if (Array.isArray(c)) S.cart = c.filter((l) => l && l.key && Number.isInteger(l.qty)); } catch { /* ignore */ }

// ---------- log ----------
function log(kind, label, detail = '') {
  const t = new Date().toLocaleTimeString('ko-KR', { hour12: false });
  $('log').prepend(el('li', {}, el('time', {}, t), el('span', { className: kind }, kind === 'ok' ? '성공' : kind === 'warn' ? '주의' : '실패'), el('span', {}, `${label}${detail ? ' · ' + detail : ''}`)));
}
const counter = () => { $('counter').textContent = `이 페이지에서 보낸 요청 ${S.calls}건`; };
$('btnClear').onclick = () => { $('log').replaceChildren(); S.calls = 0; counter(); };

// ---------- api helper ----------
async function api(path, body) {
  S.calls++; counter();
  const headers = { 'content-type': 'application/json' };
  const tok = $('token').value || store.get('aiLabToken');
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
$('token').addEventListener('change', () => store.set('aiLabToken', $('token').value));

const kv = (k, v) => el('li', {}, el('span', {}, k), el('b', {}, v));
const badge = (text, cls) => el('span', { className: `badge ${cls}` }, text);
const sourceBadge = (j) => (j.source === 'mock' ? badge('Mock (고정 응답)', 'mock') : badge('실제 Gemini', 'ok'));

// ---------- 1. connection panel ----------
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
    box.replaceChildren(el('h3', {}, badge('실패', 'err'), ' 요청이 거절됐어요'), el('div', { className: 'hint' }, j.message || '알 수 없는 오류'), el('p', { className: 'note' }, `HTTP ${r.http}${j.error ? ' · ' + j.error : ''}`));
    return;
  }
  const call = j.calls && j.calls[0];
  box.className = `result ${j.ok ? 'ok' : 'err'}`;
  const parts = [el('ul', { className: 'kv' },
    kv('결과', badge(j.ok ? '연결 성공 (실제 Gemini)' : '연결 실패', j.ok ? 'ok' : 'err')),
    kv('실제 API 호출', j.real ? '예' : '아니요 (호출하지 않음)'),
    kv('사용 모델', j.model ? `${j.model} (${j.modelSource === 'GEMINI_MODEL' ? 'GEMINI_MODEL 지정' : '자동 선택'})` : '-'),
    kv('모델 목록 조회', j.list ? `HTTP ${j.list.status} · ${j.list.ms}ms` : '-'),
    kv('사용 가능한 모델', j.models ? `${j.models.generateContent}개 (전체 ${j.models.total}개)` : '-'),
    kv('generateContent', call ? `HTTP ${call.status} · ${call.ms}ms` : '-'),
    kv('토큰(입력/출력)', call && call.tokensIn !== undefined ? `${call.tokensIn} / ${call.tokensOut}` : '-'),
  )];
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

// ---------- 2. kiosk preview: text order + temporary cart ----------
const ui = {};
function buildKiosk() {
  ui.utter = el('textarea', { id: 'utter', rows: 2, maxLength: 120, placeholder: '예: 아아 하나 주세요', 'aria-label': '주문 문장' });
  ui.count = el('span', { className: 'count' }, '0/120');
  ui.go = el('button', { className: 'btn', id: 'btnGo' }, '주문 분석하기');
  ui.result = el('div', { className: 'k-result', 'aria-live': 'polite' });
  ui.cart = el('div', { className: 'k-cart' });

  const seg = el('fieldset', { className: 'seg' }, el('legend', {}, '응답 방식'),
    ...[['gemini', '실제 Gemini'], ['mock', 'Mock (고정 응답)']].map(([v, label]) => {
      const inp = el('input', { type: 'radio', name: 'mode', value: v, checked: v === 'gemini' });
      inp.onchange = () => { S.mock = v === 'mock'; modeNote.hidden = !S.mock; };
      return el('label', {}, inp, ' ', label);
    }));
  const modeNote = el('p', { className: 'note warn', hidden: true }, 'Mock은 미리 정해 둔 응답이에요. 실제 Gemini 연결 결과가 아니에요. 아래 빠른 예시 5개(와 온도 되묻기 답변)만 시험할 수 있어요.');

  ui.utter.addEventListener('input', () => { ui.count.textContent = `${ui.utter.value.length}/${ui.utter.maxLength}`; });
  ui.utter.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); analyze(ui.utter.value); } });
  ui.go.onclick = () => analyze(ui.utter.value);

  const chips = el('div', { className: 'chips' }, ...SAMPLES.map((s) => {
    const c = el('button', { className: 'chip', type: 'button' }, s);
    c.onclick = () => { ui.utter.value = s; ui.count.textContent = `${s.length}/${ui.utter.maxLength}`; analyze(s); };
    return c;
  }));

  $('kBody').replaceChildren(seg, modeNote,
    el('div', { className: 'k-input' }, ui.utter, el('div', { className: 'k-row' }, ui.count, ui.go)),
    el('div', {}, el('p', { className: 'note' }, '빠른 테스트 예시'), chips),
    ui.result, ui.cart);
  renderCart();
}

function setBusy(b) { S.busy = b; ui.go.disabled = b; ui.go.textContent = b ? '분석하는 중…' : '주문 분석하기'; }

async function analyze(raw) {
  const text = String(raw || '').trim();
  if (!text || S.busy) { if (!text) { ui.result.replaceChildren(el('p', { className: 'note' }, '주문 문장을 입력해 주세요.')); ui.utter.focus(); } return; }
  setBusy(true);
  ui.result.replaceChildren(el('p', { className: 'note' }, S.mock ? 'Mock 응답을 확인하는 중…' : 'Gemini에 물어보는 중… (처음엔 몇 초 걸릴 수 있어요)'));
  const r = await api('/api/ai/order', { text, mock: S.mock });
  setBusy(false);
  renderResult(r, text);
  updateDetail(r);
  ui.result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function errorCard(title, cause, hint, extra) {
  return el('div', { className: 'ocard err' }, el('h3', {}, title), el('p', {}, cause), hint && el('div', { className: 'hint' }, el('b', {}, '해결 방법: '), hint), extra);
}

function renderResult(r, text) {
  const j = r.json;
  const label = text.length > 24 ? `${text.slice(0, 24)}…` : text;
  if (r.http !== 200) {
    ui.result.replaceChildren(errorCard('요청을 처리하지 못했어요', j.message || '알 수 없는 오류', j.error === 'rate_limited' || j.error === 'budget_exhausted' ? '잠시 기다렸다가 다시 시도해 주세요.' : '', el('p', { className: 'note' }, `HTTP ${r.http}${j.error ? ' · ' + j.error : ''}`)));
    log('err', `주문 분석 "${label}"`, `${j.error || 'error'} (HTTP ${r.http})`);
    return;
  }
  if (!j.ok) {
    ui.result.replaceChildren(errorCard(j.source === 'mock' ? 'Mock 응답이 없어요' : 'Gemini 호출에 실패했어요', j.error || '알 수 없는 오류', j.hint, el('p', { className: 'note' }, '실패한 호출을 Mock 응답으로 대신하지 않았어요.')));
    log('err', `주문 분석 "${label}"`, `${j.source} · ${j.httpStatus ?? '-'} · ${j.error || ''}`.slice(0, 120));
    return;
  }
  const res = j.result;
  const logOk = (note) => log('ok', `주문 분석 "${label}"`, `${j.source === 'mock' ? 'Mock' : '실제 Gemini'} · ${res.status}${note ? ' · ' + note : ''} · ${j.ms ?? 0}ms`);

  if (res.status === 'ready') {
    ui.result.replaceChildren(el('div', { className: 'ocard ok' },
      el('div', { className: 'ohead' }, el('h3', {}, '이렇게 주문할까요?'), sourceBadge(j)),
      res.reply && el('p', { className: 'reply' }, `“${res.reply}”`),
      el('ul', { className: 'lines' }, ...res.items.map((l) => el('li', {},
        el('span', {}, el('b', {}, `${l.name} · ${TEMP[l.temperature]} · ${l.qty}잔`), l.optionLabels.length ? el('small', {}, l.optionLabels.join(', ')) : null),
        el('strong', {}, won(l.linePrice))))),
      el('div', { className: 'otot' }, el('span', {}, '합계 (메뉴 데이터 기준)'), el('strong', {}, won(res.total))),
      el('div', { className: 'k-row' },
        el('button', { className: 'btn', onclick: () => confirmAdd(res.items) }, '임시 장바구니에 담기'),
        el('button', { className: 'btn sec', onclick: () => { ui.result.replaceChildren(); ui.utter.focus(); } }, '다시 말하기'))));
    logOk(`${res.items.length}줄 ${res.total}원`);
  } else if (res.status === 'needs_clarify') {
    const btns = res.askTemps ? res.askTemps.map((t) => el('button', { className: 'btn', onclick: () => { const s = `${text} ${TEMP[t]}`; ui.utter.value = s; ui.count.textContent = `${s.length}/${ui.utter.maxLength}`; analyze(s); } }, TEMP[t])) : [];
    ui.result.replaceChildren(el('div', { className: 'ocard warn' },
      el('div', { className: 'ohead' }, el('h3', {}, '한 가지만 확인할게요'), sourceBadge(j)),
      el('p', { className: 'ask' }, res.question),
      btns.length ? el('div', { className: 'k-row' }, ...btns) : el('p', { className: 'note' }, '문장을 고쳐서 다시 입력해 주세요.'),
      el('p', { className: 'note' }, '주문은 아직 담지 않았어요.')));
    logOk('되물음');
  } else {
    const errs = res.issues.filter((i) => i.level !== 'info');
    ui.result.replaceChildren(el('div', { className: `ocard ${res.status === 'unsupported' ? 'warn' : 'err'}` },
      el('div', { className: 'ohead' }, el('h3', {}, res.status === 'unsupported' ? '이번 단계에서는 주문만 담을 수 있어요' : '주문 내용을 정확히 확인하지 못했어요'), sourceBadge(j)),
      el('ul', { className: 'issues' }, ...(errs.length ? errs : res.issues).map((i) => el('li', {}, i.text))),
      el('p', { className: 'note' }, res.status === 'unsupported' ? '추천·비교·질문·수정·취소는 다음 단계에서 이어서 만들어요.' : '일부만 이해한 주문은 담지 않아요. 문장을 고쳐서 다시 말씀해 주세요.')));
    logOk(res.status);
  }
}

// ---------- temporary cart ----------
function confirmAdd(items) {
  items.forEach((l) => {
    const cur = S.cart.find((c) => c.key === l.key);
    if (cur) cur.qty = Math.min(MAX_QTY, cur.qty + l.qty);
    else S.cart.push({ key: l.key, name: l.name, temperature: l.temperature, optionLabels: l.optionLabels, unitPrice: l.unitPrice, qty: Math.min(MAX_QTY, l.qty) });
  });
  saveCart(); renderCart();
  ui.result.replaceChildren(el('div', { className: 'ocard ok' }, el('h3', {}, '임시 장바구니에 담았어요.'), el('p', { className: 'note' }, '메뉴를 더 말하거나 아래에서 수량을 바꿀 수 있어요.')));
  ui.utter.value = ''; ui.count.textContent = `0/${ui.utter.maxLength}`;
  log('ok', '임시 장바구니 담기', `${items.length}줄`);
}
const saveCart = () => store.set('aiLabCart', JSON.stringify(S.cart));
function renderCart() {
  const total = S.cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const count = S.cart.reduce((s, l) => s + l.qty, 0);
  const bump = (l, d) => { l.qty += d; if (l.qty < 1) S.cart = S.cart.filter((c) => c !== l); saveCart(); renderCart(); };
  ui.cart.replaceChildren(
    el('h3', {}, `임시 장바구니 `, el('small', {}, `${count}잔`)),
    S.cart.length ? el('ul', { className: 'lines' }, ...S.cart.map((l) => el('li', {},
      el('span', {}, el('b', {}, `${l.name} · ${TEMP[l.temperature]}`), l.optionLabels.length ? el('small', {}, l.optionLabels.join(', ')) : null),
      el('span', { className: 'qty' },
        el('button', { className: 'q', 'aria-label': `${l.name} 한 잔 줄이기`, onclick: () => bump(l, -1) }, '−'), el('b', {}, l.qty),
        el('button', { className: 'q', 'aria-label': `${l.name} 한 잔 늘리기`, disabled: l.qty >= MAX_QTY, onclick: () => bump(l, 1) }, '+'),
        el('strong', {}, won(l.unitPrice * l.qty)))))) : el('p', { className: 'note' }, '아직 담은 메뉴가 없어요.'),
    el('div', { className: 'otot' }, el('span', {}, '합계'), el('strong', {}, won(total))),
    S.cart.length ? el('button', { className: 'btn sec', onclick: () => { S.cart = []; saveCart(); renderCart(); log('warn', '장바구니 비움', '새 손님 시작'); } }, '새 손님 시작 (장바구니 비우기)') : null,
    el('p', { className: 'note' }, '이 장바구니는 이 브라우저 탭에서만 유지되는 실험용이에요. 실제 키오스크 장바구니와 연결되지 않아요.'));
}

// ---------- dev panel: last analysis detail ----------
function updateDetail(r) {
  const card = $('detailCard');
  card.hidden = false;
  const j = r.json;
  const parts = [el('h2', {}, '2 마지막 주문 분석 상세')];
  if (r.http !== 200) { parts.push(el('ul', { className: 'kv' }, kv('결과', badge('요청 거절', 'err')), kv('HTTP', String(r.http)), kv('오류', j.error || '-')), el('div', { className: 'hint' }, j.message || '')); card.replaceChildren(...parts); return; }
  const res = j.result;
  const rows = [
    kv('응답 출처', sourceBadge(j)),
    kv('실제 API 호출', j.real ? '예' : '아니요 (Mock)'),
    kv('API·JSON 처리', badge(j.ok ? '성공' : '실패', j.ok ? 'ok' : 'err')),
    kv('모델', j.model ? `${j.model}${j.modelSource ? ` (${j.modelSource})` : ''}` : '-'),
    kv('Gemini HTTP 상태', j.httpStatus ?? '-'),
    kv('Gemini 응답 시간', j.ms !== null && j.ms !== undefined ? `${j.ms}ms` : '-'),
    kv('브라우저 왕복 시간', `${r.ms}ms`),
    kv('종료 사유 / 토큰', j.finishReason ? `${j.finishReason} · ${j.tokensIn ?? '-'}/${j.tokensOut ?? '-'}` : '-'),
  ];
  if (res) rows.push(
    kv('요청 의도(intent)', res.intent),
    kv('서버 검증', badge({ ready: '통과 (담을 수 있음)', needs_clarify: '되물음', invalid: '거부', unsupported: '이번 단계 미지원' }[res.status] || res.status, res.status === 'ready' ? 'ok' : res.status === 'invalid' ? 'err' : 'warn')),
    kv('메뉴 매칭', res.items.length ? res.items.map((l) => `${l.menuId}(${l.name})`).join(', ') : '-'),
    kv('옵션 매칭', res.items.length ? res.items.map((l) => Object.entries(l.options).map(([g, c]) => `${g}:${c}`).join(',') || '없음').join(' | ') : '-'),
    kv('서버 계산 금액', res.status === 'ready' ? won(res.total) : '-'),
  );
  parts.push(el('ul', { className: 'kv' }, rows));
  if (!j.ok) parts.push(el('div', { className: 'hint' }, el('b', {}, '원인: '), j.error || '', el('br'), el('b', {}, '해결 방법: '), j.hint || ''));
  if (res && res.issues.length) parts.push(el('details', { open: true }, el('summary', {}, `검증 메모 (${res.issues.length})`), el('ul', { className: 'issues' }, ...res.issues.map((i) => el('li', {}, `[${i.level}] ${i.text}`)))));
  if (j.parsed) parts.push(el('details', { open: true }, el('summary', {}, '모델이 만든 구조화 JSON (검증 전)'), el('pre', {}, JSON.stringify(j.parsed, null, 2))));
  if (res) parts.push(el('details', {}, el('summary', {}, '서버 검증 후 결과 JSON'), el('pre', {}, JSON.stringify(res, null, 2))));
  if (j.rawText) parts.push(el('details', {}, el('summary', {}, '모델 응답 원문'), el('pre', {}, j.rawText)));
  card.replaceChildren(...parts);
}

// ---------- boot ----------
(async () => {
  if (store.get('aiLabToken')) $('token').value = store.get('aiLabToken');
  buildKiosk();
  showConfig();
  const r = await api('/api/ai/config');
  S.calls = 0; counter();
  if (r.http === 200) { S.config = r.json; showConfig(); } else { $('connInfo').replaceChildren(kv('서버 상태', r.json.message || `HTTP ${r.http}`)); }
})();
