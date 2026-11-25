// Minimal AI test page: ① Korean speech → text (Web Speech API) ② Gemini order analysis ③ Gemini menu recommendation.
// Speech recognition and the Gemini steps report success/failure separately. Server text is inserted with textContent only.
import { el, api, store, won, TEMP, badge } from './ai-lab/core.js';

const $ = (id) => document.getElementById(id);
const ORDER_SAMPLES = ['아아 하나', '뜨아 두 잔', '아아 하나랑 카페라떼 뜨거운 거', '아아 두 개 중 하나만 샷 추가', '아메리카노 하나'];
const REC_SAMPLES = ['달달한 거 추천해 줘', '안 쓰고 부드러운 커피 추천해 줘', '3,000원 이하 음료 추천해 줘', '추운데 따뜻한 음료 추천해 줘', '카페인 없는 음료 추천해 줘'];
const textBox = $('text');

// ---------- server status / connection test ----------
let cfg = null;
async function loadConfig() {
  const r = await api('/api/ai/config');
  if (r.http !== 200) { $('connText').textContent = `서버 상태를 확인하지 못했어요 (${r.json.message || 'HTTP ' + r.http})`; return; }
  cfg = r.json;
  $('connText').textContent = `GEMINI_API_KEY: ${cfg.keyConfigured ? '설정됨' : '설정 안 됨'}${cfg.pinnedModel ? ` · 모델 고정: ${cfg.pinnedModel}` : ' · 모델: 자동(경량 우선)'}`;
  $('tokenBox').hidden = !cfg.tokenRequired;
}
$('token').value = store.get('aiLabToken') || '';
$('token').addEventListener('input', () => store.set('aiLabToken', $('token').value));

const errBox = (title, cause, hint) => el('div', { className: 'box err' }, el('b', {}, title), el('div', {}, cause), hint && el('div', {}, el('b', {}, '해결 방법: '), hint));
function infoLine(j, r) {
  const a = j.attempts || [];
  const chips = [
    j.model ? `모델 ${j.model}` : '모델 없음',
    `재시도 ${j.retries ?? 0}회`,
    j.modelChanged ? `모델 변경 있음 (${j.firstChoice || j.requestedModel} → ${j.model})` : '모델 변경 없음',
    `총 ${j.totalMs ?? j.ms ?? '-'}ms`,
    `HTTP ${j.httpStatus ?? '-'}`,
    `Google 요청 ${a.length}회`,
  ];
  const out = [...chips.map((c) => el('span', {}, c)), r ? el('span', {}, `브라우저 왕복 ${r.ms}ms`) : null];
  if (a.length > 1) out.push(el('span', {}, `시도: ${a.map((x) => `${x.model}${x.try > 1 ? '(재시도)' : ''} ${x.status === 0 ? '응답없음' : x.status}`).join(' → ')}`));
  return out;
}
$('btnCheck').onclick = async () => {
  const b = $('btnCheck'); b.disabled = true; b.textContent = '확인하는 중…';
  const r = await api('/api/ai/check', {});
  b.disabled = false; b.textContent = 'API 연결 테스트';
  const j = r.json;
  if (r.http !== 200) { $('checkOut').replaceChildren(errBox('요청이 거절됐어요', j.message || '알 수 없는 오류', '')); return; }
  const c = (j.calls || [])[0] || {};
  $('checkOut').replaceChildren(j.ok
    ? el('div', { className: 'box ok' }, badge('연결 성공 (실제 Gemini)', 'ok'), el('div', { className: 'info' }, ...infoLine({ ...c, model: j.model, httpStatus: c.status, firstChoice: (j.candidates || [])[0], requestedModel: 'auto', attempts: c.attempts, retries: c.retries, modelChanged: c.modelChanged, totalMs: j.totalMs })), c.text ? el('pre', {}, c.text) : null)
    : el('div', { className: 'box err' }, badge('연결 실패', 'err'), el('div', {}, j.error || ''), el('div', {}, el('b', {}, '해결 방법: '), j.hint || ''), el('div', { className: 'info' }, ...(c.attempts || []).map((x) => el('span', {}, `${x.model} ${x.try > 1 ? '(재시도) ' : ''}→ ${x.status === 0 ? '응답없음' : x.status}`)))));
};

// ---------- ① speech → text (Web Speech API, ko-KR) ----------
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = $('mic'), micState = $('micState'), interim = $('interim');
const setMic = (msg, kind) => { micState.replaceChildren(kind ? badge(kind === 'ok' ? '음성 인식 성공' : kind === 'err' ? '음성 인식 실패' : '음성 인식', kind === 'info' ? 'warn' : kind) : '', ' ', msg); };
const MIC_ERR = {
  'not-allowed': '마이크 권한이 거부됐어요. 주소창 왼쪽 자물쇠 → 마이크 허용으로 바꾼 뒤 다시 눌러 주세요.',
  'service-not-allowed': '이 브라우저에서는 음성 인식을 쓸 수 없어요. Chrome·Edge에서 HTTPS 주소로 열어 주세요.',
  'no-speech': '말소리가 들리지 않았어요. 마이크 가까이에서 다시 말해 주세요.',
  'audio-capture': '마이크를 찾을 수 없어요. 마이크 연결을 확인해 주세요.',
  network: '음성 인식 서비스에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.',
  'language-not-supported': '한국어(ko-KR) 음성 인식을 지원하지 않는 브라우저예요.',
};
if (!SR) {
  micBtn.disabled = true;
  setMic('이 브라우저는 음성 인식을 지원하지 않아요. Chrome 또는 Edge(HTTPS)에서 열어 주세요. 글자로 입력해도 테스트할 수 있어요.', 'err');
} else {
  const rec = new SR();
  rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
  let listening = false, finalText = '', t0 = 0, failed = false, heard = false;
  rec.onstart = () => { listening = true; failed = false; heard = false; finalText = ''; t0 = performance.now(); micBtn.setAttribute('aria-pressed', 'true'); micBtn.textContent = '■ 멈추기'; interim.textContent = ''; setMic('듣고 있어요… 말씀해 주세요.', 'info'); };
  rec.onresult = (e) => {
    let tmp = '';
    for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) finalText += r[0].transcript; else tmp += r[0].transcript; }
    heard = true;
    interim.textContent = `인식 중: ${finalText}${tmp}`;
  };
  rec.onerror = (e) => {
    if (e.error === 'aborted') return; // user pressed stop
    failed = true;
    setMic(MIC_ERR[e.error] || `음성 인식 오류(${e.error})`, 'err');
  };
  rec.onend = () => {
    listening = false; micBtn.setAttribute('aria-pressed', 'false'); micBtn.textContent = '🎤 말하기';
    const text = finalText.trim();
    if (text) {
      textBox.value = text.slice(0, 120); $('count').textContent = `${textBox.value.length}/120`; interim.textContent = '';
      setMic(`"${text}" (${Math.round(performance.now() - t0)}ms) — 글자를 고쳐도 돼요. 아래 버튼으로 분석하세요.`, 'ok');
    } else if (!failed) { interim.textContent = ''; setMic(heard ? '말은 들렸지만 글자로 바꾸지 못했어요. 다시 말해 주세요.' : '인식된 말이 없어요. 다시 눌러 말해 주세요.', 'err'); }
  };
  micBtn.onclick = () => {
    try { listening ? rec.stop() : rec.start(); } catch { setMic('마이크를 시작하지 못했어요. 잠시 후 다시 눌러 주세요.', 'err'); }
  };
}

// ---------- input helpers ----------
textBox.addEventListener('input', () => { $('count').textContent = `${textBox.value.length}/120`; });
const chipRow = $('chips');
chipRow.append(el('span', { className: 'note' }, '주문 예시: '), ...ORDER_SAMPLES.map((s) => el('button', { className: 'chip sec', type: 'button', onclick: () => { textBox.value = s; $('count').textContent = `${s.length}/120`; run('order'); } }, s)));
chipRow.append(el('br'), el('span', { className: 'note' }, '추천 예시: '), ...REC_SAMPLES.map((s) => el('button', { className: 'chip sec', type: 'button', onclick: () => { textBox.value = s; $('count').textContent = `${s.length}/120`; run('rec'); } }, s)));

// ---------- ② order analysis / ③ recommendation ----------
let busy = false;
const setBusy = (b) => { busy = b; $('btnOrder').disabled = b; $('btnRec').disabled = b; };
async function run(kind) {
  const text = textBox.value.trim();
  if (!text) { $('result').replaceChildren(el('p', { className: 'note' }, '문장을 말하거나 입력해 주세요.')); textBox.focus(); return; }
  if (busy) return;
  setBusy(true);
  $('kind').textContent = kind === 'order' ? '· 주문 분석' : '· 메뉴 추천';
  $('info').replaceChildren(); $('raw').replaceChildren();
  $('result').replaceChildren(el('p', { className: 'note' }, 'Gemini에 물어보는 중… (실패하면 짧게 다시 시도하고 필요하면 다른 모델로 바꿔요. 몇 초 걸릴 수 있어요.)'));
  const r = await api(kind === 'order' ? '/api/ai/order' : '/api/ai/recommend', { text });
  setBusy(false);
  render(kind, r);
}
$('btnOrder').onclick = () => run('order');
$('btnRec').onclick = () => run('rec');

function render(kind, r) {
  const j = r.json;
  const out = $('result');
  if (r.http !== 200) { out.replaceChildren(errBox('요청을 처리하지 못했어요', j.message || '알 수 없는 오류', j.error === 'rate_limited' || j.error === 'budget_exhausted' ? '잠시 기다렸다가 다시 시도해 주세요.' : j.error === 'token_required' ? '접근 토큰을 위쪽 칸에 입력해 주세요.' : '')); return; }
  $('info').replaceChildren(...infoLine(j, r));
  if (!j.ok) {
    out.replaceChildren(el('div', { className: 'box err' }, badge('Gemini 분석 실패', 'err'), ' ', el('small', {}, '실제 API 호출이 실패했어요. Mock 응답으로 대신하지 않았어요.'),
      el('div', {}, el('b', {}, '원인: '), j.error || '알 수 없음'), el('div', {}, el('b', {}, '해결 방법: '), j.hint || '')));
    if (j.rawText) $('raw').replaceChildren(el('details', {}, el('summary', {}, '모델 응답 원문'), el('pre', {}, j.rawText)));
    return;
  }
  const res = j.result;
  const head = el('div', {}, badge('Gemini 분석 성공 (실제 API)', 'ok'), ' ');
  if (kind === 'order') {
    if (res.status === 'ready') {
      out.replaceChildren(head, el('div', { className: 'box ok' }, el('b', {}, '이렇게 이해했어요'), res.reply ? el('div', { className: 'note' }, `“${res.reply}”`) : null,
        el('table', {}, el('thead', {}, el('tr', {}, el('th', {}, '메뉴'), el('th', {}, '온도'), el('th', {}, '수량'), el('th', {}, '옵션'), el('th', { className: 'n' }, '금액'))),
          el('tbody', {}, ...res.items.map((l) => el('tr', {}, el('td', {}, l.name), el('td', {}, TEMP[l.temperature]), el('td', {}, `${l.qty}잔`), el('td', {}, l.optionLabels.join(', ') || '없음'), el('td', { className: 'n' }, won(l.linePrice)))))),
        el('p', {}, el('b', {}, `합계 ${won(res.total)}`), el('span', { className: 'note' }, ' (메뉴 데이터 기준, 서버가 계산)'))));
    } else if (res.status === 'needs_clarify') {
      out.replaceChildren(head, el('div', { className: 'box warn' }, el('b', {}, '확인이 필요해요'), el('div', {}, res.question), el('div', { className: 'note' }, '온도 등을 넣어 문장을 고쳐 다시 분석해 보세요. 예: “아메리카노 하나 차갑게”')));
    } else {
      out.replaceChildren(head, el('div', { className: `box ${res.status === 'unsupported' ? 'warn' : 'err'}` }, el('b', {}, res.status === 'unsupported' ? '주문이 아닌 요청이에요 (추천은 “메뉴 추천” 버튼)' : '정확히 확인하지 못해 담지 않았어요'), el('ul', { className: 'l' }, ...res.issues.filter((i) => i.level !== 'info' || res.status === 'unsupported').map((i) => el('li', {}, i.text)))));
    }
  } else if (res.status === 'ok') {
    out.replaceChildren(head, ...res.picks.map((p) => el('div', { className: 'pick' },
      el('b', {}, p.name), ' ', el('span', {}, won(p.price)), el('div', { className: 'meta' }, `${p.temperature.map((t) => TEMP[t]).join(' / ')} 가능`),
      el('div', {}, ...p.tags.map((t) => el('span', { className: 'tag' }, t))), el('div', { className: 'note' }, p.summary), el('div', {}, el('b', {}, '추천 이유: '), p.reason))),
      res.note ? el('div', { className: 'box warn' }, res.note) : null,
      res.issues.length ? el('details', {}, el('summary', {}, `서버가 걸러낸 항목 (${res.issues.length})`), el('ul', { className: 'l' }, ...res.issues.map((i) => el('li', {}, `[${i.level}] ${i.text}`)))) : null);
  } else {
    out.replaceChildren(head, el('div', { className: 'box warn' }, el('b', {}, res.status === 'not_recommend' ? '추천 요청으로 읽히지 않았어요 (주문은 “주문 분석” 버튼)' : '조건에 맞는 메뉴가 없어요'), el('div', {}, res.note || ''),
      res.issues.length ? el('ul', { className: 'l' }, ...res.issues.map((i) => el('li', {}, i.text))) : null));
  }
  const parts = [];
  if (j.parsed) parts.push(el('details', {}, el('summary', {}, '모델이 만든 JSON (서버 검증 전)'), el('pre', {}, JSON.stringify(j.parsed, null, 2))));
  if (res) parts.push(el('details', {}, el('summary', {}, '서버 검증 후 결과 JSON'), el('pre', {}, JSON.stringify(res, null, 2))));
  $('raw').replaceChildren(...parts);
}

loadConfig();
