// UXPRESSO kiosk prototype — vanilla JS, full re-render on state change (small app, simplicity over perf).
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString('ko-KR') + '원';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Store-specific copy lives here so it can be adjusted per shop.
const PICKUP_TEXT = '주문번호가 호출되면 음료를 받아 주세요.';
const RETURN_MS = 30000; // silent return to start screen (no countdown shown)
const SESS_IDLE_MS = 120000, SESS_GRACE_MS = 60000; // PRD v3 FR-17 proposal: 120s idle -> warning, 60s grace -> reset (to be confirmed on site)

const MODES = {
  dine: { name: '매장에서 먹기', sub: '매장 안에서 드실 분', icon: 'store', en: 'Dine in', tag: '매장 식사' },
  take: { name: '포장하기', sub: '음료를 가지고 가실 분', icon: 'bag', en: 'Takeout', tag: '포장 주문' },
};
const TEMP = { HOT: 'HOT 따뜻하게', ICE: 'ICE 차갑게' }; // HOT/ICE are the primary labels (DS v2)
const TEMP_SHORT = { HOT: 'HOT 따뜻하게', ICE: 'ICE 차갑게' };
// Quick filters: coffee pair is mutually exclusive, taste filters combine (AND).
const FILTERS = [['커피', '커피가 들어간 음료'], ['논커피', '커피가 들어가지 않은 음료'], ['달콤한', '달콤한'], ['상큼한', '상큼한'], ['부드러운', '부드러운'], ['깔끔한', '깔끔한']];

// 8 primary categories (PRD v3 FR-02). Categories without data show an honest empty state instead of invented menus.
const TSUBS = [['all', '전체'], ['HOT', 'HOT 따뜻하게'], ['ICE', 'ICE 차갑게']];
const PRIMS = [
  { id: 'new', name: '신메뉴', fn: () => false, empty: '신메뉴로 표시된 메뉴가 아직 없어요.' },
  { id: 'rec', name: '추천메뉴', fn: (m) => m.featured, subs: [['all', '추천·인기']], badge: '추천' },
  { id: 'coffee', name: '커피', fn: (m) => m.category === '커피', subs: TSUBS },
  { id: 'decaf', name: '디카페인', fn: (m) => m.tags.includes('디카페인'), subs: TSUBS },
  { id: 'drink', name: '음료', fn: (m) => m.category === '라떼' || m.category === '에이드·스무디', subs: [['all', '전체'], ['latte', '라떼·밀크'], ['ade', '에이드·스무디']] },
  { id: 'tea', name: '티', fn: (m) => m.category === '티', subs: TSUBS },
  { id: 'food', name: '푸드', fn: () => false, empty: '푸드 메뉴는 이 시안 데이터에 없어요.' },
  { id: 'goods', name: '상품', fn: () => false, empty: '상품은 이 시안 데이터에 없어요.' },
];
const SUBFN = { all: () => true, HOT: (m) => m.temperature.includes('HOT'), ICE: (m) => m.temperature.includes('ICE'), latte: (m) => m.category === '라떼', ade: (m) => m.category === '에이드·스무디' };
const visibleMenus = () => { const P = PRIMS.find((x) => x.id === S.prim); return S.menus.filter((m) => (!P || P.fn(m)) && (SUBFN[S.sub] || SUBFN.all)(m) && S.filters.every((t) => m.tags.includes(t)) && (!S.vf?.max || m.price <= S.vf.max)); };
const goPrim = (id, sub = 'all') => { S.prim = id; S.sub = sub; S.filters = []; S.vf = null; };

const S = {
  screen: 'start', menus: [], cats: [], prim: 'rec', sub: 'all', tasteOpen: false, dlg: null, filters: [],
  cart: [], detail: null, dtl: null, help: false, helpOpen: -1,
  mode: null, modeDialog: false, confirmCancel: false, toast: '', order: null, apiDown: false,
  types: [], methods: [], groups: [], typeOpen: -1,
  pre: { code: '', res: null, busy: false }, // precheck screen (S-C1)
  voice: { on: false, st: 'idle', heard: '', say: '', next: '', pend: null, ask: null, cands: null, req: 0 }, // mock voice order (PRD v3 FR-07~13)
  usedVoice: false, vf: null, // vf = list filter set by voice/touch: { label, rec?, max? }
  sess: { last: Date.now(), warn: 0, freeze: false },
  pay: { method: null, code: '', cpn: null, busy: false, phase: 'choose', fail: null, key: '', attempt: 0, tx: null, benefit: null, cpnOpen: false, stamp: false }, // pay flow
};
const dbg = { taps: 0, t0: 0, help: 0, on: new URLSearchParams(location.search).has('debug') }; // usability-test logging (?debug=1)

// ---------- data (API first, bundled JSON fallback) ----------
// ---------- demo presets (?demo=name) — used by /screens.html design board ----------
function demo(n) {
  const add = (menuId, temp, opts = {}, qty = 1) => S.cart.push({ menuId, temp, opts, qty });
  S.sess.freeze = true; // design-board presets must not time out
  const V = S.voice;
  if (n === 'start') return;
  if (n === 'voice-start') { V.on = true; V.st = 'listening'; S.usedVoice = true; return; }
  if (n === 'menu-coffee') { S.mode = 'take'; S.screen = 'menu'; S.prim = 'coffee'; add('latte', 'ICE', {}, 2); return; }
  if (n === 'pre') { S.screen = 'pre'; S.pre.res = { status: 'unusable', coupon: { name: '앱 전용 쿠폰' }, reason: '앱 전용 쿠폰은 키오스크에서 쓸 수 없어요.', alternative: '앱에서 주문하거나, 쿠폰 없이 이 키오스크에서 결제해 주세요.' }; S.typeOpen = 1; return; }
  S.mode = 'dine'; S.screen = 'menu';
  add('latte', 'ICE', { shot: '1' }); add('americano', 'ICE');
  if (n === 'detail') { S.cart = []; openDetail('latte'); S.dtl.temp = 'ICE'; }
  if (n === 'help') { S.help = true; S.helpOpen = 0; }
  if (n === 'mode') S.modeDialog = true;
  if (n === 'filter') { S.cart = []; S.prim = 'all'; S.filters = ['논커피', '달콤한']; }
  if (n.startsWith('voice-')) {
    S.cart = []; V.on = true; S.usedVoice = true;
    if (n === 'voice-idle') { V.on = false; }
    if (n === 'voice-listening') V.st = 'listening';
    if (n === 'voice-processing') { V.st = 'processing'; V.heard = '아이스 아메리카노 두 잔 주세요'; }
    if (n === 'voice-confirm') { V.st = 'confirming'; V.heard = '아이스 아메리카노 두 잔 주세요'; V.say = '이렇게 담아드릴까요?'; V.next = '맞으면 담고, 다르면 수정해 주세요.'; V.pend = { menuId: 'americano', temp: 'ICE', qty: 2 }; }
    if (n === 'voice-ask') { V.st = 'idle'; V.heard = '카페라떼 주세요'; V.say = '따뜻하게 드릴까요, 차갑게 드릴까요?'; V.next = '말하거나 화면을 눌러 주세요.'; V.ask = 'latte'; }
    if (n === 'voice-error') { V.st = 'error'; V.say = ''; V.next = '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.'; }
    if (n === 'voice-recommend') { V.st = 'idle'; V.heard = '메뉴 추천해 줘'; V.say = '추천 메뉴를 보여드릴게요.'; V.next = '원하는 메뉴를 말하거나 화면에서 선택해 주세요.'; S.prim = 'rec'; }
    if (n === 'voice-end') { V.on = false; S.screen = 'confirm'; S.cart = []; add('americano', 'ICE', {}, 2); }
  }
  if (n === 'session') { S.sess.warn = Date.now() - 18000; }
  if (n === 'pay-benefit') { S.screen = 'pay'; S.pay.benefit = 'tmem'; S.pay.method = 'kakao'; }
  if (n === 'lang') S.dlg = 'lang';
  if (n === 'cart') S.screen = 'cart';
  if (n === 'voice-end') { S.screen = 'confirm'; }
  if (n === 'confirm') S.screen = 'confirm';
  if (n.startsWith('pay') || n === 'done') {
    S.screen = 'pay'; S.pay.method = 'card';
    if (n === 'pay-coupon') S.pay.cpn = { status: 'ok', coupon: { code: 'WELCOME10', name: '10% 할인 쿠폰', type: 'discount' }, discount: 650 };
    if (n === 'pay-unusable') S.pay.cpn = { status: 'unusable', coupon: { name: '10% 할인 쿠폰' }, reason: '5,000원 이상 주문할 때 쓸 수 있어요. 지금은 2,500원이에요.', alternative: '2,500원 더 담으면 쓸 수 있어요. 아니면 쿠폰 없이 결제할 수 있어요.', hint: 'addMore' };
    if (n === 'pay-fail') { S.pay.phase = 'failed'; S.pay.fail = { reason: '네이버페이 승인이 거절됐어요. 잔액이나 한도가 부족할 수 있어요.', solution: '다른 결제 수단을 고르거나 같은 수단으로 다시 시도해 주세요. 담은 메뉴는 그대로예요.' }; }
    if (n === 'pay-pending') S.pay.phase = 'pending';
    if (n === 'done') { S.order = { no: 'A-127', mode: 'dine', discount: 650, final: 5850, coupon: '10% 할인 쿠폰', method: '신용·체크카드', items: S.cart.map((it) => ({ name: menu(it.menuId).name, qty: it.qty, opt: optText(it), price: unit(it) * it.qty })) }; S.cart = []; S.screen = 'done'; }
  }
}

async function boot() {
  try {
    const [m, c] = await Promise.all([fetch('/api/menus').then((r) => r.json()), fetch('/api/categories').then((r) => r.json())]);
    S.menus = m; S.cats = c;
  } catch {
    const d = await fetch('/data/menus.json').then((r) => r.json());
    S.menus = d.menus; S.cats = d.categories; S.apiDown = true;
  }
  try { S.types = (await fetch('/api/coupons').then((r) => r.json())).types; } catch { S.types = (await fetch('/data/coupons.json').then((r) => r.json())).types; }
  try { Object.assign(S, (({ methods, groups, benefits }) => ({ methods, groups, benefits }))(await fetch('/api/payment-methods').then((r) => r.json()))); } catch { Object.assign(S, (({ methods, groups, benefits }) => ({ methods, groups, benefits }))(await fetch('/data/payments.json').then((r) => r.json()))); }
  const dm = new URLSearchParams(location.search).get('demo'); if (dm) demo(dm);
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
const optText = (it) => [TEMP_SHORT[it.temp], ...menu(it.menuId).options.filter((g) => it.opts[g.id]).map((g) => g.choices.find((c) => c.id === it.opts[g.id]).label)].join(' · ');

// ---------- visuals ----------
const L = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`; // Lucide icons, hydrated in render()
const icon = (n) => L({ store: 'coffee', bag: 'cup-soda' }[n]);
const ico = (n) => L({ home: 'house', globe: 'languages', clock: 'clock', chev: 'chevron-right', hand: 'hand', check: 'check' }[n]);
const pic = (m) => `<img src="${m.image_url}" alt="${esc(m.name)}" loading="lazy" onerror="this.style.display='none'">`; // Unsplash placeholder photos (not official product shots)
const features = (m) => [m.tags.includes('커피') ? '커피 들어감' : '커피 없음', ...m.tags.filter((t) => t !== '커피' && t !== '논커피').slice(0, 2)];

// ---------- help content (contextual, S-04) ----------
const helpFor = () => {
  const m = S.detail && menu(S.detail);
  if (m) {
    return { title: `${m.name} 주문 도움`, items: [
      ...m.options.map((g) => [`'${g.label}'는 무슨 뜻이에요?`, `${g.term}이에요. ${g.help}`]),
      ['꼭 골라야 하는 게 있나요?', '온도만 꼭 골라 주세요. 나머지 옵션은 안 골라도 주문할 수 있어요.'],
      ['잘못 담았어요', '장바구니에서 옵션과 수량을 언제든 바꿀 수 있어요. 처음부터 다시 하지 않아도 돼요.'],
      ['알레르기 정보가 궁금해요', '공식 알레르기 정보가 확인되지 않았어요. 알레르기가 있다면 직원에게 확인해 주세요.'],
    ] };
  }
  const by = {
    start: ['이용 안내', [[['음성으로 주문하고 싶어요', '"음성으로 주문하기"를 누르고 "매장에서 먹을게요"처럼 말해 보세요. 결제와 쿠폰은 항상 화면을 눌러 직접 해요.'], '어떻게 주문하나요?', '① 매장에서 먹을지, 포장할지 골라요. ② 메뉴를 골라 장바구니에 담아요. ③ 주문 내역을 확인하고 결제해요.'], ['잘못 골랐어요', '나중에 장바구니나 주문 확인 화면에서 바꿀 수 있어요.']]],
    menu: ['메뉴 고르기 도움', [[['음성으로 주문할 수 있나요?', '위쪽 검정 "음성으로 주문하기" 버튼을 누르고 원하는 메뉴를 말해 보세요. 연습용이라 아래 문장을 눌러 말한 것처럼 입력해요. 안 쓰고 화면에서 눌러도 똑같이 주문할 수 있어요.'], '메뉴를 못 정하겠어요', '위 "주요 메뉴"에서 바로 고르거나, 취향 버튼(달콤한, 상큼한 등)을 눌러 범위를 좁혀 보세요.'], ['커피를 안 마셔요', '"커피가 들어가지 않은 음료" 버튼을 누르면 해당 메뉴만 보여요.'], ['담은 메뉴는 어디서 봐요?', '아래 "장바구니 보기"를 누르세요.'], ['매장/포장을 바꾸고 싶어요', '위쪽 "바꾸기"를 누르면 담은 메뉴는 그대로 두고 바꿀 수 있어요.']]],
    cart: ['장바구니 도움', [['수량을 바꾸고 싶어요', '＋ − 버튼으로 바꿔요.'], ['옵션을 바꾸고 싶어요', '"옵션 수정"을 누르면 메뉴는 그대로 두고 옵션만 바꿀 수 있어요.'], ['전부 취소하고 싶어요', '"전체 주문 취소"를 누르면 한 번 더 물어봐요.']]],
    confirm: ['주문 확인 도움', [[['음성 주문은 어디 갔어요?', '주문 확인부터는 화면을 눌러 직접 진행해요. 메뉴를 더 담으려면 "주문 수정"으로 돌아가 "음성으로 주문하기"를 다시 누르세요.'], '내용을 고치고 싶어요', '"주문 수정"을 누르면 장바구니로 돌아가요. 담은 내용은 그대로예요.'], ['매장/포장을 바꾸고 싶어요', '"바꾸기"를 눌러 다시 고를 수 있어요.']]],
    pay: ['결제 도움', [['쿠폰은 어떻게 써요?', '"쿠폰이 있나요?"에 쿠폰 번호를 넣고 "적용하기"를 누르세요. 할인 금액이 바로 보여요. 쿠폰이 없으면 그냥 넘어가면 돼요.'], ['쿠폰이 안 돼요', '화면에 이유와 해결 방법이 나와요. 다른 쿠폰을 넣거나, 쿠폰 없이 결제하거나, 주문을 고칠 수 있어요. 담은 메뉴는 그대로예요.'], ['결제가 안 돼요', '화면의 안내에 따라 다른 결제 수단을 고르거나 다시 시도하세요. 막히면 "직원 도움 요청"을 눌러 주세요.'], ['결제가 두 번 되나요?', '아니요. 같은 주문은 한 번만 결제돼요.']]],
    pre: ['쿠폰·결제 수단 도움', [['꼭 해야 하나요?', '아니요. 쿠폰이 궁금할 때만 확인하세요. 안 해도 바로 주문할 수 있어요.'], ['목록에 없는 쿠폰이에요', '키오스크에서 확인할 수 없는 쿠폰은 직원 확인이 필요해요. "직원 도움 요청"을 눌러 주세요.']]],
  }[S.screen] || ['주문 도움', []];
  return { title: by[0], items: by[1] };
};

// ---------- views ----------
const hdr = (left, right = '') => `<div class="hdr">${left}${right}</div>`;
const helpBtn = `<button class="helpbtn" data-act="help"><i>?</i>주문 도움</button>`;
const langBtn = `<button class="ibtn" data-act="dlg" data-v="lang" aria-label="언어 선택">${ico('globe')}</button>`;
const homeBtn = `<button class="ibtn" data-act="goHome" aria-label="처음으로">${ico('home')}</button>`;
const backB = (act, label) => `<button class="back2" data-act="${act}">${label}</button>`;
const topbar = (left = '') => `<div class="hdr2"><span class="hl">${left}</span><b class="ttl">MEGA MGC COFFEE</b><span class="hr">${langBtn}${helpBtn}</span></div>`;
const crumbs = (n) => `<nav class="crumbs" aria-label="주문 단계">${['메뉴 선택', '주문 확인', '결제하기'].map((t, i) => `<span class="${i === n ? 'on' : ''}"${i === n ? ' aria-current="step"' : ''}>${t}</span>`).join('<i aria-hidden="true">›</i>')}</nav>`;
const logo = `<div class="logo">MEGA MGC COFFEE<small>UXPRESSO 비공식 키오스크 개선안</small></div>`;
const modeBar = () => `<div class="modebar"><span class="mi">${icon(MODES[S.mode].icon)}</span><span><small>주문 방식</small><b>${MODES[S.mode].name}</b></span><button class="btn sec sm2" data-act="modeDlg">바꾸기</button></div>`;
const modeBtn = (k, on) => `<button class="mode" data-act="setMode" data-v="${k}" aria-pressed="${on}"><span class="mi">${icon(MODES[k].icon)}</span><b>${MODES[k].name}</b><span>${MODES[k].sub}</span><span class="chk">${on ? '✓ 선택됨' : ''}</span></button>`;

function viewStart() {
  const tile = (k) => `<button class="mt" data-act="setMode" data-v="${k}"><span class="mi">${icon(MODES[k].icon)}</span><b>${MODES[k].name}</b><small>${MODES[k].en}</small></button>`;
  return `<div class="screen">${topbar()}<div class="scroll start2">
  <div class="ad"><small>SEASON SPECIAL</small><h2>새로운 계절, 새로운 즐거움</h2><p>시즌 신메뉴 &amp; 콜라보레이션</p><div class="adimg"><b>AD IMAGE</b><span>신메뉴 및 콜라보 광고 이미지 (자리 표시)</span></div></div>
  <div class="ask2"><h1>어디에서 드시나요?</h1><div class="mts">${tile('dine')}${tile('take')}</div>${vbar('start')}
  <div class="utils"><button data-act="dlg" data-v="lang"><b>언어 선택</b><small>Language</small></button><button data-act="dlg" data-v="access"><b>접근성 설정</b><small>Accessibility</small></button><button data-act="precheck"><b>쿠폰·상품권</b><small>사용 가능 여부 확인</small></button></div></div></div>
  <div class="disc">메가MGC커피의 공식 프로젝트가 아닌 비공식 UX/UI 개선 프로토타입이에요. 메뉴·가격은 테스트 데이터예요.</div></div>`;
}

const orderBar = () => {
  const n = cartCount(), L = S.cart.slice(0, 2).map((it) => `<li>${it.temp} ${esc(menu(it.menuId).name)} × ${it.qty}</li>`).join('') + (S.cart.length > 2 ? `<li>외 ${S.cart.length - 2}개</li>` : '');
  return `<div class="obar"><div class="orow"><span class="oclock">${ico('clock')}미사용 시 종료까지 2분</span><button class="btn sec" data-act="sessKeep">시간 연장</button></div>
  <div class="osum"><b>주문내역 (${n})</b>${n ? `<ul>${L}</ul>` : ''}<div class="ototal"><span>총 결제 금액</span><b>${won(cartTotal())}</b></div></div>
  <div class="oacts">${n ? '<button class="btn sec" data-act="askCancel">주문 취소</button>' : ''}<button class="btn pri" data-act="goCart" ${n ? '' : 'disabled'}>주문 확인</button></div></div>`;
};
const card = (m) => { const P = PRIMS.find((x) => x.id === S.prim); return `<button class="c2" data-act="open" data-id="${m.id}"><em class="bdg">${P?.badge && m.featured ? P.badge : ''}</em><div class="thumb">${pic(m)}</div><b>${esc(m.name)}</b><span class="tm">${m.temperature.join(' · ')}</span><span class="price">${won(m.price)}</span><span class="more">상세 정보 +</span></button>`; };
function viewMenu() {
  const list = visibleMenus(), P = PRIMS.find((x) => x.id === S.prim);
  const empty = `<div class="state">${P?.empty ? esc(P.empty) : '조건에 맞는 메뉴가 없어요'}<p>${P?.empty ? '다른 분류를 눌러 메뉴를 볼 수 있어요.' : '선택한 조건을 해제하면 다시 볼 수 있어요.'}</p>${S.filters.length || S.vf ? '<button class="btn sec" data-act="clearFilters">선택한 조건 모두 해제</button>' : ''}</div>`;
  const v = S.voice;
  return `<div class="screen">${topbar(homeBtn)}<div class="hrow2"><button class="modechip" data-act="modeDlg">${MODES[S.mode].tag}<small>바꾸기</small></button>${v.on ? '' : `<button class="vtrig" data-act="vStart"><span class="vi">${vicon('mic')}</span>음성으로 주문하기</button>`}</div>${vbar('menu')}
  <div class="scroll" data-keep>
   <h1 class="mh">어떤 메뉴를 드시겠어요?</h1>
   <div class="prims" role="tablist">${PRIMS.map((x) => `<button class="pm" aria-pressed="${S.prim === x.id}" data-act="prim" data-v="${x.id}">${S.prim === x.id ? '✓ ' : ''}${x.name}</button>`).join('')}</div>
   <div class="subs">${(P?.subs || []).map(([id, l]) => `<button class="sp" aria-pressed="${S.sub === id}" data-act="sub" data-v="${id}">${l}</button>`).join('')}<button class="sp taste" aria-expanded="${S.tasteOpen}" data-act="taste">취향으로 좁히기 ${S.tasteOpen ? '▲' : '▼'}</button></div>
   ${S.tasteOpen ? `<div class="chips" style="padding:0 0 16px">${FILTERS.map(([t, l]) => `<button class="chip" aria-pressed="${S.filters.includes(t)}" data-act="filter" data-v="${t}">${l}</button>`).join('')}</div>` : ''}
   <div class="count2"><span>${S.vf ? esc(S.vf.label) : P ? P.name : '전체'}${S.filters.length ? ' · 취향 ' + S.filters.length + '개' : ''} · 메뉴 ${list.length}개</span>${S.filters.length || S.vf ? '<button class="btn ghost" data-act="clearFilters">전체 메뉴 보기</button>' : ''}</div>
   ${list.length ? `<div class="grid3">${list.map(card).join('')}</div>` : empty}
   ${v.on ? '' : `<div class="micbox"><p>원하는 메뉴를 찾기 어려우신가요?</p><button class="btn sec" data-act="vStart"><span class="vi">${vicon('mic')}</span>음성으로 메뉴 찾기</button></div>`}
  </div>${orderBar()}</div>`;
}

function viewDetail() {
  const m = menu(S.detail), d = S.dtl;
  const it = { menuId: m.id, temp: d.temp || m.temperature[0], opts: d.opts, qty: d.qty };
  const hasOpt = Object.keys(d.opts).length > 0;
  const ch = (act, id, label, sub, on, off) => `<button class="choice" data-act="${act}" data-v="${id}" aria-pressed="${on}" ${off ? 'disabled' : ''}><span class="nm">${label}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const groups = m.options.map((g) => {
    const off = g.onlyTemp && d.temp !== g.onlyTemp;
    return `<div class="group"><h4>${g.label}<span class="term">${g.term}</span><span class="badge opt">선택 사항</span></h4><p class="hlp">${off ? '차갑게(ICE)를 고르면 선택할 수 있어요. ' : ''}${g.help}</p><div class="choices">${g.choices.map((c) => ch('opt', g.id + ':' + c.id, c.label, c.price ? `+${won(c.price)}` : '', !off && (d.opts[g.id] || '0') === c.id, off)).join('')}</div></div>`;
  }).join('');
  const label = d.editIdx != null ? '변경 내용 저장' : hasOpt ? '선택한 옵션으로 장바구니에 담기' : '추가 옵션 없이 장바구니에 담기';
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="${esc(m.name)} 옵션"><div class="sheet-h"><button class="back" data-act="closeDetail">← 메뉴로</button>${helpBtn}</div>${vbar()}
  <div class="sheet-body" data-keep>
   <div class="hero"><div class="thumb">${pic(m)}</div><div><h2>${esc(m.name)}</h2><div class="price">${won(m.price)}</div><p>${esc(m.description)}</p><div class="tags">${features(m).map((t) => `<span>${t}</span>`).join('')}</div></div></div>
   <details><summary>영양·알레르기·출처 보기</summary><p>영양정보: 공식 정보가 확인되지 않았어요.</p><p>알레르기: 공식 정보가 확인되지 않았어요. 알레르기가 있다면 직원에게 확인해 주세요.</p><p>출처: ${esc(m.source)}</p></details>
   <div class="group"><h4>온도<span class="badge">꼭 골라요</span></h4><p class="hlp">${m.temperature.length > 1 ? '따뜻하게 또는 차갑게 중 하나를 골라 주세요.' : `이 메뉴는 ${TEMP[m.temperature[0]]}만 주문할 수 있어요.`}</p><div class="choices">${['HOT', 'ICE'].map((t) => ch('temp', t, TEMP[t], '', (d.temp || (m.temperature.length === 1 ? m.temperature[0] : '')) === t, !m.temperature.includes(t))).join('')}</div>${d.tried && !d.temp ? '<div class="err">⚠ 온도를 아직 고르지 않았어요. 따뜻하게 또는 차갑게를 눌러 주세요.</div>' : ''}</div>
   ${m.options.length ? '<div class="note2">아래 옵션은 선택 사항이에요. 고르지 않아도 그대로 주문할 수 있어요.</div>' : ''}${groups}
   <div class="group qty"><h4>수량</h4><div class="stepper"><button data-act="dq" data-v="-1" aria-label="수량 줄이기" ${d.qty <= 1 ? 'disabled' : ''}>−</button><output>${d.qty}</output><button data-act="dq" data-v="1" aria-label="수량 늘리기" ${d.qty >= 20 ? 'disabled' : ''}>＋</button></div></div>
  </div>
  <div class="foot col"><div class="row2"><button class="btn sec" data-act="closeDetail" style="flex:none">${d.editIdx != null ? '수정 취소' : '옵션 선택 취소'}</button><button class="btn pri" data-act="addCart"><span>${label}</span><small>${won(unit(it) * d.qty)}</small></button></div></div></div></div>`;
}

function viewCart() {
  if (!S.cart.length) return `<div class="screen">${topbar(backB('toMenu', '← 메뉴로'))}${crumbs(1)}${vbar()}<div class="empty">장바구니가 비어 있어요<p>메뉴를 골라 장바구니에 담아 보세요.</p><button class="btn pri" data-act="toMenu">메뉴 보러 가기</button></div></div>`;
  return `<div class="screen">${topbar(backB('toMenu', '← 메뉴로'))}${crumbs(1)}${modeBar()}${vbar()}
  <div class="scroll" data-keep><div class="h2 split"><span>장바구니 <small>${cartCount()}개</small></span><button class="btn dng" data-act="askCancel">전체 주문 취소</button></div><div class="list">${S.cart.map((it, i) => { const m = menu(it.menuId); return `<div class="item"><div class="thumb">${pic(m)}</div><div><h4>${esc(m.name)}</h4><div class="opts">${optText(it)}</div><div class="opts">개당 ${won(unit(it))}</div></div><div class="lp">${won(unit(it) * it.qty)}</div>
   <div class="acts"><div class="stepper sm"><button data-act="cq" data-i="${i}" data-v="-1" aria-label="수량 줄이기" ${it.qty <= 1 ? 'disabled' : ''}>−</button><output>${it.qty}</output><button data-act="cq" data-i="${i}" data-v="1" aria-label="수량 늘리기" ${it.qty >= 20 ? 'disabled' : ''}>＋</button></div><span style="display:flex;gap:12px"><button class="btn sec" data-act="edit" data-i="${i}">옵션 수정</button><button class="btn sec" data-act="del" data-i="${i}">메뉴 삭제</button></span></div></div>`; }).join('')}</div></div>
  <div class="total"><span>최종 주문 금액</span><b>${won(cartTotal())}</b></div>
  <div class="foot"><button class="btn sec" data-act="toMenu">메뉴 더 담기</button><button class="btn pri" data-act="toConfirm">주문 내역 확인</button></div></div>`;
}

function viewConfirm() {
  const v = S.usedVoice;
  const rows = S.cart.map((it) => `<div><span>${esc(menu(it.menuId).name)} × ${it.qty}<small>${optText(it)}</small></span><span>${won(unit(it) * it.qty)}</span></div>`).join('');
  return `<div class="screen">${topbar(backB('goCart', '← 장바구니로'))}${crumbs(1)}${modeBar()}
  <div class="scroll">${v ? `<div class="hand"><span class="okc">${ico('check')}</span><h1>메뉴를 모두 담았어요!</h1><p>지금까지 주문한 메뉴를 확인해 주세요.</p></div>` : `<div class="h2 split"><span>주문 내역을 확인해 주세요</span><button class="btn sec" data-act="goCart">주문 수정</button></div>`}
   <div class="sum-list">${rows}</div>
   ${v ? `<div class="vnote" role="status"><span class="vi">${ico('hand')}</span><span><b>이제 화면을 눌러 진행해 주세요.</b>할인, 적립 및 결제는 직접 선택해 주세요.</span></div>` : ''}</div>
  <div class="total"><span>최종 결제 금액</span><b>${won(cartTotal())}</b></div>
  <div class="foot col2"><button class="btn pri block" data-act="toPay">결제 방법 고르기 · ${won(cartTotal())}</button><button class="btn sec block" data-act="toMenu">${v ? `<span class="vi">${vicon('mic')}</span>` : ''}메뉴 더 담기</button></div></div>`;
}

// ---------- coupon / payment views ----------
const post = (u, b) => fetch(u, { method: 'POST', body: JSON.stringify(b) }).then((r) => r.json());
const payFinal = () => { const c = S.pay.cpn; const d = c?.status === 'ok' ? c.discount : 0; return { total: cartTotal(), disc: d, final: Math.max(0, cartTotal() - d) }; };
const cform = (ctx) => { const v = S[ctx].code; return `<form class="cform" data-form="${ctx}"><input id="${ctx}code" value="${esc(v)}" placeholder="쿠폰 번호 입력" aria-label="쿠폰 번호" autocomplete="off"><button class="btn pri" type="submit">${ctx === 'pre' ? '확인하기' : '적용하기'}</button></form><p class="hint">테스트용 번호: WELCOME10 · DRINK1000 · FREEAMERICANO · GIFT5000 · APP-ONLY · OLD2024</p>`; };
const resCard = (r, ctx) => {
  if (!r) return '';
  const staff = '<button class="btn sec" data-act="staff">직원 도움 요청</button>';
  if (r.status === 'busy') return '<div class="res"><div class="spin sm"></div>쿠폰을 확인하고 있어요…</div>';
  if (r.status === 'ok') return `<div class="res ok" role="status"><b>✓ ${esc(r.coupon.name)}${ctx === 'pay' ? ' 적용 완료' : ' · 키오스크에서 사용할 수 있어요'}</b><p>${ctx === 'pay' ? `할인 ${won(r.discount)}이 반영됐어요. 아래 최종 결제 금액을 확인해 주세요.` : '주문 후 결제 화면에서 쿠폰 번호를 입력하면 적용돼요. 최소 주문 금액 등 조건은 담은 메뉴에 따라 달라질 수 있어요.'}</p>${ctx === 'pay' ? '<div class="racts"><button class="btn sec" data-act="cpnClear">쿠폰 제거</button></div>' : ''}</div>`;
  if (r.status === 'unusable') return `<div class="res no" role="alert"><b>✕ ${esc(r.coupon.name)} · 지금은 사용할 수 없어요</b><p><strong>이유</strong> ${esc(r.reason)}</p><p><strong>이렇게 해 보세요</strong> ${esc(r.alternative)}</p>${ctx === 'pay' ? `<div class="racts"><button class="btn sec" data-act="cpnRetry">다른 쿠폰 입력</button><button class="btn sec" data-act="cpnClear">쿠폰 없이 결제하기</button>${r.hint === 'addMore' ? '<button class="btn sec" data-act="toMenu">메뉴 더 담기</button>' : ''}<button class="btn sec" data-act="goCart">주문 수정</button></div>` : ''}</div>`;
  if (r.status === 'unknown') return `<div class="res no" role="alert"><b>? 확인할 수 없는 쿠폰이에요</b><p><strong>이유</strong> 번호가 틀렸거나, 키오스크에서 확인할 수 없는 쿠폰이에요.</p><p><strong>이렇게 해 보세요</strong> 번호를 다시 입력해 보세요. 그래도 안 되면 직원 확인이 필요해요.</p><div class="racts">${ctx === 'pay' ? '<button class="btn sec" data-act="cpnRetry">다른 쿠폰 입력</button><button class="btn sec" data-act="cpnClear">쿠폰 없이 결제하기</button>' : ''}${staff}</div></div>`;
  return `<div class="res no" role="alert"><b>✕ 쿠폰을 확인하지 못했어요</b><p><strong>이유</strong> 연결이 불안정해요.</p><p><strong>이렇게 해 보세요</strong> 잠시 뒤 다시 시도하거나, 쿠폰 없이 결제해 주세요. 담은 메뉴는 그대로예요.</p><div class="racts">${ctx === 'pay' ? '<button class="btn sec" data-act="cpnClear">쿠폰 없이 결제하기</button>' : ''}${staff}</div></div>`;
};
const mchip = (m) => (m.supported ? '<span class="chip2 ok">✓ 사용 가능</span>' : '<span class="chip2 no">✕ 사용 불가</span>');

function viewPre() {
  return `<div class="screen">${hdr(`<button class="back" data-act="toStart">← 처음으로</button>`, helpBtn)}
  <div class="scroll" data-keep><div class="h2" style="padding-bottom:8px">쿠폰·결제 수단 미리 확인</div><p class="lead2">주문 전에 확인하고 싶을 때만 쓰세요. 건너뛰고 바로 주문해도 돼요.</p>
  <div class="sect"><h3>쿠폰 번호로 확인하기</h3>${cform('pre')}${resCard(S.pre.res, 'pre')}</div>
  <div class="sect"><h3>쿠폰 종류와 쓰는 방법</h3><div class="faq">${S.types.map((t, i) => `<div style="margin-top:12px"><button class="q" data-act="typeOpen" data-i="${i}" aria-expanded="${S.typeOpen === i}"><span>${esc(t.name)} ${t.kioskUsable ? '<span class="chip2 ok">✓ 사용 가능</span>' : '<span class="chip2 no">✕ 키오스크 사용 불가</span>'}</span><span>${S.typeOpen === i ? '▲' : '▼'}</span></button>${S.typeOpen === i ? `<div class="a"><p>${esc(t.purpose)}</p>${t.kioskUsable ? `<h5>사용 조건</h5><ul>${t.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><h5>사용 방법</h5><ol>${t.howTo.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>` : `<h5>사용할 수 없는 이유</h5><p>${esc(t.reason)}</p><h5>대신 이렇게 해 보세요</h5><p>${esc(t.alternative)}</p>`}</div>` : ''}</div>`).join('')}</div></div>
  <div class="sect"><h3>쓸 수 있는 결제 수단</h3>${S.groups.map((g) => `<h4 class="gt">${g}</h4>${S.methods.filter((m) => m.group === g).map((m) => `<div class="mrow"><div><b>${esc(m.name)}</b>${m.supported ? '' : `<small>${esc(m.reason)} ${esc(m.alternative)}</small>`}</div>${mchip(m)}</div>`).join('')}`).join('')}</div><div style="height:40px"></div></div>
  <div class="foot"><button class="btn pri block" data-act="toStart">주문 시작하기</button></div></div>`;
}

function viewPay() {
  const p = S.pay, { total, disc, final } = payFinal();
  if (p.phase === 'processing') return `<div class="screen done plain"><div class="spin"></div><h1 style="font-size:52px">결제하고 있어요</h1><p>화면을 그대로 두고 잠시만 기다려 주세요.<br>같은 결제가 두 번 되지는 않아요.</p></div>`;
  if (p.phase === 'pending') return `<div class="screen done plain"><div class="spin"></div><h1 style="font-size:52px">결제 승인을 확인하고 있어요</h1><p>승인이 확인되면 자동으로 넘어가요.<br>이미 결제가 요청됐어서, 다시 결제하지 않아도 돼요. 중복 결제는 되지 않아요.</p><div class="vstack"><button class="btn sec block" data-act="checkTx">승인 상태 다시 확인하기</button><button class="btn sec block" data-act="staff">직원 도움 요청</button></div></div>`;
  if (p.phase === 'failed') return `<div class="screen">${hdr(logo, helpBtn)}<div class="scroll"><div class="h2">결제가 완료되지 않았어요</div><div class="res no" style="margin:0 48px" role="alert"><b>✕ 아직 결제되지 않았어요</b><p><strong>이유</strong> ${esc(p.fail.reason)}</p><p><strong>이렇게 해 보세요</strong> ${esc(p.fail.solution)}</p></div>
  <div class="note">담은 메뉴 ${cartCount()}개${p.cpn?.status === 'ok' ? '와 쿠폰' : ''}은 그대로 있어요. 처음부터 다시 하지 않아도 돼요.</div>
  <div class="vstack" style="padding:0 48px"><button class="btn pri block" data-act="retryPay">같은 방법으로 다시 시도</button><button class="btn sec block" data-act="otherMethod">다른 결제 수단 고르기</button><button class="btn sec block" data-act="goCart">주문 수정하기</button><button class="btn sec block" data-act="staff">직원 도움 요청</button></div></div></div>`;
  const sel = S.methods.find((m) => m.id === p.method);
  const label = final === 0 ? '쿠폰으로 주문 완료하기' : sel ? `${won(final)} 결제하기` : '결제 수단을 골라 주세요';
  const pt = (m, cls = '') => `<button class="pt ${cls}" data-act="selMethod" data-v="${m.id}" aria-pressed="${p.method === m.id}">${p.method === m.id ? '<i class="ck">✓ 선택됨</i>' : ''}${m.mark ? `<b class="mk" style="color:${m.color}">${esc(m.mark)}</b>` : `<b>${esc(m.name)}</b>`}<small>${esc(m.sub)}</small></button>`;
  const by = (g) => S.methods.filter((m) => m.group === g);
  const bn = S.benefits || [];
  return `<div class="screen">${topbar(backB('toConfirm', '← 주문 내역'))}${crumbs(2)}
  <div class="scroll" data-keep>
   <div class="amt"><div><span>결제할 금액</span><b>${won(final)}</b></div><small>주문 금액 ${won(total)} · 적용된 할인 ${won(disc)}</small></div>
   <div class="sec2"><h2>받을 수 있는 혜택이 있나요?</h2><span class="optl">선택 사항</span></div><p class="sub2">이용하는 멤버십이나 쿠폰이 있다면 선택해 주세요.</p>
   <div class="box"><h3>통신사·제휴 멤버십</h3><div class="bgrid">${bn.map((b) => `<button class="pt" data-act="benefit" data-v="${b.id}" aria-pressed="${p.benefit === b.id}">${p.benefit === b.id ? '<i class="ck">✓ 선택됨</i>' : ''}<b class="mk" style="color:${b.color}">${esc(b.mark)}</b><small>${esc(b.name)}</small></button>`).join('')}</div>
    ${p.benefit ? '<p class="mock">연습용 시안이라 멤버십 정보는 받지 않고 할인도 적용되지 않아요. 결제는 그대로 진행돼요.</p>' : ''}
    <button class="rowbtn" data-act="cpnToggle" aria-expanded="${p.cpnOpen || p.cpn?.status === 'ok'}"><span class="m">M</span><span>메가커피 앱 쿠폰</span><span class="chev">${ico('chev')}</span></button>
    ${p.cpnOpen || p.cpn?.status === 'ok' ? `<div class="cpnbox">${p.cpn?.status === 'ok' ? resCard(p.cpn, 'pay') : `${cform('pay')}${resCard(p.cpn, 'pay')}`}</div>` : ''}</div>
   <p class="sub2 c">해당되는 혜택이 없다면 아래에서 바로 결제하세요.</p><hr class="hr2">
   <div class="sec2"><h2>어떻게 결제하시겠어요?</h2></div>
   ${final === 0 ? '<div class="note">쿠폰으로 전액 결제돼요. 따로 결제 수단을 고르지 않아도 돼요.</div>' : `
   <h3 class="gl">카드 결제</h3>${by('카드 결제').map((m) => `<button class="cardpay" data-act="selMethod" data-v="${m.id}" aria-pressed="${p.method === m.id}"><span class="ci">${L('credit-card')}</span><span><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span>${p.method === m.id ? '<i class="ck2">✓ 선택됨</i>' : `<span class="chev">${ico('chev')}</span>`}</button>`).join('')}
   <div class="box"><h3 class="gl">휴대폰으로 결제</h3><div class="mgrid4">${by('휴대폰으로 결제').map((m) => pt(m, m.id === 'appcard' ? 'wide' : '')).join('')}</div></div>
   <div class="box"><h3 class="gl">상품권·선불카드</h3><div class="bgrid">${by('상품권·선불카드').map((m) => pt(m)).join('')}</div></div>`}
   <button class="rowbtn stamp" data-act="stamp" aria-pressed="${p.stamp}"><span class="m">M</span><span><b>메가커피 스탬프 적립하기</b><small>${p.stamp ? '✓ 적립 선택됨 · 연습용이라 번호를 받지 않아요' : '휴대폰 번호로 적립 · 선택 사항'}</small></span><span class="chev">${ico('chev')}</span></button>
   ${sel ? `<div class="guide"><b>${esc(sel.name)}으로 이렇게 결제해요</b><ol>${sel.howTo.map((h) => `<li>${esc(h)}</li>`).join('')}</ol><p>연습용이라 실제 결제는 되지 않고, 카드 정보도 받지 않아요.</p></div>` : ''}
   <div style="height:24px"></div></div>
  <div class="foot col2"><button class="btn pri block" data-act="payNow" ${final === 0 || sel ? '' : 'disabled'}>${label}</button></div>
  <div class="ubar"><button data-act="dlg" data-v="lang"><b>언어 선택</b><small>Language</small></button><button data-act="dlg" data-v="access"><b>접근성 설정</b><small>Accessibility</small></button><button data-act="help"><b>결제 도움말</b><small>Help</small></button></div></div>`;
}

function viewDone() {
  const o = S.order;
  return `<div class="screen done"><h1>주문이 접수되었어요.</h1><div class="no" aria-label="주문번호 ${o.no}">${o.no}</div>
  <p>${PICKUP_TEXT}</p><p class="mut">${MODES[o.mode].name} 주문이에요.</p>
  <div class="sum-list">${o.items.map((l) => `<div><span>${esc(l.name)} × ${l.qty}<small>${l.opt}</small></span><span>${won(l.price)}</span></div>`).join('')}${o.discount ? `<div><span>쿠폰 할인<small>${esc(o.coupon)}</small></span><span>− ${won(o.discount)}</span></div>` : ''}<div><span>결제 금액<small>${esc(o.method)}</small></span><span>${won(o.final)}</span></div></div>
  <button class="btn" data-act="reset" style="background:var(--ink);color:#fff;min-height:120px;font-size:44px;width:100%">처음 화면으로</button><p class="mut" style="font-size:30px">잠시 뒤 자동으로 처음 화면으로 돌아가요.</p></div>`;
}

function viewHelp() {
  const h = helpFor();
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="주문 도움" style="z-index:20"><div class="sheet-h"><span class="title">${esc(h.title)}</span><button class="x" data-act="closeHelp">닫고 주문 계속하기</button></div>
  <div class="sheet-body" data-keep><p class="hlp" style="font-size:30px">주문 내용은 그대로 남아 있어요. 궁금한 걸 눌러 보세요.</p>
   <div class="faq">${h.items.map(([q, a], i) => `<div style="margin-top:14px"><button class="q" data-act="faq" data-i="${i}" aria-expanded="${S.helpOpen === i}">${esc(q)}<span>${S.helpOpen === i ? '▲' : '▼'}</span></button>${S.helpOpen === i ? `<div class="a">${esc(a)}</div>` : ''}</div>`).join('')}</div></div>
  <div class="sheet-f"><div style="font-size:28px;color:var(--mute);font-weight:600">알레르기나 결제 문제는 직원 확인이 필요해요.</div><div class="row"><button class="btn sec" data-act="staff">직원 도움 요청</button><button class="btn pri" data-act="closeHelp">주문 계속하기</button></div></div></div></div>`;
}

const dialogMode = () => `<div class="dim center" style="z-index:25"><div class="dialog" role="dialog" aria-label="주문 방식 바꾸기"><h2>어디에서 드시나요?</h2><div class="modes in">${modeBtn('dine', S.mode === 'dine')}${modeBtn('take', S.mode === 'take')}</div><button class="back" data-act="closeModeDlg" style="align-self:center">← 그대로 두고 돌아가기</button></div></div>`;
const dialogCancel = () => `<div class="dim center" style="z-index:25"><div class="dialog" role="alertdialog"><h2>담은 메뉴를 모두 지울까요?</h2><p style="font-size:34px">담은 메뉴 ${cartCount()}개가 모두 지워지고 처음 화면으로 돌아가요.</p><div class="row"><button class="btn sec" data-act="keep">돌아가기</button><button class="btn dng" data-act="reset">전체 주문 취소</button></div></div></div>`;

function render() {
  const keep = [...document.querySelectorAll('[data-keep]')].map((e) => e.scrollTop);
  const v = { start: viewStart, pre: viewPre, menu: viewMenu, cart: viewCart, confirm: viewConfirm, pay: viewPay, done: viewDone }[S.screen]();
  $('#stage').innerHTML = v + (S.detail ? viewDetail() : '') + (S.help ? viewHelp() : '') + (S.modeDialog ? dialogMode() : '') + (S.confirmCancel ? dialogCancel() : '') + (S.dlg ? dialogInfo() : '') + (S.sess.warn ? dialogSess() : '') +
    (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : '') + (S.apiDown ? '<div class="dbg" style="left:auto;right:8px;color:#fc0">기본 메뉴 데이터 사용 중</div>' : '') +
    (dbg.on ? `<div class="dbg" id="dbg"></div>` : '');
  window.lucide?.createIcons();
  document.querySelectorAll('[data-keep]').forEach((e, i) => { if (keep[i]) e.scrollTop = keep[i]; });
}

// ---------- actions ----------
const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2200); };
const go = (s) => { if (['confirm', 'pay', 'pre', 'done'].includes(s)) vOff(); S.screen = s; S.detail = null; S.help = false; render(); };
const closeHelp = () => { S.help = false; S.helpOpen = -1; render(); };
const openDetail = (id, edit) => {
  const m = menu(id);
  S.detail = id; S.help = false;
  S.dtl = edit ? { temp: edit.temp, opts: { ...edit.opts }, qty: edit.qty, editIdx: edit.idx } : { temp: m.temperature.length === 1 ? m.temperature[0] : '', opts: {}, qty: 1, editIdx: null };
  render();
};
const freshPay = () => ({ method: null, code: '', cpn: null, busy: false, phase: 'choose', fail: null, key: '', attempt: 0, tx: null, benefit: null, cpnOpen: false, stamp: false });
const reset = () => { clearTimeout(reset.t); clearInterval(S.pay.poll); vOff(); Object.assign(S, { usedVoice: false, vf: null, sess: { last: Date.now(), warn: 0, freeze: S.sess.freeze }, pay: freshPay(), pre: { code: '', res: null, busy: false }, typeOpen: -1, screen: 'start', cart: [], detail: null, help: false, prim: 'rec', sub: 'all', tasteOpen: false, dlg: null, filters: [], mode: null, modeDialog: false, confirmCancel: false, order: null }); dbg.t0 = 0; render(); };
const merge = () => { // merge identical lines after an edit
  const out = [];
  for (const it of S.cart) { const k = JSON.stringify([it.menuId, it.temp, it.opts]); const f = out.find((o) => JSON.stringify([o.menuId, o.temp, o.opts]) === k); f ? (f.qty = Math.min(20, f.qty + it.qty)) : out.push(it); }
  S.cart = out;
};

// ---------- coupon + payment logic ----------
const cartItems = () => S.cart.map(({ menuId, qty, opts }) => ({ menuId, qty, opts }));
async function applyCpn(code) {
  if (!code.trim()) return;
  S.pay.cpn = { status: 'busy' }; render();
  try { S.pay.cpn = await post('/api/coupons/apply', { code, items: cartItems() }); if (S.pay.cpn.status === 'ok') S.pay.code = ''; } catch { S.pay.cpn = { status: 'error' }; }
  render();
}
async function checkPre(code) {
  if (!code.trim()) return;
  S.pre.res = { status: 'busy' }; render();
  try { S.pre.res = await post('/api/coupons/apply', { code }); } catch { S.pre.res = { status: 'error' }; }
  render();
}
function complete(txId) {
  clearInterval(S.pay.poll);
  const { disc, final } = payFinal(), p = S.pay;
  S.order = { no: 'A-' + String(100 + Math.floor(Math.random() * 900)), mode: S.mode, discount: disc, final, coupon: p.cpn?.status === 'ok' ? p.cpn.coupon.name : '', method: final === 0 ? '쿠폰으로 전액 결제' : S.methods.find((m) => m.id === p.method).name, items: S.cart.map((it) => ({ name: menu(it.menuId).name, qty: it.qty, opt: optText(it), price: unit(it) * it.qty })) };
  S.cart = []; S.pay = freshPay(); // previous customer's order cleared after approval
  go('done');
  reset.t = setTimeout(reset, RETURN_MS);
}
async function payNow() {
  const p = S.pay, { final } = payFinal();
  if (p.busy) return; // double-tap guard
  if (final === 0) return complete();
  p.busy = true; p.phase = 'processing'; p.attempt++; render();
  await new Promise((r) => setTimeout(r, 900));
  try {
    const r = await post('/api/pay', { method: p.method, amount: final, key: p.key, attempt: p.attempt }); // same key => server never charges twice
    if (r.status === 'approved') { p.busy = false; return complete(r.txId); }
    if (r.status === 'pending') { p.busy = false; p.phase = 'pending'; p.tx = r.txId; clearInterval(p.poll); p.poll = setInterval(checkTx, 1500); return render(); }
    p.phase = 'failed'; p.fail = r;
  } catch { p.phase = 'failed'; p.fail = { reason: '연결이 불안정해서 결제 결과를 확인하지 못했어요.', solution: '같은 방법으로 다시 시도해도 중복 결제는 되지 않아요. 담은 메뉴는 그대로예요.' }; }
  p.busy = false; render();
}
async function checkTx() {
  const p = S.pay;
  try { const r = await fetch('/api/pay/' + p.tx).then((x) => x.json()); if (r.status === 'approved') complete(r.txId); else if (!document.hidden) toast('아직 승인 확인 중이에요. 조금만 기다려 주세요.'); } catch { toast('연결이 불안정해요. 잠시 뒤 다시 확인해 주세요.'); }
}

// ---------- voice order (mock; PRD v3 Voice-Driven UI) ----------
// No real speech recognition: sample utterances stand in for Speech-to-Text. Intents are whitelisted and validated against menu data;
// payment/coupon/stamp utterances are never executed (customer pays by touch).
const VB = {
  idle: ['mic', '음성으로 주문하기', '메뉴 탐색 및 상품 구성'],
  listening: ['wave', '듣고 있어요', '사용자 음성 입력 중'],
  processing: ['spin', '말씀하신 내용을 확인하고 있어요', '음성 인식 결과 처리'],
  confirm: ['check', '이 메뉴가 맞나요?', '메뉴 및 옵션 확인'],
  error: ['micoff', '잘 듣지 못했어요', '인식 실패 및 재시도'],
};
const vicon = (k) => L({ mic: 'mic', wave: 'audio-lines', spin: 'loader-circle', check: 'circle-check', micoff: 'mic-off' }[k]);
const vUtts = () => {
  const noise = '(잘 안 들리는 소리)';
  if (S.screen === 'start') return ['매장에서 먹을게요', '포장할게요', noise];
  if (S.voice.ask || S.detail) return ['차갑게 주세요', '따뜻하게 주세요', ...(S.detail ? ['두 잔 주세요', '이걸로 담아줘'] : []), noise];
  return ['메뉴 추천해 줘', '디카페인 보여줘', '달달한 음료 추천해 줘', '3천 원 이하 커피 보여줘', '아이스 아메리카노 두 잔 주세요', '카페라떼 주세요', '결제해 줘', '이제 됐어', noise];
};
function vbar(ctx) {
  if (['confirm', 'pay', 'pre', 'done'].includes(S.screen)) return ''; // Hidden: order review, payment, completion
  const v = S.voice;
  if (!v.on && ctx === 'menu') return ''; // menu: compact trigger lives in the header row
  if (!v.on && ctx === 'start') return `<button class="vstart" data-act="vStart"><span class="vi">${vicon('mic')}</span><span><b>음성으로 주문하기</b><small>원하는 메뉴를 말해 주세요.</small></span></button>`;
  const key = !v.on ? 'idle' : ({ listening: 'listening', processing: 'processing', confirming: 'confirm', error: 'error' }[v.st] || 'idle');
  const [ic, label, sub] = VB[key];
  const bar = key === 'idle'
    ? `<button class="vb vb-idle" data-act="vStart"><span class="vi">${vicon(ic)}</span>${label}</button>`
    : `<div class="vb vb-${key}" role="status" aria-live="polite"><span class="vi">${vicon(ic)}</span>${label}</div>`;
  let panel = '';
  if (v.on) {
    const m = v.pend && menu(v.pend.menuId);
    const body = v.st === 'listening' ? `<p class="vhint">연습용 모의 입력이에요. 말한 것처럼 아래 문장을 눌러 보세요.</p><div class="vchips">${vUtts().map((u) => `<button class="vchip" data-act="vUtter" data-v="${esc(u)}">${esc(u)}</button>`).join('')}</div>`
      : v.st === 'confirming' && m ? `<div class="vcard"><b>${esc(m.name)}</b><span>${TEMP[v.pend.temp]} · ${v.pend.qty}잔</span><strong>${won((m.price + (v.pend.temp === 'HOT' ? m.hotExtra || 0 : 0)) * v.pend.qty)}</strong></div><div class="vacts"><button class="btn pri" data-act="vAdd">장바구니에 담기</button><button class="btn sec" data-act="vEdit">수정하기</button></div>`
      : v.ask ? `<div class="vacts">${menu(v.ask).temperature.map((t) => `<button class="btn sec" data-act="vTemp" data-v="${t}">${TEMP[t]}</button>`).join('')}</div>`
      : v.cands ? `<div class="vchips">${v.cands.map((id) => `<button class="vchip" data-act="vPick" data-v="${id}">${esc(menu(id).name)}</button>`).join('')}</div>` : '';
    const retry = v.st === 'error' || v.st === 'confirming' ? '<button class="btn sec" data-act="vStart">다시 말하기</button>' : '';
    panel = `<div class="vpanel">${v.heard ? `<p><small>말씀하신 내용</small>“${esc(v.heard)}”</p>` : ''}${v.say ? `<p><small>안내</small>${esc(v.say)}</p>` : ''}${v.next ? `<p><small>다음 행동</small>${esc(v.next)}</p>` : ''}${body}<div class="vacts">${retry}<button class="btn sec" data-act="vEnd">화면에서 선택하기</button></div></div>`;
  }
  return `<div class="vwrap">${bar}<div class="vsub">${VB[key][2]}</div>${panel}</div>`;
}
const vOff = () => { const v = S.voice; v.req++; Object.assign(v, { on: false, st: 'idle', heard: '', say: '', next: '', pend: null, ask: null, cands: null }); };
const vSet = (st, say, next) => { Object.assign(S.voice, { st, say, next, pend: null, ask: null, cands: null }); };
const NUMW = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5 };
const qtyOf = (t) => { const d = t.match(/(\d+)\s*(잔|개)/); if (d) return Math.min(20, +d[1]); const k = t.match(/(하나|한|두|둘|세|셋|네|넷|다섯)\s*(잔|개)/); return k ? NUMW[k[1]] : 0; };
const tempOf = (t) => (/아이스|차갑|차가운|시원/.test(t) ? 'ICE' : /따뜻|따듯|핫|뜨거/.test(t) ? 'HOT' : '');
function findMenus(t) {
  const exact = S.menus.filter((m) => t.includes(m.name));
  if (exact.length) return exact.sort((a, b) => b.name.length - a.name.length).slice(0, 1);
  const toks = t.split(/\s+/).filter((w) => w.length >= 2 && !/주세요|줘|보여|아이스|따뜻|차갑|차가운|잔|개|추천|메뉴/.test(w));
  return S.menus.filter((m) => toks.some((w) => m.name.includes(w)));
}
const vStartPend = (m, temp, qty) => {
  const v = S.voice, tmp = temp || (m.temperature.length === 1 ? m.temperature[0] : '');
  if (!tmp) { vSet('idle', '따뜻하게 드릴까요, 차갑게 드릴까요?', '말하거나 화면을 눌러 주세요.'); v.ask = m.id; v.pend = null; v.qty = qty || 1; return; }
  if (!m.temperature.includes(tmp)) { vSet('idle', `${m.name}은(는) ${TEMP[m.temperature[0]]}만 주문할 수 있어요.`, '다른 온도로 말하거나 화면에서 선택해 주세요.'); v.ask = m.id; v.qty = qty || 1; return; }
  vSet('confirming', '이렇게 담아드릴까요?', '맞으면 담고, 다르면 수정해 주세요.'); v.pend = { menuId: m.id, temp: tmp, qty: qty || v.qty || 1 }; v.qty = 0;
};
function vResolve(t) {
  const v = S.voice, tmp = tempOf(t), qty = qtyOf(t);
  if (!t) return vSet('error', '', '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.');
  if (/결제|계산|쿠폰|적립|카드/.test(t)) return vSet('idle', '결제, 쿠폰, 적립은 직접 선택해야 해요.', '메뉴를 다 담은 뒤 “이제 됐어”라고 말하거나 주문 확인을 눌러 주세요.');
  if (S.screen === 'start') {
    const k = /매장|먹고/.test(t) ? 'dine' : /포장|가져|테이크/.test(t) ? 'take' : '';
    if (!k) return vSet('idle', '매장에서 먹을지 포장할지 말해 주세요.', '말하거나 화면에서 눌러 주세요.');
    S.mode = k; dbg.t0 = Date.now(); go('menu');
    return vSet('idle', `${MODES[k].name}로 정했어요.`, '원하는 메뉴를 말하거나 화면에서 선택해 주세요.');
  }
  if (S.detail) { // current screen can resolve the request: stay here
    const d = S.dtl, m = menu(S.detail);
    if (/담아|이걸로|확인/.test(t)) { if (!d.temp) return vSet('idle', '먼저 따뜻하게 또는 차갑게를 골라 주세요.', '말하거나 화면을 눌러 주세요.'); A.addCart(); return vSet('idle', '장바구니에 담았어요.', '메뉴를 더 말하거나, 다 담았다면 “이제 됐어”라고 말해 주세요.'); }
    if (tmp || qty) {
      if (tmp && !m.temperature.includes(tmp)) return vSet('idle', `${m.name}은(는) ${TEMP[m.temperature[0]]}만 주문할 수 있어요.`, '화면에서 선택해 주세요.');
      if (tmp) A.temp({ v: tmp }); if (qty) d.qty = qty;
      return vSet('idle', `선택을 바꿨어요: ${[tmp && (tmp === 'ICE' ? '차갑게' : '따뜻하게'), qty && qty + '잔'].filter(Boolean).join(', ')}.`, '맞으면 “이걸로 담아줘”라고 말하거나 화면에서 담아 주세요.');
    }
    return vSet('error', '', '온도나 수량을 말하거나 화면에서 선택해 주세요.');
  }
  if (v.ask && tmp) return vStartPend(menu(v.ask), tmp, v.qty);
  if (/이제 됐|다 됐|그만|주문 확인|끝났/.test(t)) {
    if (!S.cart.length) return vSet('idle', '아직 담은 메뉴가 없어요.', '메뉴를 말하거나 화면에서 선택해 주세요.');
    go('confirm'); return;
  }
  if (/하나 더|더 주문|추가/.test(t)) { go('menu'); return vSet('idle', '메뉴를 더 담을 수 있어요.', '원하는 메뉴를 말하거나 화면에서 선택해 주세요.'); }
  if (S.screen === 'cart') go('menu');
  S.vf = null;
  const catOf = (x) => (/라떼/.test(x) ? ['drink', 'latte'] : /에이드|스무디/.test(x) ? ['drink', 'ade'] : /커피/.test(x) ? ['coffee', 'all'] : /티/.test(x) ? ['tea', 'all'] : null);
  if (/디카페인/.test(t) && !t.includes('디카페인 아메리카노')) { goPrim('decaf'); return vSet('idle', '디카페인 메뉴를 보여드릴게요.', '원하는 메뉴를 말하거나 눌러 주세요.'); }
  if (/새로 나온|신메뉴|신상/.test(t)) { goPrim('new'); } if (/새로 나온|신메뉴|신상/.test(t)) return vSet('idle', '신메뉴 표시가 있는 메뉴가 아직 없어요.', '다른 메뉴를 말하거나 화면에서 선택해 주세요.');
  if (/먹을 것|푸드|디저트|빵/.test(t)) { goPrim('food'); } if (/먹을 것|푸드|디저트|빵/.test(t)) return vSet('idle', '푸드 메뉴는 이 시안 데이터에 없어요.', '음료 메뉴를 말하거나 화면에서 선택해 주세요.');
  const mx = t.match(/(\d+)천\s*원\s*이하/) || t.match(/(\d{3,5})\s*원\s*이하/);
  const max = mx ? (/천/.test(mx[0]) ? +mx[1] * 1000 : +mx[1]) : 0;
  const taste = ['달콤한', '상큼한', '부드러운', '깔끔한'].find((k) => t.includes(k.slice(0, 2)) || (k === '달콤한' && /달달/.test(t)));
  const cat = catOf(t);
  if (max || taste || (/추천/.test(t) && !findMenus(t).length)) {
    if (max || taste) { goPrim(cat ? cat[0] : 'all', cat ? cat[1] : 'all'); if (taste) S.filters = [taste]; if (max) S.vf = { label: `${max.toLocaleString('ko-KR')}원 이하`, max }; } else goPrim('rec');
    const n = visibleMenus().length;
    return vSet('idle', !n ? '조건에 맞는 메뉴가 없어요.' : max ? '조건에 맞는 메뉴를 찾아봤어요.' : taste ? `${taste} 음료를 찾아봤어요.` : '추천 메뉴를 보여드릴게요.', !n ? '조건을 바꾸거나 “전체 메뉴 보기”를 눌러 주세요.' : '원하는 메뉴를 말하거나 화면에서 선택해 주세요.');
  }
  const ms = findMenus(t);
  if (ms.length === 1) return vStartPend(ms[0], tmp, qty);
  if (ms.length > 1) { vSet('idle', '어느 메뉴인가요?', '아래에서 골라 주세요.'); v.cands = ms.slice(0, 6).map((m) => m.id); v.qty = qty; return; }
  if (cat) { goPrim(cat[0], cat[1]); return vSet('idle', `${PRIMS.find((x) => x.id === cat[0]).name} 메뉴를 보여드릴게요.`, '원하는 메뉴를 말하거나 눌러 주세요.'); }
  return vSet('error', '', '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.');
}
function vUtter(text) {
  const v = S.voice;
  if (v.st !== 'listening') return; // ignore duplicate commands while processing
  const req = ++v.req; v.st = 'processing'; v.heard = text.startsWith('(') ? '' : text; v.say = ''; v.next = ''; render();
  setTimeout(() => { if (v.req !== req || !v.on) return; vResolve(v.heard); render(); }, 800); // stale responses are dropped (req token)
}
// ---------- session (PRD v3 FR-17) ----------
const sessOn = () => ['menu', 'cart', 'confirm', 'pay', 'pre'].includes(S.screen) && !['processing', 'pending'].includes(S.pay.phase) && !(S.voice.on && ['listening', 'processing'].includes(S.voice.st));
const sessLeft = () => Math.max(0, Math.ceil((SESS_GRACE_MS - (Date.now() - S.sess.warn)) / 1000));
const dialogSess = () => `<div class="dim center" style="z-index:40"><div class="dialog sess" role="alertdialog" aria-label="아직 주문 중이신가요?"><span class="sc">${ico('clock')}</span><h2>아직 주문 중이신가요?</h2><p class="sd">계속 주문하기를 누르면<br>선택한 메뉴가 그대로 유지돼요.</p><p class="sessleft" aria-live="polite">${sessLeft()}초 후 주문 내역이 초기화됩니다.</p><button class="btn pri block" data-act="sessKeep">계속 주문하기</button><button class="btn sec block" data-act="sessEnd">주문 종료하기</button></div></div>`
const INFO = { lang: ['언어 선택', [['한국어', true], ['English', false], ['中文', false], ['日本語', false]], '다른 언어는 준비 중이에요. 한국어로 계속 주문할 수 있어요.'], access: ['접근성 설정', [['글자·화면 확대', false], ['화면 대비', false], ['음성 안내 크기·속도', false]], '이 설정들은 준비 중이에요. 지금도 "시간 연장"과 "주문 도움"을 쓸 수 있어요.'] };
const dialogInfo = () => { const [t, rows, note] = INFO[S.dlg]; return `<div class="dim center" style="z-index:30"><div class="dialog" role="dialog" aria-label="${t}"><h2>${t}</h2><div class="inforows">${rows.map(([n, on]) => `<div class="${on ? 'on' : ''}"><b>${on ? '✓ ' : ''}${n}</b><small>${on ? '선택됨' : '준비 중'}</small></div>`).join('')}</div><p style="font-size:28px;color:var(--mute)">${note}</p><button class="btn pri block" data-act="dlg" data-v="">닫기</button></div></div>`; };
setInterval(() => {
  const s = S.sess; if (s.freeze) return;
  if (!sessOn()) { s.last = Date.now(); if (s.warn) { s.warn = 0; render(); } return; }
  const now = Date.now();
  if (s.warn) { if (now - s.warn >= SESS_GRACE_MS) return reset(); const el = document.querySelector('.sessleft'); if (el) el.textContent = `${sessLeft()}초 후 주문 내역이 초기화됩니다.`; }
  else if (now - s.last >= SESS_IDLE_MS) { s.warn = now; render(); }
}, 1000);

const A = {
  vStart: () => { const v = S.voice; if (v.st === 'listening' && v.on) return; S.usedVoice = true; Object.assign(v, { on: true, st: 'listening', say: '', next: '', pend: null, ask: v.ask, cands: null, req: v.req + 1 }); if (!v.ask) v.heard = ''; render(); },
  vEnd: () => { vOff(); render(); },
  vUtter: (e) => vUtter(e.v),
  vTemp: (e) => { vStartPend(menu(S.voice.ask), e.v, S.voice.qty); S.voice.heard = ''; render(); },
  vPick: (e) => { const q = S.voice.qty; vStartPend(menu(e.v), '', q); render(); },
  vAdd: () => { const v = S.voice; if (v.st !== 'confirming' || !v.pend) return; S.cart.push({ menuId: v.pend.menuId, temp: v.pend.temp, opts: {}, qty: v.pend.qty }); merge(); vSet('idle', '장바구니에 담았어요.', '메뉴를 더 말하거나, 다 담았다면 “이제 됐어”라고 말해 주세요.'); v.heard = ''; render(); },
  vEdit: () => { const p = S.voice.pend; vSet('idle', '', ''); openDetail(p.menuId); S.dtl.temp = p.temp; S.dtl.qty = p.qty; render(); },
  sessKeep: () => { S.sess.warn = 0; S.sess.last = Date.now(); render(); },
  sessEnd: () => reset(),
  setMode: (e) => { const first = !S.mode; S.mode = e.v; S.modeDialog = false; if (first) { dbg.t0 = Date.now(); go('menu'); } else render(); },
  modeDlg: () => { S.modeDialog = true; render(); }, closeModeDlg: () => { S.modeDialog = false; render(); },
  help: () => { S.help = true; S.helpOpen = -1; dbg.help++; render(); },
  closeHelp, faq: (e) => { S.helpOpen = S.helpOpen === +e.i ? -1 : +e.i; render(); },
  staff: () => { closeHelp(); toast('직원에게 알렸어요. 주문 내용은 그대로 두었어요.'); },
  prim: (e) => { goPrim(e.v); render(); },
  sub: (e) => { S.sub = e.v; render(); },
  taste: () => { S.tasteOpen = !S.tasteOpen; render(); },
  dlg: (e) => { S.dlg = e.v || null; render(); },
  goHome: () => (S.cart.length ? A.askCancel() : reset()),
  benefit: (e) => { S.pay.benefit = S.pay.benefit === e.v ? null : e.v; render(); },
  cpnToggle: () => { S.pay.cpnOpen = !S.pay.cpnOpen; render(); },
  stamp: () => { S.pay.stamp = !S.pay.stamp; render(); },
  filter: (e) => {
    const t = e.v;
    if (S.filters.includes(t)) S.filters = S.filters.filter((x) => x !== t);
    else S.filters = [...S.filters.filter((x) => !(['커피', '논커피'].includes(t) && ['커피', '논커피'].includes(x))), t];
    render();
  },
  clearFilters: () => { S.filters = []; S.vf = null; if (S.prim === 'all') S.prim = 'rec'; render(); },
  open: (e) => openDetail(e.id),
  closeDetail: () => { S.detail = null; render(); },
  temp: (e) => { S.dtl.temp = e.v; menu(S.detail).options.forEach((g) => { if (g.onlyTemp && g.onlyTemp !== e.v) delete S.dtl.opts[g.id]; }); render(); },
  opt: (e) => { const [g, c] = e.v.split(':'); c === '0' ? delete S.dtl.opts[g] : (S.dtl.opts[g] = c); render(); },
  dq: (e) => { S.dtl.qty = Math.max(1, Math.min(20, S.dtl.qty + +e.v)); render(); },
  addCart: () => {
    const m = menu(S.detail), d = S.dtl;
    if (!d.temp) { d.tried = true; render(); return $('.err')?.scrollIntoView({ block: 'center' }); }
    const line = { menuId: m.id, temp: d.temp, opts: { ...d.opts }, qty: d.qty };
    const edit = d.editIdx != null;
    if (edit) S.cart[d.editIdx] = line; else S.cart.push(line);
    merge(); S.detail = null;
    toast(edit ? '변경 내용을 저장했어요' : `${m.name}을(를) 장바구니에 담았어요`);
  },
  goCart: () => go('cart'), toMenu: () => go('menu'),
  cq: (e) => { const it = S.cart[+e.i]; it.qty = Math.max(1, Math.min(20, it.qty + +e.v)); render(); },
  del: (e) => { S.cart.splice(+e.i, 1); render(); },
  edit: (e) => { const it = S.cart[+e.i]; openDetail(it.menuId, { ...it, idx: +e.i }); },
  askCancel: () => { S.confirmCancel = true; render(); }, keep: () => { S.confirmCancel = false; render(); },
  reset,
  toConfirm: () => go('confirm'),
  toStart: () => go('start'), precheck: () => { S.pre = { code: '', res: null, busy: false }; go('pre'); },
  typeOpen: (e) => { S.typeOpen = S.typeOpen === +e.i ? -1 : +e.i; render(); },
  toPay: async () => {
    const p = S.pay;
    if (p.phase !== 'pending') { Object.assign(p, { key: crypto.randomUUID?.() || Date.now() + '-' + Math.random(), attempt: 0, phase: 'choose', fail: null }); }
    go('pay');
    if (p.cpn?.status === 'ok') await applyCpn(p.cpn.coupon.code); // cart may have changed -> re-check coupon
  },
  cpnClear: () => { S.pay.cpn = null; S.pay.code = ''; render(); },
  cpnRetry: () => { S.pay.cpn = null; S.pay.code = ''; render(); $('#paycode')?.focus(); },
  selMethod: (e) => { S.pay.method = e.v; render(); },
  payNow, checkTx,
  retryPay: () => payNow(),
  otherMethod: () => { Object.assign(S.pay, { phase: 'choose', method: null, fail: null }); render(); },
};

document.addEventListener('click', (ev) => {
  dbg.taps++; S.sess.last = Date.now();
  const el = ev.target.closest('[data-act]');
  if (el && A[el.dataset.act]) A[el.dataset.act](el.dataset);
});

document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const c = ev.target.dataset.form;
  if (c === 'pre') checkPre(S.pre.code); else if (c === 'pay') applyCpn(S.pay.code);
});
document.addEventListener('input', (ev) => { if (ev.target.id === 'precode') S.pre.code = ev.target.value; if (ev.target.id === 'paycode') S.pay.code = ev.target.value; });

// scale the fixed 1080x1920 kiosk stage into the viewport
const fit = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); const st = $('#stage'); st.style.transform = `scale(${s})`; st.style.left = (innerWidth - 1080 * s) / 2 + 'px'; st.style.top = (innerHeight - 1920 * s) / 2 + 'px'; };
addEventListener('resize', fit); fit();
if (dbg.on) setInterval(() => { const d = $('#dbg'); if (d) d.textContent = `taps ${dbg.taps} · ${dbg.t0 ? Math.round((Date.now() - dbg.t0) / 1000) : 0}s · help ${dbg.help}`; }, 500);
boot();
