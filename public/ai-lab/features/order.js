// Feature "주문": type a sentence → Gemini → server validation → confirmation card → cart.
// Standalone page: a temporary cart. Inside the kiosk overlay: the kiosk's real cart (through ctx.host).
import { el, ctx, api, log, store, won, TEMP, kv, badge } from '../core.js';

const SAMPLES = ['아아 하나', '뜨아 두 잔', '아아 하나랑 카페라떼 뜨거운 거', '아아 두 개 중 하나만 샷 추가', '아메리카노 하나'];
const MAX_QTY = 10;
const sourceBadge = (j) => (j.source === 'mock' ? badge('Mock (고정 응답)', 'mock') : badge('실제 Gemini', 'ok'));

export default {
  id: 'order',
  label: '주문',
  title: '말로 주문해 보세요',

  mount({ kiosk, dev }) {
    const ui = {};
    const embedded = ctx.host.embedded;
    let busy = false;
    let cart = [];
    try { const c = JSON.parse(store.get('aiLabCart') || '[]'); if (Array.isArray(c)) cart = c.filter((l) => l && l.key && Number.isInteger(l.qty)); } catch { /* ignore */ }
    const saveCart = () => store.set('aiLabCart', JSON.stringify(cart));

    // ---------- kiosk side ----------
    ui.utter = el('textarea', { id: 'utter', rows: 2, maxLength: 120, placeholder: '예: 아아 하나 주세요', 'aria-label': '주문 문장' });
    ui.count = el('span', { className: 'count' }, '0/120');
    ui.go = el('button', { className: 'btn', id: 'btnGo' }, '주문 분석하기');
    ui.result = el('div', { className: 'k-result', 'aria-live': 'polite' });
    ui.cart = el('div', { className: 'k-cart' });

    const modeNote = el('p', { className: 'note warn', hidden: true }, 'Mock은 미리 정해 둔 응답이에요. 실제 Gemini 연결 결과가 아니에요. 아래 빠른 예시 5개(와 온도 되묻기 답변)만 시험할 수 있어요.');
    const seg = el('fieldset', { className: 'seg' }, el('legend', {}, '응답 방식'),
      ...[['gemini', '실제 Gemini'], ['mock', 'Mock (고정 응답)']].map(([v, label]) => {
        const inp = el('input', { type: 'radio', name: 'mode', value: v, checked: v === 'gemini' });
        inp.onchange = () => { ctx.mock = v === 'mock'; modeNote.hidden = !ctx.mock; };
        return el('label', {}, inp, ' ', label);
      }));

    ui.utter.addEventListener('input', () => { ui.count.textContent = `${ui.utter.value.length}/${ui.utter.maxLength}`; });
    ui.utter.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); analyze(ui.utter.value); } });
    ui.go.onclick = () => analyze(ui.utter.value);
    const setText = (s) => { ui.utter.value = s; ui.count.textContent = `${s.length}/${ui.utter.maxLength}`; };

    const chips = el('div', { className: 'chips' }, ...SAMPLES.map((s) => {
      const c = el('button', { className: 'chip', type: 'button' }, s);
      c.onclick = () => { setText(s); analyze(s); };
      return c;
    }));

    kiosk.append(seg, modeNote,
      el('div', { className: 'k-input' }, ui.utter, el('div', { className: 'k-row' }, ui.count, ui.go)),
      el('div', {}, el('p', { className: 'note' }, '빠른 테스트 예시'), chips),
      ui.result, ui.cart);

    const setBusy = (b) => { busy = b; ui.go.disabled = b; ui.go.textContent = b ? '분석하는 중…' : '주문 분석하기'; };

    async function analyze(raw) {
      const text = String(raw || '').trim();
      if (!text) { ui.result.replaceChildren(el('p', { className: 'note' }, '주문 문장을 입력해 주세요.')); ui.utter.focus(); return; }
      if (busy) return;
      setBusy(true);
      ui.result.replaceChildren(el('p', { className: 'note' }, ctx.mock ? 'Mock 응답을 확인하는 중…' : 'Gemini에 물어보는 중… (처음엔 몇 초 걸릴 수 있어요)'));
      const r = await api('/api/ai/order', { text, mock: ctx.mock });
      setBusy(false);
      renderResult(r, text);
      updateDetail(r);
      ui.result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    const errorCard = (title, cause, hint, extra) => el('div', { className: 'ocard err' }, el('h3', {}, title), el('p', {}, cause), hint && el('div', { className: 'hint' }, el('b', {}, '해결 방법: '), hint), extra);

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
      const logOk = (note) => log('ok', `주문 분석 "${label}"`, `${j.source === 'mock' ? 'Mock' : '실제 Gemini'}${j.fallbackUsed ? '(대체 모델)' : ''} · ${res.status}${note ? ' · ' + note : ''} · ${j.ms ?? 0}ms`);

      if (res.status === 'ready') {
        ui.result.replaceChildren(el('div', { className: 'ocard ok' },
          el('div', { className: 'ohead' }, el('h3', {}, '이렇게 주문할까요?'), sourceBadge(j)),
          res.reply && el('p', { className: 'reply' }, `“${res.reply}”`),
          el('ul', { className: 'lines' }, ...res.items.map((l) => el('li', {},
            el('span', {}, el('b', {}, `${l.name} · ${TEMP[l.temperature]} · ${l.qty}잔`), l.optionLabels.length ? el('small', {}, l.optionLabels.join(', ')) : null),
            el('strong', {}, won(l.linePrice))))),
          el('div', { className: 'otot' }, el('span', {}, '합계 (메뉴 데이터 기준)'), el('strong', {}, won(res.total))),
          el('div', { className: 'k-row' },
            el('button', { className: 'btn', onclick: () => confirmAdd(res.items) }, embedded ? '키오스크 장바구니에 담기' : '임시 장바구니에 담기'),
            el('button', { className: 'btn sec', onclick: () => { ui.result.replaceChildren(); ui.utter.focus(); } }, '다시 말하기'))));
        logOk(`${res.items.length}줄 ${res.total}원`);
      } else if (res.status === 'needs_clarify') {
        const btns = res.askTemps ? res.askTemps.map((t) => el('button', { className: 'btn', onclick: () => { const s = `${text} ${TEMP[t]}`; setText(s); analyze(s); } }, TEMP[t])) : [];
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

    // ---------- cart ----------
    async function confirmAdd(items) {
      if (embedded) {
        const ack = await ctx.host.addItems(items.map((l) => ({ menuId: l.menuId, temp: l.temperature, opts: l.options, qty: l.qty })));
        if (!ack.ok) {
          ui.result.replaceChildren(errorCard('키오스크 장바구니에 담지 못했어요', ack.error || '알 수 없는 오류', '주문 문장을 다시 분석해 주세요.'));
          log('err', '키오스크 장바구니 담기', ack.error || '');
          return;
        }
        ui.result.replaceChildren(el('div', { className: 'ocard ok' },
          el('h3', {}, '키오스크 장바구니에 담았어요.'),
          el('p', {}, `지금 장바구니: ${ack.cartCount}잔 · ${won(ack.cartTotal)}`),
          ack.needMode ? el('p', { className: 'note warn' }, '주문 방식(매장/포장)은 키오스크 첫 화면에서 골라 주세요. 담은 메뉴는 그대로 남아 있어요.') : null,
          el('div', { className: 'k-row' },
            el('button', { className: 'btn', onclick: () => ctx.host.viewCart() }, '키오스크에서 확인하기'),
            el('button', { className: 'btn sec', onclick: () => { ui.result.replaceChildren(); ui.utter.focus(); } }, '더 주문하기'))));
        setText('');
        log('ok', '키오스크 장바구니 담기', `${items.length}줄 · 장바구니 ${ack.cartCount}잔 ${ack.cartTotal}원`);
        return;
      }
      items.forEach((l) => {
        const cur = cart.find((c) => c.key === l.key);
        if (cur) cur.qty = Math.min(MAX_QTY, cur.qty + l.qty);
        else cart.push({ key: l.key, name: l.name, temperature: l.temperature, optionLabels: l.optionLabels, unitPrice: l.unitPrice, qty: Math.min(MAX_QTY, l.qty) });
      });
      saveCart(); renderCart();
      ui.result.replaceChildren(el('div', { className: 'ocard ok' }, el('h3', {}, '임시 장바구니에 담았어요.'), el('p', { className: 'note' }, '메뉴를 더 말하거나 아래에서 수량을 바꿀 수 있어요.')));
      setText('');
      log('ok', '임시 장바구니 담기', `${items.length}줄`);
    }

    function renderCart() {
      if (embedded) { ui.cart.replaceChildren(el('p', { className: 'note' }, '확인한 주문은 키오스크의 실제 장바구니에 들어가요.')); return; }
      const total = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
      const count = cart.reduce((s, l) => s + l.qty, 0);
      const bump = (l, d) => { l.qty += d; if (l.qty < 1) cart = cart.filter((c) => c !== l); saveCart(); renderCart(); };
      ui.cart.replaceChildren(
        el('h3', {}, '임시 장바구니 ', el('small', {}, `${count}잔`)),
        cart.length ? el('ul', { className: 'lines' }, ...cart.map((l) => el('li', {},
          el('span', {}, el('b', {}, `${l.name} · ${TEMP[l.temperature]}`), l.optionLabels.length ? el('small', {}, l.optionLabels.join(', ')) : null),
          el('span', { className: 'qty' },
            el('button', { className: 'q', 'aria-label': `${l.name} 한 잔 줄이기`, onclick: () => bump(l, -1) }, '−'), el('b', {}, l.qty),
            el('button', { className: 'q', 'aria-label': `${l.name} 한 잔 늘리기`, disabled: l.qty >= MAX_QTY, onclick: () => bump(l, 1) }, '+'),
            el('strong', {}, won(l.unitPrice * l.qty)))))) : el('p', { className: 'note' }, '아직 담은 메뉴가 없어요.'),
        el('div', { className: 'otot' }, el('span', {}, '합계'), el('strong', {}, won(total))),
        cart.length ? el('button', { className: 'btn sec', onclick: () => { cart = []; saveCart(); renderCart(); log('warn', '장바구니 비움', '새 손님 시작'); } }, '새 손님 시작 (장바구니 비우기)') : null,
        el('p', { className: 'note' }, '이 장바구니는 이 브라우저 탭에서만 유지되는 실험용이에요. 실제 키오스크 장바구니와 연결되지 않아요. (키오스크 화면의 AI Lab 버튼으로 열면 실제 장바구니에 담겨요.)'));
    }
    renderCart();

    // ---------- dev side: last analysis detail ----------
    const detail = el('article', { className: 'card', id: 'detailCard', hidden: true });
    dev.append(detail);
    function updateDetail(r) {
      detail.hidden = false;
      const j = r.json;
      const parts = [el('h2', {}, '2 마지막 주문 분석 상세')];
      if (r.http !== 200) { parts.push(el('ul', { className: 'kv' }, kv('결과', badge('요청 거절', 'err')), kv('HTTP', String(r.http)), kv('오류', j.error || '-')), el('div', { className: 'hint' }, j.message || '')); detail.replaceChildren(...parts); return; }
      const res = j.result;
      const rows = [
        kv('응답 출처', sourceBadge(j)),
        kv('실제 API 호출', j.real ? '예' : '아니요 (Mock)'),
        kv('API·JSON 처리', badge(j.ok ? '성공' : '실패', j.ok ? 'ok' : 'err')),
        kv('답한 모델', j.model ? `${j.model}${j.modelSource ? ` (${j.modelSource})` : ''}${j.fallbackUsed ? ' · 대체 모델' : ''}` : '-'),
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
        kv('서버 계산 금액', res.status === 'ready' ? won(res.total) : '-'));
      parts.push(el('ul', { className: 'kv' }, rows));
      if (j.attempts && j.attempts.length > 1) parts.push(el('details', { open: true }, el('summary', {}, `시도한 모델 (${j.attempts.length})`), el('ul', { className: 'issues' }, ...j.attempts.map((a) => el('li', {}, `${a.model} → ${a.status === 0 ? '응답 없음' : 'HTTP ' + a.status} · ${a.ms}ms${a.error ? ' · ' + a.error.slice(0, 80) : ''}`)))));
      if (!j.ok) parts.push(el('div', { className: 'hint' }, el('b', {}, '원인: '), j.error || '', el('br'), el('b', {}, '해결 방법: '), j.hint || ''));
      if (res && res.issues.length) parts.push(el('details', { open: true }, el('summary', {}, `검증 메모 (${res.issues.length})`), el('ul', { className: 'issues' }, ...res.issues.map((i) => el('li', {}, `[${i.level}] ${i.text}`)))));
      if (j.parsed) parts.push(el('details', { open: true }, el('summary', {}, '모델이 만든 구조화 JSON (검증 전)'), el('pre', {}, JSON.stringify(j.parsed, null, 2))));
      if (res) parts.push(el('details', {}, el('summary', {}, '서버 검증 후 결과 JSON'), el('pre', {}, JSON.stringify(res, null, 2))));
      if (j.rawText) parts.push(el('details', {}, el('summary', {}, '모델 응답 원문'), el('pre', {}, j.rawText)));
      detail.replaceChildren(...parts);
    }
  },
};
