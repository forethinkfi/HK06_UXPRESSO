// UXPRESSO kiosk prototype — vanilla JS, full re-render on state change (small app, simplicity over perf).
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString('ko-KR') + '원';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TEMP = { HOT: 'HOT · 따뜻하게', ICE: 'ICE · 차갑게' };
const TASTES = [['달콤한', '달콤한'], ['상큼한', '상큼한'], ['고소', '고소한'], ['부드러운', '부드러운'], ['진한', '진한'], ['논커피', '커피 없는 음료']];

const S = {
  screen: 'start', menus: [], cats: [], cat: '전체', tag: null,
  q: '', search: { st: 'idle', ids: [] }, ctl: null,
  cart: [], detail: null, dtl: null, help: false, helpOpen: -1, ask: { st: 'idle', text: '' },
  takeout: null, confirmCancel: false, toast: '', order: null, apiDown: false,
};
const dbg = { taps: 0, t0: 0, help: 0, on: new URLSearchParams(location.search).has('debug') }; // for usability-test logging (?debug=1)

// ---------- data (API first, bundled JSON fallback) ----------
async function boot() {
  try {
    const [m, c] = await Promise.all([fetch('/api/menus').then((r) => r.json()), fetch('/api/categories').then((r) => r.json())]);
    S.menus = m; S.cats = c;
  } catch {
    const d = await fetch('/data/menus.json').then((r) => r.json());
    S.menus = d.menus; S.cats = d.categories; S.apiDown = true;
  }
  render();
}
const menu = (id) => S.menus.find((m) => m.id === id);

// ---------- pricing ----------
const unit = (it) => {
  const m = menu(it.menuId);
  return m.price + m.options.reduce((s, g) => s + (g.choices.find((c) => c.id === it.opts[g.id])?.price || 0), 0);
};
const cartTotal = () => S.cart.reduce((s, it) => s + unit(it) * it.qty, 0);
const cartCount = () => S.cart.reduce((s, it) => s + it.qty, 0);
const optText = (it) => {
  const m = menu(it.menuId);
  return [TEMP[it.temp].split(' · ')[0] + '(' + TEMP[it.temp].split(' · ')[1] + ')', ...m.options.filter((g) => it.opts[g.id] && it.opts[g.id] !== '0').map((g) => g.choices.find((c) => c.id === it.opts[g.id]).label)].join(' · ');
};

// ---------- visuals ----------
const cup = (color) => `<svg viewBox="0 0 100 124" aria-hidden="true"><rect x="20" y="6" width="60" height="12" rx="5" fill="#2b2b2b"/><path d="M25 18h50l-6 92a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M28.5 46h43l-3.6 64.5a3 3 0 0 1-3 2.5H35.1a3 3 0 0 1-3-2.5z" fill="${color}"/></svg>`;
const temps = (m) => `<span class="temps">${m.temperature.map((t) => `<em class="${t === 'HOT' ? 'hot' : 'ice'}">${t === 'HOT' ? 'HOT 따뜻' : 'ICE 차가움'}</em>`).join('')}</span>`;
const card = (m) => `<button class="card" data-act="open" data-id="${m.id}"><div class="thumb">${cup(m.color)}</div><b>${esc(m.name)}</b><span class="price">${won(m.price)}</span>${temps(m)}<span class="meta">${m.tags.filter((t) => t !== '커피' && t !== '논커피').slice(0, 2).join(' · ')}</span></button>`;

// ---------- help content (contextual, S-04) ----------
const faqLocal = (m) => [
  ['커피가 들어가나요?', m.tags.includes('커피') ? '네, 커피(에스프레소)가 들어가요.' : '아니요, 커피가 들어가지 않아요.'],
  ['단 음료인가요?', m.tags.includes('달콤한') ? '달콤한 음료로 분류돼 있어요.' : '달콤한 음료로 분류돼 있지 않아요. 단맛이 필요하면 직원에게 문의해 주세요.'],
  ['따뜻한 것도 되나요?', m.temperature.length === 2 ? 'HOT(따뜻하게)와 ICE(차갑게) 모두 주문할 수 있어요.' : `이 메뉴는 ${TEMP[m.temperature[0]]}만 주문할 수 있어요.`],
  ['알레르기 정보가 궁금해요', '공식 알레르기 정보가 확인되지 않았어요. 알레르기가 있다면 꼭 직원에게 확인해 주세요.'],
];
const helpFor = () => {
  const m = S.detail && menu(S.detail);
  if (m) {
    const terms = m.options.map((g) => [`'${g.label}'이 뭐예요?`, g.help]);
    return { title: `${m.name} 주문 도움`, items: [...terms, ['온도는 꼭 골라야 하나요?', 'HOT·ICE가 모두 되는 메뉴는 온도를 꼭 골라야 담을 수 있어요.'], ['잘못 담았어요', '장바구니에서 옵션과 수량을 언제든 바꿀 수 있어요. 처음부터 다시 하지 않아도 돼요.'], ...faqLocal(m)] };
  }
  const by = {
    start: ['이용 안내', [['어떻게 주문하나요?', '① "주문하기"를 누르세요. ② 메뉴를 골라 옵션을 정하세요. ③ 장바구니에서 확인하고 결제하세요.'], ['결제는 어떻게 하나요?', '이 화면은 연습용이라 실제 결제는 되지 않아요.']]],
    menu: ['메뉴 고르기 도움', [['메뉴를 못 찾겠어요', '위 검색창에 "달콤하고 시원한 음료"처럼 말하듯이 적어 보세요. 아래 맛 버튼을 눌러도 좋아요.'], ['먹을 게 정해져 있어요', '"주요 메뉴"에서 바로 고를 수 있어요. 전체 메뉴는 아래 카테고리에 있어요.'], ['HOT, ICE가 뭐예요?', 'HOT은 따뜻하게, ICE는 차갑게예요. 메뉴를 누르면 고를 수 있어요.'], ['담은 메뉴는 어디서 봐요?', '아래 "장바구니 보기"를 누르세요.']]],
    cart: ['장바구니 도움', [['수량을 바꾸고 싶어요', '＋ − 버튼으로 바꿔요. 0이 되기 전에 "삭제"를 눌러도 돼요.'], ['옵션을 바꾸고 싶어요', '"옵션 수정"을 누르면 담은 메뉴 그대로 옵션만 바꿀 수 있어요.'], ['전부 취소하고 싶어요', '"전체 취소"를 누르면 한 번 더 확인해요.']]],
    confirm: ['주문 확인 도움', [['매장/포장은 뭐예요?', '"매장"은 매장에서 마시고, "포장"은 가져가요.'], ['금액이 이상해요', '"장바구니로"를 눌러 옵션별 금액을 다시 확인할 수 있어요.']]],
    pay: ['결제 도움', [['결제가 안 돼요', '아래 "직원 도움 요청"을 눌러 주세요. 주문 내용은 그대로 남아요.'], ['어떤 방법이 있나요?', '카드·간편결제·쿠폰 중 고르세요. 연습용이라 실제 결제는 되지 않아요.']]],
  }[S.screen] || ['주문 도움', []];
  return { title: by[0], items: by[1] };
};

// ---------- render ----------
const hdr = (left, right = '') => `<div class="hdr">${left}${right}</div>`;
const helpBtn = `<button class="helpbtn" data-act="help"><i>?</i>주문 도움</button>`;
const logo = `<div class="logo">MEGA MGC COFFEE<small>UXPRESSO 비공식 키오스크 개선안</small></div>`;

function viewStart() {
  return `<div class="screen start"><div class="tag">LESS WAIT, BETTER EXPERIENCE.</div><div class="big">UXPRESSO</div>
  <div class="flags"><span>FAST</span><span>EASY</span><span>SELF</span></div>
  <button class="btn go" data-act="begin">주문하기</button>
  <button class="btn ghost" data-act="help" style="font-size:36px;color:var(--ink)">이용 안내 보기</button>
  <div class="disc">메가MGC커피의 공식 프로젝트가 아닌 비공식 UX/UI 개선 프로토타입입니다. 메뉴·가격은 테스트 데이터예요.</div></div>`;
}

function viewMenu() {
  let list = S.menus, extra = '';
  const sr = S.search;
  if (sr.st === 'done') list = sr.ids.map(menu).filter(Boolean);
  else { if (S.cat !== '전체') list = list.filter((m) => m.category === S.cat); if (S.tag) list = list.filter((m) => m.tags.includes(S.tag)); }
  if (sr.st === 'loading') extra = `<div class="state"><div class="spin"></div>메뉴를 찾고 있어요…<button class="btn sec" data-act="cancelSearch">취소하고 직접 고르기</button></div>`;
  else if (sr.st === 'error') extra = `<div class="state">검색이 잘 안 돼요<p>아래 카테고리에서 직접 골라 주세요.</p><button class="btn sec" data-act="clearSearch">전체 메뉴 보기</button></div>`;
  else if (sr.st === 'done' && !list.length) extra = `<div class="state">"${esc(S.q)}"에 맞는 메뉴를 못 찾았어요<p>"달콤한", "시원한"처럼 다른 말로 입력해 보세요.</p><button class="btn sec" data-act="clearSearch">전체 메뉴 보기</button></div>`;
  else if (!list.length) extra = `<div class="state">조건에 맞는 메뉴가 없어요<p>맛 버튼을 한 번 더 눌러 해제해 보세요.</p></div>`;
  const banner = sr.st === 'done' && list.length ? `<div class="banner"><span>"${esc(S.q)}" 검색 결과 ${list.length}개</span><button class="btn sec" data-act="clearSearch">전체 메뉴</button></div>` : '';
  const searching = sr.st !== 'idle';
  const featured = S.menus.filter((m) => m.featured);
  return `<div class="screen">${hdr(logo, helpBtn)}
  <div class="scroll" data-keep>
   <form class="search" data-act="search"><input id="q" type="search" enterkeyhint="search" placeholder="예) 커피 말고 달콤하고 시원한 음료" value="${esc(S.q)}" aria-label="메뉴 검색"><button class="btn" type="submit">찾기</button></form>
   ${searching ? '' : `<div class="sect"><h3>주요 메뉴 <span style="font-weight:600">(바로 선택)</span></h3></div><div class="strip">${featured.map((m) => `<button class="mini" data-act="open" data-id="${m.id}"><div class="thumb">${cup(m.color)}</div><b>${esc(m.name)}</b><span>${won(m.price)}</span></button>`).join('')}</div>
   <div class="tabs" role="tablist">${['전체', ...S.cats].map((c) => `<button class="tab" aria-pressed="${S.cat === c}" data-act="cat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
   <div class="chips">${TASTES.map(([t, l]) => `<button class="chip" aria-pressed="${S.tag === t}" data-act="tag" data-v="${t}">${l}</button>`).join('')}</div>`}
   ${banner}${extra}
   ${sr.st === 'loading' || sr.st === 'error' ? '' : `<div class="grid">${list.map(card).join('')}</div>`}
  </div>
  ${cartBar()}</div>`;
}
const cartBar = () => `<div class="foot"><div class="cartbar"><div class="sum">담은 메뉴 ${cartCount()}개<b id="cb">${won(cartTotal())}</b></div><button class="btn pri" data-act="goCart" ${cartCount() ? '' : 'disabled'}>${cartCount() ? '장바구니 보기' : '메뉴를 골라 주세요'}</button></div></div>`;

function viewDetail() {
  const m = menu(S.detail), d = S.dtl;
  const need = m.temperature.length > 1 && !d.temp;
  const it = { menuId: m.id, temp: d.temp || m.temperature[0], opts: d.opts, qty: d.qty };
  const tg = (act, id, label, sub, on, off) => `<button class="choice" data-act="${act}" data-v="${id}" aria-pressed="${on}" ${off ? 'disabled' : ''}><span class="nm">${label}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const groups = m.options.map((g) => {
    const off = g.onlyTemp && d.temp !== g.onlyTemp;
    return `<div class="group"><h4>${g.label}<span class="badge opt">선택</span></h4><p class="hlp">${off ? 'ICE를 고르면 선택할 수 있어요. ' : ''}${g.help}</p><div class="choices">${g.choices.map((c) => tg('opt', g.id + ':' + c.id, c.label, c.price ? `+${won(c.price)}` : '', !off && (d.opts[g.id] || '0') === c.id, off)).join('')}</div></div>`;
  }).join('');
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="${esc(m.name)} 옵션"><div class="sheet-h"><span class="title">메뉴 선택</span><div style="display:flex;gap:12px"><button class="helpbtn" data-act="help"><i>?</i>도움</button><button class="x" data-act="closeDetail" aria-label="닫기">✕ 닫기</button></div></div>
  <div class="sheet-body" data-keep>
   <div class="hero"><div class="thumb">${cup(m.color)}</div><div><h2>${esc(m.name)}</h2><div class="price">${won(m.price)}</div><p>${esc(m.description)}</p><div class="tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div></div></div>
   <details><summary>영양·알레르기·출처 보기</summary><p>영양정보: ${m.nutrition ? '' : '공식 정보가 확인되지 않았어요.'}</p><p>알레르기: ${m.allergens ? '' : '공식 정보가 확인되지 않았어요. 알레르기가 있다면 직원에게 확인해 주세요.'}</p><p>출처: ${esc(m.source)}</p></details>
   <div class="group"><h4>온도<span class="badge">필수</span></h4><p class="hlp">${m.temperature.length > 1 ? '따뜻하게(HOT) 또는 차갑게(ICE) 중 하나를 골라 주세요.' : `이 메뉴는 ${TEMP[m.temperature[0]]}만 주문할 수 있어요.`}</p><div class="choices">${['HOT', 'ICE'].map((t) => tg('temp', t, TEMP[t], '', (d.temp || (m.temperature.length === 1 ? m.temperature[0] : '')) === t, !m.temperature.includes(t))).join('')}</div>${S.dtl.tried && need ? '<div class="err">⚠ 온도를 먼저 골라 주세요</div>' : ''}</div>
   ${groups}
   <div class="group" style="display:flex;align-items:center;justify-content:space-between"><h4>수량</h4><div class="stepper"><button data-act="dq" data-v="-1" aria-label="수량 줄이기" ${d.qty <= 1 ? 'disabled' : ''}>−</button><output>${d.qty}</output><button data-act="dq" data-v="1" aria-label="수량 늘리기" ${d.qty >= 20 ? 'disabled' : ''}>＋</button></div></div>
  </div>
  <div class="foot"><button class="btn pri block" data-act="addCart">${d.editIdx != null ? '수정 완료' : '담기'} · ${won(unit(it) * d.qty)}</button></div></div></div>`;
}

function viewCart() {
  if (!S.cart.length) return `<div class="screen">${hdr(`<button class="back" data-act="toMenu">← 메뉴</button>`, helpBtn)}<div class="empty">장바구니가 비어 있어요<p>메뉴를 골라 담아 보세요.</p><button class="btn pri" data-act="toMenu">메뉴 고르러 가기</button></div></div>`;
  return `<div class="screen">${hdr(`<button class="back" data-act="toMenu">← 메뉴 더 담기</button>`, helpBtn)}
  <div class="scroll" data-keep><div class="h2" style="padding-bottom:0">장바구니 <span style="font-size:32px;color:var(--mute)">${cartCount()}개</span></div><div class="list">${S.cart.map((it, i) => { const m = menu(it.menuId); return `<div class="item"><div class="thumb">${cup(m.color)}</div><div><h4>${esc(m.name)}</h4><div class="opts">${optText(it)}</div><div class="opts">개당 ${won(unit(it))}</div></div><div class="lp">${won(unit(it) * it.qty)}</div>
   <div class="acts"><div class="stepper sm"><button data-act="cq" data-i="${i}" data-v="-1" aria-label="수량 줄이기" ${it.qty <= 1 ? 'disabled' : ''}>−</button><output>${it.qty}</output><button data-act="cq" data-i="${i}" data-v="1" aria-label="수량 늘리기" ${it.qty >= 20 ? 'disabled' : ''}>＋</button></div><span style="display:flex;gap:12px"><button class="btn sec" data-act="edit" data-i="${i}">옵션 수정</button><button class="btn sec" data-act="del" data-i="${i}">삭제</button></span></div></div>`; }).join('')}</div></div>
  <div class="total"><span>총 결제 금액</span><b>${won(cartTotal())}</b></div>
  <div class="foot"><button class="btn sec" data-act="askCancel" style="flex:none">전체 취소</button><button class="btn pri" data-act="toConfirm">주문하기</button></div></div>`;
}

function viewConfirm() {
  return `<div class="screen">${hdr(`<button class="back" data-act="goCart">← 장바구니로</button>`, helpBtn)}
  <div class="scroll"><div class="h2">드시고 가세요? 가져가세요?</div>
  <div class="two"><button class="big" data-act="takeout" data-v="매장" aria-pressed="${S.takeout === '매장'}">매장<small>여기서 먹어요</small></button><button class="big" data-act="takeout" data-v="포장" aria-pressed="${S.takeout === '포장'}">포장<small>가져갈게요</small></button></div>
  <div class="h2" style="padding-bottom:0">주문 내역</div><div class="sum-list">${S.cart.map((it) => `<div><span>${esc(menu(it.menuId).name)} × ${it.qty}<small>${optText(it)}</small></span><span>${won(unit(it) * it.qty)}</span></div>`).join('')}</div></div>
  <div class="total"><span>최종 결제 금액</span><b>${won(cartTotal())}</b></div>
  <div class="foot"><button class="btn pri block" data-act="toPay" ${S.takeout ? '' : 'disabled'}>${S.takeout ? '결제하기' : '매장·포장을 골라 주세요'}</button></div></div>`;
}

function viewPay() {
  if (S.paying) return `<div class="screen done" style="background:var(--bg)"><div class="spin"></div><h1 style="font-size:52px">결제 중이에요…</h1><p>잠시만 기다려 주세요 (연습용 결제)</p></div>`;
  return `<div class="screen">${hdr(`<button class="back" data-act="toConfirm">← 이전</button>`, helpBtn)}
  <div class="scroll"><div class="h2">결제 방법을 골라 주세요</div>
  <div class="pay">${['신용·체크카드', '간편결제', '쿠폰·기프티콘'].map((p) => `<button class="big" data-act="pay" data-v="${p}">${p}</button>`).join('')}</div>
  <div class="note">연습용 화면이에요. 실제 결제는 이루어지지 않고, 카드 정보도 받지 않아요.</div></div>
  <div class="total"><span>결제 금액</span><b>${won(cartTotal())}</b></div></div>`;
}

function viewDone() {
  const o = S.order;
  return `<div class="screen done"><h1>주문이 완료됐어요!</h1><div class="no" aria-label="주문번호 ${o.no}">${o.no}</div>
  <p>${o.takeout === '포장' ? '포장' : '매장'} 주문 · 번호가 호출되면 픽업대에서 받아 가세요.</p>
  <div class="sum-list">${o.items.map((l) => `<div><span>${esc(l.name)} × ${l.qty}<small>${l.opt}</small></span><span>${won(l.price)}</span></div>`).join('')}<div><span>합계</span><span>${won(o.total)}</span></div></div>
  <button class="btn" data-act="reset" style="background:var(--ink);color:#fff;min-height:120px;font-size:48px;width:100%">새 주문 시작 (<span id="cd">${o.left}</span>초 후 자동)</button></div>`;
}

function viewHelp() {
  const h = helpFor(), m = S.detail && menu(S.detail);
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="주문 도움" style="z-index:20"><div class="sheet-h"><span class="title">${esc(h.title)}</span><button class="x" data-act="closeHelp">✕ 닫고 계속하기</button></div>
  <div class="sheet-body" data-keep><p class="hlp" style="font-size:30px">주문 내용은 그대로 남아 있어요. 궁금한 걸 눌러 보세요.</p>
   <div class="faq">${h.items.map(([q, a], i) => `<div style="margin-top:14px"><button class="q" data-act="faq" data-i="${i}" aria-expanded="${S.helpOpen === i}">${esc(q)}<span>${S.helpOpen === i ? '▲' : '▼'}</span></button>${S.helpOpen === i ? `<div class="a">${esc(a)}</div>` : ''}</div>`).join('')}</div>
   ${m ? `<div class="group"><h4>${esc(m.name)}에 대해 물어보기</h4><form class="ask" data-act="ask"><input id="aq" placeholder="예) 우유가 들어가나요?" value="${esc(S.ask.text)}" aria-label="질문 입력"><button class="btn pri" type="submit">물어보기</button></form>
   ${S.ask.st === 'loading' ? `<div class="aiA"><span class="spin" style="display:inline-block;width:36px;height:36px;border-width:6px;vertical-align:middle;margin-right:12px"></span>찾고 있어요… <button class="btn ghost" data-act="cancelAsk" style="min-height:56px;font-size:28px">취소</button></div>` : S.ask.st === 'done' ? `<div class="aiA">${esc(S.ask.a)}</div>` : ''}</div>` : ''}
  </div>
  <div class="sheet-f"><div style="font-size:28px;color:var(--mute);font-weight:600">알레르기나 결제 문제는 직원 확인이 필요해요.</div><div class="row"><button class="btn sec" data-act="staff">🙋 직원 도움 요청</button><button class="btn pri" data-act="closeHelp">주문 계속하기</button></div></div></div></div>`;
}

const dialogCancel = () => `<div class="dim center" style="z-index:25"><div class="dialog" role="alertdialog"><h2>주문을 전부 취소할까요?</h2><p style="font-size:34px">담은 메뉴 ${cartCount()}개가 모두 지워져요.</p><div class="row"><button class="btn sec" data-act="keep">아니요, 계속할게요</button><button class="btn pri" data-act="reset" style="background:var(--err);color:#fff;border-color:var(--err)">네, 전체 취소</button></div></div></div>`;

function render() {
  const keep = [...document.querySelectorAll('[data-keep]')].map((e) => e.scrollTop);
  const v = { start: viewStart, menu: viewMenu, cart: viewCart, confirm: viewConfirm, pay: viewPay, done: viewDone }[S.screen]();
  $('#stage').innerHTML = v + (S.detail ? viewDetail() : '') + (S.help ? viewHelp() : '') + (S.confirmCancel ? dialogCancel() : '') +
    (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : '') + (S.apiDown ? '<div class="dbg" style="left:auto;right:8px;color:#fc0">기본 메뉴 데이터 사용 중</div>' : '') +
    (dbg.on ? `<div class="dbg" id="dbg"></div>` : '');
  document.querySelectorAll('[data-keep]').forEach((e, i) => { if (keep[i]) e.scrollTop = keep[i]; });
}

// ---------- actions ----------
const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2200); };
const go = (s) => { S.screen = s; S.detail = null; S.help = false; render(); };
const closeHelp = () => { S.help = false; S.helpOpen = -1; S.ask = { st: 'idle', text: '' }; render(); };
const openDetail = (id, edit) => {
  const m = menu(id);
  S.detail = id; S.help = false;
  S.dtl = edit ? { temp: edit.temp, opts: { ...edit.opts }, qty: edit.qty, editIdx: edit.idx } : { temp: m.temperature.length === 1 ? m.temperature[0] : '', opts: {}, qty: 1, editIdx: null };
  render();
};
const reset = () => { clearInterval(reset.t); Object.assign(S, { screen: 'start', cart: [], detail: null, help: false, cat: '전체', tag: null, q: '', search: { st: 'idle', ids: [] }, takeout: null, confirmCancel: false, order: null, paying: false }); dbg.t0 = 0; render(); };
const merge = () => { // merge identical lines after an edit
  const out = [];
  for (const it of S.cart) { const k = JSON.stringify([it.menuId, it.temp, it.opts]); const f = out.find((o) => JSON.stringify([o.menuId, o.temp, o.opts]) === k); f ? (f.qty = Math.min(20, f.qty + it.qty)) : out.push(it); }
  S.cart = out;
};

async function runSearch(q) {
  S.q = q; if (!q.trim()) { S.search = { st: 'idle', ids: [] }; return render(); }
  S.ctl?.abort(); S.ctl = new AbortController();
  S.search = { st: 'loading', ids: [] }; render();
  try {
    const r = await fetch('/api/search', { method: 'POST', body: JSON.stringify({ query: q }), signal: S.ctl.signal }).then((x) => x.json());
    S.search = { st: 'done', ids: r.ids };
  } catch (e) { if (e.name === 'AbortError') return; S.search = { st: 'error', ids: [] }; }
  render();
}
async function runAsk(text) {
  S.ask = { st: 'loading', text };
  S.ctl?.abort(); S.ctl = new AbortController(); render();
  try {
    const r = await fetch('/api/ask', { method: 'POST', body: JSON.stringify({ question: text, menuId: S.detail }), signal: S.ctl.signal }).then((x) => x.json());
    S.ask = { st: 'done', text, a: r.answer };
  } catch (e) { if (e.name === 'AbortError') return; S.ask = { st: 'done', text, a: '지금은 답을 못 찾았어요. 직원 도움 요청을 눌러 주세요.' }; }
  render();
}

const A = {
  begin: () => { dbg.t0 = Date.now(); go('menu'); },
  help: () => { S.help = true; S.helpOpen = -1; dbg.help++; render(); },
  closeHelp, faq: (e) => { S.helpOpen = S.helpOpen === +e.i ? -1 : +e.i; render(); },
  staff: () => { closeHelp(); toast('직원에게 알렸어요. 주문 내용은 그대로 두었어요.'); },
  cat: (e) => { S.cat = e.v; render(); },
  tag: (e) => { S.tag = S.tag === e.v ? null : e.v; render(); },
  clearSearch: () => { S.ctl?.abort(); S.q = ''; S.search = { st: 'idle', ids: [] }; render(); },
  cancelSearch: () => A.clearSearch(), cancelAsk: () => { S.ctl?.abort(); S.ask = { st: 'idle', text: S.ask.text }; render(); },
  open: (e) => openDetail(e.id),
  closeDetail: () => { S.detail = null; render(); },
  temp: (e) => { S.dtl.temp = e.v; menu(S.detail).options.forEach((g) => { if (g.onlyTemp && g.onlyTemp !== e.v) delete S.dtl.opts[g.id]; }); render(); },
  opt: (e) => { const [g, c] = e.v.split(':'); S.dtl.opts[g] = c; render(); },
  dq: (e) => { S.dtl.qty = Math.max(1, Math.min(20, S.dtl.qty + +e.v)); render(); },
  addCart: () => {
    const m = menu(S.detail), d = S.dtl;
    if (!d.temp) { d.tried = true; render(); return $('.err')?.scrollIntoView({ block: 'center' }); }
    const opts = Object.fromEntries(Object.entries(d.opts).filter(([, v]) => v !== '0'));
    const line = { menuId: m.id, temp: d.temp, opts, qty: d.qty };
    if (d.editIdx != null) S.cart[d.editIdx] = line; else S.cart.push(line);
    merge(); S.detail = null; const edit = d.editIdx != null;
    if (edit) { render(); toast('옵션을 바꿨어요'); } else { render(); toast(`${m.name}을(를) 담았어요`); }
    document.getElementById('cb')?.classList.add('bump');
  },
  goCart: () => go('cart'), toMenu: () => go('menu'),
  cq: (e) => { const it = S.cart[+e.i]; it.qty = Math.max(1, Math.min(20, it.qty + +e.v)); render(); },
  del: (e) => { S.cart.splice(+e.i, 1); render(); },
  edit: (e) => { const it = S.cart[+e.i]; openDetail(it.menuId, { ...it, idx: +e.i }); },
  askCancel: () => { S.confirmCancel = true; render(); }, keep: () => { S.confirmCancel = false; render(); },
  reset,
  toConfirm: () => go('confirm'),
  takeout: (e) => { S.takeout = e.v; render(); },
  toPay: () => go('pay'),
  pay: () => {
    S.paying = true; render();
    setTimeout(() => {
      S.paying = false;
      S.order = { no: 'A-' + String(100 + Math.floor(Math.random() * 900)), takeout: S.takeout, total: cartTotal(), left: 20, items: S.cart.map((it) => ({ name: menu(it.menuId).name, qty: it.qty, opt: optText(it), price: unit(it) * it.qty })) };
      S.cart = []; // previous customer's order cleared right after payment (FR-07)
      go('done');
      reset.t = setInterval(() => { S.order.left--; const c = $('#cd'); if (c) c.textContent = S.order.left; if (S.order.left <= 0) reset(); }, 1000);
    }, 1600);
  },
};

document.addEventListener('click', (ev) => {
  dbg.taps++;
  const el = ev.target.closest('[data-act]');
  if (el && A[el.dataset.act]) A[el.dataset.act](el.dataset);
});
document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const f = ev.target.dataset.act;
  if (f === 'search') runSearch($('#q').value.trim());
  if (f === 'ask' && $('#aq').value.trim()) runAsk($('#aq').value.trim());
});
document.addEventListener('input', (ev) => { if (ev.target.id === 'q') S.q = ev.target.value; if (ev.target.id === 'aq') S.ask.text = ev.target.value; });

// scale the fixed 1080x1920 kiosk stage into the viewport
const fit = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); const st = $('#stage'); st.style.transform = `scale(${s})`; st.style.left = (innerWidth - 1080 * s) / 2 + 'px'; st.style.top = (innerHeight - 1920 * s) / 2 + 'px'; };
addEventListener('resize', fit); fit();
if (dbg.on) setInterval(() => { const d = $('#dbg'); if (d) d.textContent = `taps ${dbg.taps} · ${dbg.t0 ? Math.round((Date.now() - dbg.t0) / 1000) : 0}s · help ${dbg.help}`; }, 500);
boot();
