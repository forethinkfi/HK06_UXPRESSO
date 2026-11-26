// UXPRESSO kiosk prototype — vanilla JS, full re-render on state change (small app, simplicity over perf).
const $ = (s) => document.querySelector(s);
const I18N = window.UX_I18N;
const UI = () => I18N.UI[S.lang] || I18N.UI.ko;
const won = (n) => UI().won(n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const RETURN_MS = 30000; // silent return to start screen (no countdown shown)
const SESS_IDLE_MS = 120000, SESS_GRACE_MS = 60000; // PRD v3 FR-17 proposal: 120s idle -> warning, 60s grace -> reset (to be confirmed on site)

const MODE_ICONS = { dine: 'store', take: 'bag' };
const modeInfo = (k) => ({ icon: MODE_ICONS[k], ...UI().modes[k] });
const TEMP = () => UI().temp;
const FILTERS = () => ['커피', '논커피', '달콤한', '상큼한', '부드러운', '깔끔한'].map((k) => [k, UI().filters[k] || k]);

// 8 primary categories (PRD v3 FR-02). Categories without data show an honest empty state instead of invented menus.
const TSUBS_IDS = ['all', 'HOT', 'ICE'];
const PRIMS_DEF = [
  { id: 'new', fn: () => false, emptyKey: 'new' },
  { id: 'rec', fn: (m) => m.featured, subIds: ['all'], recSub: true, hasBadge: true },
  { id: 'coffee', fn: (m) => m.category === '커피', subIds: TSUBS_IDS },
  { id: 'decaf', fn: (m) => (m.tags || []).includes('디카페인') || m.caffeine_mg === 0 || /디카페인|무카페인/.test(m.name), subIds: TSUBS_IDS },
  { id: 'drink', fn: (m) => ['라떼', '음료', '에이드·스무디', '에이드&주스', '스무디&프라페'].includes(m.category), subIds: ['all', 'latte', 'ade'] },
  { id: 'tea', fn: (m) => m.category === '티', subIds: TSUBS_IDS },
  { id: 'food', fn: (m) => m.category === '푸드', subIds: ['all'] },
  { id: 'goods', fn: () => false, emptyKey: 'goods' },
];
const primName = (p) => UI().prims[p.id] || p.id;
const primSubs = (p) => (p?.subIds || []).map((id) => [id, id === 'all' && p.recSub ? UI().subs.recAll : (UI().subs[id] || id)]); // p is undefined for S.prim === 'all' (all menus)
const primEmpty = (p) => (p?.emptyKey ? UI().emptyPrim[p.emptyKey] : '');
const SUBFN = {
  all: () => true,
  HOT: (m) => Array.isArray(m.temperature) && m.temperature.includes('HOT'),
  ICE: (m) => Array.isArray(m.temperature) && m.temperature.includes('ICE'),
  latte: (m) => ['라떼', '음료'].includes(m.category),
  ade: (m) => ['에이드·스무디', '에이드&주스', '스무디&프라페'].includes(m.category),
};
const minPrice = (m) => (m.tempPrices ? Math.min(...Object.values(m.tempPrices)) : m.price);
const queryMatch = (m, q) => {
  if (!q) return true;
  const ql = q.toLowerCase();
  const qc = ql.replace(/\s+/g, '');
  const hay = [m.name, m.category, m.description || '', ...(m.aliases || []), ...(m.tags || [])].join(' ').toLowerCase();
  return hay.includes(ql) || hay.replace(/\s+/g, '').includes(qc);
};
const visibleMenus = () => {
  const P = PRIMS_DEF.find((x) => x.id === S.prim);
  return S.menus.filter((m) =>
    (!P || P.fn(m))
    && (SUBFN[S.sub] || SUBFN.all)(m)
    && S.filters.every((t) => (m.tags || []).includes(t))
    && (!S.vf?.max || (minPrice(m) != null && minPrice(m) <= S.vf.max))
    && queryMatch(m, S.vf?.query || '')
  );
};
const goPrim = (id, sub = 'all') => { S.prim = id; S.sub = sub; S.filters = []; S.vf = null; };

const S = {
  lang: 'ko',
  screen: 'start', menus: [], cats: [], prim: 'rec', sub: 'all', tasteOpen: false, dlg: null, filters: [],
  cart: [], detail: null, dtl: null, help: false, helpOpen: -1,
  mode: null, modeDialog: false, confirmCancel: false, toast: '', order: null, apiDown: false,
  types: [], methods: [], groups: [], typeOpen: -1,
  pre: { code: '', res: null, busy: false }, // precheck screen (S-C1)
  voice: { on: false, st: 'idle', heard: '', say: '', next: '', pend: null, ask: null, cands: null, req: 0, live: false, mic: 'init', muted: false, draft: '', err: '' }, // Gemini 3.8 Live voice order (PRD v3 FR-07~13)
  usedVoice: false, vf: null, // vf = list filter set by voice/touch: { label, rec?, max? }
  sess: { last: Date.now(), warn: 0, freeze: false },
  pay: { method: null, code: '', cpn: null, busy: false, phase: 'choose', fail: null, key: '', attempt: 0, tx: null, benefit: null, cpnOpen: false, stamp: false }, // pay flow
};
const dbg = { taps: 0, t0: 0, help: 0, on: new URLSearchParams(location.search).has('debug') }; // usability-test logging (?debug=1)

const mName = (m) => (S.lang !== 'ko' && I18N.MENUS[m.id]?.[S.lang]?.[0]) || m.name;
const mDesc = (m) => (S.lang !== 'ko' && I18N.MENUS[m.id]?.[S.lang]?.[1]) || m.description || UI().descUnconfirmed;
const optGroup = (g) => (S.lang !== 'ko' && I18N.OPTS[g.id]?.[S.lang]) || null;
const optGroupLabel = (g) => optGroup(g)?.label || g.label;
const optGroupTerm = (g) => optGroup(g)?.term || g.term;
const optGroupHelp = (g) => optGroup(g)?.help || g.help;
const optChoiceLabel = (g, c) => optGroup(g)?.c?.[c.id] || c.label;
const tagLabel = (t) => UI().tags[t] || t;
const payGroupLabel = (g) => (S.lang !== 'ko' && I18N.PAY_GROUPS[g]?.[S.lang]) || g;
const payMethodInfo = (m) => {
  const loc = S.lang !== 'ko' && I18N.PAY_METHODS[m.id]?.[S.lang];
  return loc ? { name: loc[0], sub: loc[1] } : { name: m.name, sub: m.sub };
};

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
const basePrice = (m, temp) => {
  if (!m) return null;
  if (m.tempPrices && temp && m.tempPrices[temp] != null) return m.tempPrices[temp];
  return m.price ?? null;
};
const unit = (it) => {
  const m = menu(it.menuId);
  const bp = basePrice(m, it.temp);
  if (bp == null) return null;
  return bp + (m.options || []).reduce((s, g) => s + (g.choices.find((c) => c.id === it.opts?.[g.id])?.price || 0), 0);
};
const fmtPrice = (n) => (n == null ? UI().priceUnconfirmed : won(n));
const cardPrice = (m) => (m.tempPrices ? `${won(m.tempPrices.HOT)} / ${won(m.tempPrices.ICE)}` : fmtPrice(m.price));
const hasUnpricedCart = () => S.cart.some((it) => unit(it) == null);
const cartTotal = () => S.cart.reduce((s, it) => { const u = unit(it); return u == null ? s : s + u * it.qty; }, 0);
const cartTotalLabel = () => {
  if (!S.cart.length) return won(0);
  if (!hasUnpricedCart()) return won(cartTotal());
  const sum = cartTotal();
  return sum > 0 ? `${won(sum)} + ${UI().unconfirmedShort}` : UI().priceUnconfirmed;
};
const cartCount = () => S.cart.reduce((s, it) => s + it.qty, 0);
const optText = (it) => {
  const m = menu(it.menuId);
  const parts = [];
  if (it.temp && TEMP()[it.temp]) parts.push(TEMP()[it.temp]);
  else if (!m?.temperature?.length) parts.push(UI().tempUnconfirmed);
  for (const g of m?.options || []) {
    if (it.opts?.[g.id]) parts.push(optChoiceLabel(g, g.choices.find((c) => c.id === it.opts[g.id])));
  }
  return parts.join(' · ');
};

// ---------- visuals ----------
const L = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`; // Lucide icons, hydrated in render()
const icon = (n) => L({ store: 'coffee', bag: 'cup-soda' }[n]);
const ico = (n) => L({ home: 'house', globe: 'languages', clock: 'clock', chev: 'chevron-right', hand: 'hand', check: 'check' }[n]);
const cup = (color) => `<svg viewBox="0 0 100 124" aria-hidden="true"><rect x="20" y="6" width="60" height="12" rx="5" fill="#2b2b2b"/><path d="M25 18h50l-6 92a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5z" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M28.5 46h43l-3.6 64.5a3 3 0 0 1-3 2.5H35.1a3 3 0 0 1-3-2.5z" fill="${color}"/></svg>`;
const foodThumb = (color) => `<svg viewBox="0 0 100 124" aria-hidden="true"><ellipse cx="50" cy="84" rx="38" ry="14" fill="#fff" stroke="#2b2b2b" stroke-width="3"/><path d="M22 78c0-20 12-36 28-36s28 16 28 36z" fill="${color}" stroke="#2b2b2b" stroke-width="3"/><path d="M36 56c4-6 10-8 14-8" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`;
const thumbFor = (m) => (m.category === '푸드' ? foodThumb(m.color) : cup(m.color)); // illustration for menus without a photo
const pic = (m) => (m.image_url ? `<img src="${m.image_url}" alt="${esc(mName(m))}" loading="lazy" onerror="this.style.display='none'">` : thumbFor(m)); // Unsplash placeholder photos (not official product shots)
const features = (m) => {
  const tags = m.tags || [];
  if (m.category === '푸드') return [UI().foodTag];
  const out = [];
  if (tags.includes('커피')) out.push(UI().hasCoffee);
  else if (tags.includes('논커피')) out.push(UI().noCoffee);
  out.push(...tags.filter((t) => t !== '커피' && t !== '논커피').slice(0, 2).map(tagLabel));
  if (m.caffeine_mg != null) out.push(UI().caffeineInfo(m.caffeine_mg));
  return out;
};

// ---------- help content (contextual, S-04) ----------
const HELP_COPY = {
  ko: {
    detailTitle: (n) => `${n} 주문 도움`,
    detailQ1: (l) => `'${l}'는 무슨 뜻이에요?`,
    detailA1: (t, h) => `${t}이에요. ${h}`,
    detailQ2: '꼭 골라야 하는 게 있나요?',
    detailA2: '온도만 꼭 골라 주세요. 나머지 옵션은 안 골라도 주문할 수 있어요.',
    detailQ3: '잘못 담았어요',
    detailA3: '장바구니에서 옵션과 수량을 언제든 바꿀 수 있어요. 처음부터 다시 하지 않아도 돼요.',
    detailQ4: '알레르기 정보가 궁금해요',
    detailA4: '공식 알레르기 정보가 확인되지 않았어요. 알레르기가 있다면 직원에게 확인해 주세요.',
    by: {
      start: ['이용 안내', [['음성으로 주문하고 싶어요', '"음성으로 주문하기"를 누르고 "매장에서 먹을게요"처럼 말해 보세요. 결제와 쿠폰은 항상 화면을 눌러 직접 해요.'], ['어떻게 주문하나요?', '① 매장에서 먹을지, 포장할지 골라요. ② 메뉴를 골라 장바구니에 담아요. ③ 주문 내역을 확인하고 결제해요.'], ['잘못 골랐어요', '나중에 장바구니나 주문 확인 화면에서 바꿀 수 있어요.']]],
      menu: ['메뉴 고르기 도움', [['음성으로 주문할 수 있나요?', '위쪽 "음성으로 주문하기" 버튼을 누르고 원하는 메뉴를 말해 보세요. 다른 언어로 말씀하시면 화면 언어도 자동으로 바뀌어요.'], ['메뉴를 못 정하겠어요', '위 주요 메뉴에서 바로 고르거나, 취향 필터 버튼을 눌러 범위를 좁혀 보세요.'], ['커피를 안 마셔요', '"커피가 들어가지 않은 음료" 버튼을 누르면 해당 메뉴만 보여요.'], ['담은 메뉴는 어디서 봐요?', '아래 "주문 확인" 또는 장바구니 버튼을 누르세요.'], ['매장/포장을 바꾸고 싶어요', '위쪽 "바꾸기"를 누르면 담은 메뉴는 그대로 두고 바꿀 수 있어요.']]],
      cart: ['장바구니 도움', [['수량을 바꾸고 싶어요', '＋ − 버튼으로 바꿔요.'], ['옵션을 바꾸고 싶어요', '"옵션 수정"을 누르면 메뉴는 그대로 두고 옵션만 바꿀 수 있어요.'], ['전부 취소하고 싶어요', '"전체 주문 취소"를 누르면 한 번 더 물어봐요.']]],
      confirm: ['주문 확인 도움', [['음성 주문은 어디 갔어요?', '주문 확인부터는 화면을 눌러 직접 진행해요. 메뉴를 더 담으려면 "메뉴 더 담기"를 누르세요.'], ['내용을 고치고 싶어요', '"주문 수정"을 누르면 장바구니로 돌아가요. 담은 내용은 그대로예요.'], ['매장/포장을 바꾸고 싶어요', '"바꾸기"를 눌러 다시 고를 수 있어요.']]],
      pay: ['결제 도움', [['쿠폰은 어떻게 써요?', '쿠폰 번호를 넣고 "적용하기"를 누르세요. 할인 금액이 바로 보여요. 쿠폰이 없으면 그냥 넘어가면 돼요.'], ['쿠폰이 안 돼요', '화면에 이유와 해결 방법이 나와요. 다른 쿠폰을 넣거나 쿠폰 없이 결제할 수 있어요.'], ['결제가 안 돼요', '화면 안내에 따라 다른 결제 수단을 고르거나 다시 시도하세요. 막히면 "직원 도움 요청"을 눌러 주세요.'], ['결제가 두 번 되나요?', '아니요. 같은 주문은 한 번만 결제돼요.']]],
      pre: ['쿠폰·결제 수단 도움', [['꼭 해야 하나요?', '아니요. 쿠폰이 궁금할 때만 확인하세요. 안 해도 바로 주문할 수 있어요.'], ['목록에 없는 쿠폰이에요', '키오스크에서 확인할 수 없는 쿠폰은 직원 확인이 필요해요. "직원 도움 요청"을 눌러 주세요.']]],
    },
  },
  en: {
    detailTitle: (n) => `${n} Help`,
    detailQ1: (l) => `What does '${l}' mean?`,
    detailA1: (t, h) => `It means ${t}. ${h}`,
    detailQ2: 'Is anything required?',
    detailA2: 'Only temperature is required. All extra options are optional.',
    detailQ3: 'I picked the wrong item',
    detailA3: 'You can edit quantity or options anytime in the Cart.',
    detailQ4: 'Allergen information',
    detailA4: 'Official allergen details are not listed here. Please ask staff if you have food allergies.',
    by: {
      start: ['Ordering Guide', [['How do I order by voice?', 'Tap "Order by Voice" and speak naturally in your language. Discount and payment are always done on screen.'], ['How does ordering work?', '1. Choose Dine In or Takeout. 2. Pick drinks and add to cart. 3. Review and pay.'], ['What if I make a mistake?', 'You can edit items anytime in the Cart before paying.']]],
      menu: ['Menu Help', [['Can I order by voice?', 'Tap "Order by Voice" at the top and tell me what you want. The screen also switches automatically to match your language.'], ['I need coffee-free drinks', 'Tap "Filter by Taste" and choose "Coffee-Free".'], ['How do I switch Dine In / Takeout?', 'Tap "Change" at the top—your cart items stay safe.']]],
      cart: ['Cart Help', [['Change quantity', 'Use the + and - buttons.'], ['Change options', 'Tap "Edit Options" to adjust temperature or extras.'], ['Cancel everything', 'Tap "Cancel All" and confirm.']]],
      confirm: ['Review Help', [['Where did voice ordering go?', 'From review onwards, please tap the screen directly for privacy. Tap "Add More" to go back to the menu.'], ['Edit my order', 'Tap "Edit Order" to return to your cart.']]],
      pay: ['Payment Help', [['How do I use a coupon?', 'Open "Mega Coffee App Coupon", enter your code, and tap Apply.'], ['Will I be charged twice?', 'No. Each order has duplicate-charge protection.']]],
      pre: ['Coupon Pre-check Help', [['Is this required?', 'No. Tap "Start Ordering" anytime to skip this check.']]],
    },
  },
  zh: {
    detailTitle: (n) => `${n} 点单帮助`,
    detailQ1: (l) => `“${l}”是什么意思？`,
    detailA1: (t, h) => `指的是${t}。${h}`,
    detailQ2: '有必选项吗？',
    detailA2: '只需选择温度（热饮/冰饮），其余配料均为可选项。',
    detailQ3: '点错了怎么办？',
    detailA3: '可随时在购物车中修改数量、规格或删除。',
    detailQ4: '过敏原说明',
    detailA4: '暂无官方过敏原数据，如有食物过敏请咨询现场店员。',
    by: {
      start: ['使用指南', [['如何语音点单？', '点击“语音点单”直接说话即可，系统会根据您说的语言自动切换界面语言。'], ['如何下单？', '1. 选择堂食或打包。2. 挑选饮品加入购物车。3. 确认订单并付款。']]],
      menu: ['菜单帮助', [['支持哪些语言？', '支持韩语、英语、中文和日语，直接开口说话即可自动切换。'], ['不喝咖啡怎么选？', '点击“按口味筛选”中的“不含咖啡”。'], ['如何更换堂食/打包？', '点击顶部的“更改”，已选饮品不会清空。']]],
      cart: ['购物车帮助', [['修改数量与规格', '点击 ＋ − 调整数量，或点击“修改规格”。'], ['清空订单', '点击“清空全部”后二次确认即可。']]],
      confirm: ['确认订单帮助', [['为什么语音结束了？', '确认订单和支付阶段为保护隐私需在屏幕上点击操作，如需加点可点“继续点单”。']]],
      pay: ['支付帮助', [['如何使用优惠券？', '展开“Mega Coffee App 优惠券”，输入券码并点击使用。'], ['会重复扣款吗？', '不会，系统具备防重复扣款保护。']]],
      pre: ['事前查询帮助', [['必须先查券吗？', '不用，点击下方“开始点单”即可直接点单。']]],
    },
  },
  ja: {
    detailTitle: (n) => `${n} ヘルプ`,
    detailQ1: (l) => `「${l}」とは何ですか？`,
    detailA1: (t, h) => `${t}のことです。${h}`,
    detailQ2: '必須の選択はありますか？',
    detailA2: '温度（ホット/アイス）のみ必須です。その他のオプションは任意です。',
    detailQ3: '間違えて選びました',
    detailA3: 'カート画面からいつでも数量やオプションを変更できます。',
    detailQ4: 'アレルギー情報について',
    detailA4: '公式のアレルギー情報は未掲載です。ご心配な場合はスタッフへお尋ねください。',
    by: {
      start: ['ご利用案内', [['音声で注文するには？', '「音声で注文する」を押してそのままお話しください。お話しになった言語に合わせて画面も自動で切り替わります。'], ['注文の流れ', '① 店内/お持ち帰りを選ぶ ② メニューをカートに入れる ③ 内容を確認して支払う。']]],
      menu: ['メニュー選択ヘルプ', [['音声で注文できますか？', '上部の「音声で注文する」からご希望をお伝えください。日本語で話すと画面も日本語になります。'], ['コーヒー以外の飲み物', '「好みで絞り込む」から「ノンコーヒー」をお選びください。']]],
      cart: ['カートヘルプ', [['数量・オプション変更', '＋ − ボタンや「オプション変更」から調整できます。']]],
      confirm: ['注文確認ヘルプ', [['音声案内が終了したのはなぜ？', 'お支払い・割引の確認は誤操作防止のため画面タッチで進めます。']]],
      pay: ['お支払いヘルプ', [['クーポンの使い方', 'クーポン欄に番号を入力して「適用する」を押してください。'], ['二重決済になりませんか？', 'はい、同じ注文で二重に決済されることはありません。']]],
      pre: ['事前確認ヘルプ', [['確認は必須ですか？', 'いいえ、そのまま「注文をはじめる」から注文できます。']]],
    },
  },
};

const helpFor = () => {
  const hc = HELP_COPY[S.lang] || HELP_COPY.ko;
  const m = S.detail && menu(S.detail);
  if (m) {
    return {
      title: hc.detailTitle(mName(m)),
      items: [
        ...m.options.map((g) => [hc.detailQ1(optGroupLabel(g)), hc.detailA1(optGroupTerm(g), optGroupHelp(g))]),
        [hc.detailQ2, hc.detailA2],
        [hc.detailQ3, hc.detailA3],
        [hc.detailQ4, hc.detailA4],
      ],
    };
  }
  const by = hc.by[S.screen] || [UI().helpBtn, []];
  return { title: by[0], items: by[1] };
};

// ---------- views ----------
const hdr = (left, right = '') => `<div class="hdr">${left}${right}</div>`;
const helpBtn = () => `<button class="helpbtn" data-act="help" aria-label="${esc(UI().helpBtn)}"><i>?</i>${UI().helpBtn}</button>`;
const langBtn = () => `<button class="ibtn" data-act="dlg" data-v="lang" aria-label="${esc(UI().langAria)}">${ico('globe')}</button>`;
const homeBtn = () => `<button class="ibtn" data-act="goHome" aria-label="${esc(UI().homeAria)}">${ico('home')}</button>`;
const backB = (act, label) => `<button class="back2" data-act="${act}">${label}</button>`;
const topbar = (left = '', mid = '') => `<div class="hdr2"><span class="hl">${left}</span><b class="ttl">MEGA MGC COFFEE</b><span class="hr">${langBtn()}${mid}${helpBtn()}</span></div>`;
const crumbs = (n) => `<nav class="crumbs" aria-label="steps">${UI().steps.map((t, i) => `<span class="${i === n ? 'on' : ''}"${i === n ? ' aria-current="step"' : ''}>${t}</span>`).join('<i aria-hidden="true">›</i>')}</nav>`;
const logo = () => `<div class="logo">MEGA MGC COFFEE<small>${UI().logoSub}</small></div>`;
const modeBar = () => { const mi = modeInfo(S.mode); return `<div class="modebar"><span class="mi">${icon(mi.icon)}</span><span><small>${UI().orderMethod}</small><b>${mi.name}</b></span><button class="btn sec sm2" data-act="modeDlg">${UI().change}</button></div>`; };
const modeBtn = (k, on) => { const mi = modeInfo(k); return `<button class="mode" data-act="setMode" data-v="${k}" aria-pressed="${on}"><span class="mi">${icon(mi.icon)}</span><b>${mi.name}</b><span>${mi.sub}</span><span class="chk">${on ? UI().selected : ''}</span></button>`; };

function viewStart() {
  const u = UI();
  const tile = (k) => { const mi = modeInfo(k); return `<button class="mt" data-act="setMode" data-v="${k}"><span class="mi">${icon(mi.icon)}</span><b>${mi.name}</b><small>${mi.en}</small></button>`; };
  return `<div class="screen">${topbar()}<div class="scroll start2">
  <div class="ad"><small>${u.adSeason}</small><h2>${u.adTitle}</h2><p>${u.adSub}</p><div class="adimg"><b>AD IMAGE</b><span>${u.adImgSub}</span></div></div>
  <div class="ask2"><h1>${u.askMode}</h1><div class="mts">${tile('dine')}${tile('take')}</div>${vbar('start')}
  <div class="utils"><button data-act="dlg" data-v="lang"><b>${u.langTitle}</b><small>Language</small></button><button data-act="dlg" data-v="access"><b>${u.accessTitle}</b><small>Accessibility</small></button><button data-act="precheck"><b>${u.precheckTitle}</b><small>${u.precheckSub}</small></button></div></div></div>
  <div class="disc">${u.disc}</div></div>`;
}

const orderBar = () => {
  const u = UI(), n = cartCount();
  const L = S.cart.slice(0, 2).map((it) => `<li>${it.temp ? `${it.temp} ` : ''}${esc(mName(menu(it.menuId)))} × ${it.qty}</li>`).join('') + (S.cart.length > 2 ? `<li>${u.andMore(S.cart.length - 2)}</li>` : '');
  return `<div class="obar"><div class="orow"><span class="oclock">${ico('clock')}${u.idleTimer}</span><button class="btn sec" data-act="sessKeep">${u.extendTime}</button></div>
  <div class="osum"><b>${u.orderSummary(n)}</b>${n ? `<ul>${L}</ul>` : ''}<div class="ototal"><span>${u.totalPayAmt}</span><b>${cartTotalLabel()}</b></div></div>
  <div class="oacts">${n ? `<button class="btn sec" data-act="askCancel">${u.cancelOrder}</button>` : ''}<button class="btn pri" data-act="goCart" ${n ? '' : 'disabled'}>${u.confirmOrder}</button></div></div>`;
};
const card = (m) => {
  const P = PRIMS_DEF.find((x) => x.id === S.prim), u = UI();
  const tmText = Array.isArray(m.temperature) && m.temperature.length ? m.temperature.join(' · ') : u.tempUnconfirmed;
  return `<button class="c2" data-act="open" data-id="${m.id}"><em class="bdg">${P?.hasBadge && m.featured ? u.recBadge : ''}</em><div class="thumb">${pic(m)}</div><b>${esc(mName(m))}</b><span class="tm">${esc(tmText)}</span><span class="price">${esc(cardPrice(m))}</span><span class="more">${u.detailMore}</span></button>`;
};
function viewMenu() {
  const u = UI(), list = visibleMenus(), P = PRIMS_DEF.find((x) => x.id === S.prim), emp = primEmpty(P);
  const empty = `<div class="state">${emp ? esc(emp) : u.noMatch}<p>${emp ? u.tryOtherCat : u.tryClearFilter}</p>${S.filters.length || S.vf ? `<button class="btn sec" data-act="clearFilters">${u.clearAllFilters}</button>` : ''}</div>`;
  const v = S.voice, mi = modeInfo(S.mode);
  return `<div class="screen">${topbar(homeBtn() + `<button class="modechip" data-act="modeDlg">${mi.tag}<small>${u.change}</small></button>`, v.on ? '' : `<button class="vtrig" data-act="vStart" aria-label="${esc(u.voiceOrderBtn)}"><span class="vi">${vicon('mic')}</span>${u.voiceShort}</button>`)}<h1 class="mtitle">${S.vf ? esc(S.vf.label) : P ? primName(P) : u.allLabel}</h1>${vbar('menu')}
  <div class="scroll" data-keep>
   <div class="prims" role="tablist">${PRIMS_DEF.map((x) => `<button class="pm" aria-pressed="${S.prim === x.id}" data-act="prim" data-v="${x.id}">${S.prim === x.id ? '✓ ' : ''}${primName(x)}</button>`).join('')}</div>
   <div class="subs">${primSubs(P).map(([id, l]) => `<button class="sp" aria-pressed="${S.sub === id}" data-act="sub" data-v="${id}">${l}</button>`).join('')}<button class="sp taste" aria-expanded="${S.tasteOpen}" data-act="taste">${u.narrowTaste} ${S.tasteOpen ? '▲' : '▼'}</button></div>
   ${S.tasteOpen ? `<div class="chips" style="padding:0 0 16px">${FILTERS().map(([t, l]) => `<button class="chip" aria-pressed="${S.filters.includes(t)}" data-act="filter" data-v="${t}">${l}</button>`).join('')}</div>` : ''}
   ${S.filters.length || S.vf ? `<div class="count2"><span>${S.vf ? esc(S.vf.label) : P ? primName(P) : u.allLabel}${S.filters.length ? u.tasteCount(S.filters.length) : ''}${u.menuCount(list.length)}</span>${S.filters.length || S.vf ? `<button class="btn ghost" data-act="clearFilters">${u.viewAllMenus}</button>` : ''}</div>` : ''}
   ${list.length ? `<div class="grid3">${list.map(card).join('')}</div>` : empty}
   ${v.on ? '' : `<div class="micbox"><p>${u.hardToFind}</p><button class="btn sec" data-act="vStart"><span class="vi">${vicon('mic')}</span>${u.voiceSearchBtn}</button></div>`}
  </div>${orderBar()}</div>`;
}

function viewDetail() {
  const u = UI(), m = menu(S.detail), d = S.dtl, name = mName(m), tp = TEMP();
  const temps = Array.isArray(m.temperature) ? m.temperature : [];
  const it = { menuId: m.id, temp: d.temp || (temps.length === 1 ? temps[0] : null), opts: d.opts, qty: d.qty };
  const hasOpt = Object.keys(d.opts).length > 0;
  const ch = (act, id, label, sub, on, off) => `<button class="choice" data-act="${act}" data-v="${id}" aria-pressed="${on}" ${off ? 'disabled' : ''}><span class="nm">${label}</span>${sub ? `<small>${sub}</small>` : ''}</button>`;
  const groups = (m.options || []).map((g) => {
    const off = g.onlyTemp && d.temp !== g.onlyTemp;
    return `<div class="group"><h4>${esc(optGroupLabel(g))}<span class="term">${esc(optGroupTerm(g))}</span><span class="badge opt">${u.optionalBadge}</span></h4><p class="hlp">${off ? u.iceOnlyHint : ''}${esc(optGroupHelp(g))}</p><div class="choices">${g.choices.map((c) => ch('opt', g.id + ':' + c.id, optChoiceLabel(g, c), c.price ? `+${won(c.price)}` : '', !off && (d.opts[g.id] || '0') === c.id, off)).join('')}</div></div>`;
  }).join('');
  const label = d.editIdx != null ? u.addOptSave : hasOpt ? u.addOptWith : u.addOptNone;
  const uPrice = unit(it);
  const heroPrice = it.temp && m.tempPrices?.[it.temp] != null ? won(m.tempPrices[it.temp]) : cardPrice(m);
  const nutrLine = m.caffeine_mg != null ? esc(u.caffeineInfo(m.caffeine_mg)) : u.nutritionNone;
  const tempSection = temps.length > 0
    ? `<div class="group"><h4>${u.tempTitle}<span class="badge">${u.requiredBadge}</span></h4><p class="hlp">${temps.length > 1 ? u.tempHelpBoth : u.tempHelpOne(tp[temps[0]])}</p><div class="choices">${['HOT', 'ICE'].map((t) => ch('temp', t, tp[t], m.tempPrices?.[t] != null ? won(m.tempPrices[t]) : '', (d.temp || (temps.length === 1 ? temps[0] : '')) === t, !temps.includes(t))).join('')}</div>${d.tried && !d.temp ? `<div class="err">${u.tempErr}</div>` : ''}</div>`
    : `<div class="group"><h4>${u.tempTitle}</h4><p class="hlp">${u.tempUnconfirmed}</p></div>`;
  const optSection = m.optionsConfirmed
    ? `${m.options.length ? `<div class="note2">${u.optNote}</div>` : ''}${groups}`
    : `<div class="note2">${u.optUnconfirmedNote}</div>`;
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="${esc(u.optSheetAria(name))}"><div class="sheet-h"><button class="back" data-act="closeDetail">${u.backToMenu}</button>${helpBtn()}</div>${vbar()}
  <div class="sheet-body" data-keep>
   <div class="hero"><div class="thumb">${pic(m)}</div><div><h2>${esc(name)}</h2><div class="price">${esc(heroPrice)}</div><p>${esc(mDesc(m))}</p><div class="tags">${features(m).map((t) => `<span>${esc(t)}</span>`).join('')}</div></div></div>
   <details><summary>${u.nutritionSummary}</summary><p>${nutrLine}</p><p>${u.allergyNone}</p><p>${u.sourcePrefix}: ${esc(m.source)}</p></details>
   ${tempSection}
   ${optSection}
   <div class="group qty"><h4>${u.qtyTitle}</h4><div class="stepper"><button data-act="dq" data-v="-1" aria-label="${esc(u.qtyDec)}" ${d.qty <= 1 ? 'disabled' : ''}>−</button><output>${d.qty}</output><button data-act="dq" data-v="1" aria-label="${esc(u.qtyInc)}" ${d.qty >= 20 ? 'disabled' : ''}>＋</button></div></div>
  </div>
  <div class="foot col"><div class="row2"><button class="btn sec" data-act="closeDetail" style="flex:none">${d.editIdx != null ? u.cancelEdit : u.cancelOpt}</button><button class="btn pri" data-act="addCart"><span>${label}</span><small>${uPrice == null ? u.priceUnconfirmed : won(uPrice * d.qty)}</small></button></div></div></div></div>`;
}

function viewCart() {
  const u = UI();
  if (!S.cart.length) return `<div class="screen">${topbar(backB('toMenu', u.backToMenu))}${crumbs(1)}${vbar()}<div class="empty">${u.cartEmpty}<p>${u.cartEmptySub}</p><button class="btn pri" data-act="toMenu">${u.goMenu}</button></div></div>`;
  return `<div class="screen">${topbar(backB('toMenu', u.backToMenu))}${crumbs(1)}${modeBar()}${vbar()}
  <div class="scroll" data-keep><div class="h2 split"><span>${u.cartTitle} <small>${u.countUnit(cartCount())}</small></span><button class="btn dng" data-act="askCancel">${u.cancelAllOrder}</button></div>${hasUnpricedCart() ? `<div class="res no" style="margin:0 48px 16px" role="alert"><b>${u.priceUnconfirmed}</b><p>${u.cannotPayUnconfirmed}</p></div>` : ''}<div class="list">${S.cart.map((it, i) => { const m = menu(it.menuId), up = unit(it); return `<div class="item"><div class="thumb">${pic(m)}</div><div><h4>${esc(mName(m))}</h4><div class="opts">${esc(optText(it))}</div><div class="opts">${u.eachPrice(fmtPrice(up))}</div></div><div class="lp">${up == null ? u.priceUnconfirmed : won(up * it.qty)}</div>
   <div class="acts"><div class="stepper sm"><button data-act="cq" data-i="${i}" data-v="-1" aria-label="${esc(u.qtyDec)}" ${it.qty <= 1 ? 'disabled' : ''}>−</button><output>${it.qty}</output><button data-act="cq" data-i="${i}" data-v="1" aria-label="${esc(u.qtyInc)}" ${it.qty >= 20 ? 'disabled' : ''}>＋</button></div><span style="display:flex;gap:12px"><button class="btn sec" data-act="edit" data-i="${i}">${u.editOpt}</button><button class="btn sec" data-act="del" data-i="${i}">${u.delMenu}</button></span></div></div>`; }).join('')}</div></div>
  <div class="total"><span>${u.finalOrderAmt}</span><b>${cartTotalLabel()}</b></div>
  <div class="foot"><button class="btn sec" data-act="toMenu">${u.addMoreMenu}</button><button class="btn pri" data-act="toConfirm">${u.checkOrderDetails} · ${u.countUnit(cartCount())} ${cartTotalLabel()}</button></div></div>`;
}

function viewConfirm() {
  const u = UI(), v = S.usedVoice, unpriced = hasUnpricedCart();
  const rows = S.cart.map((it) => { const up = unit(it); return `<div><span>${esc(mName(menu(it.menuId)))} × ${it.qty}<small>${esc(optText(it))}</small></span><span>${up == null ? u.priceUnconfirmed : won(up * it.qty)}</span></div>`; }).join('');
  return `<div class="screen">${topbar(backB('goCart', u.backToCart))}${crumbs(1)}${modeBar()}
  <div class="scroll">${v ? `<div class="hand"><span class="okc">${ico('check')}</span><h1>${u.voiceDoneTitle}</h1><p>${u.voiceDoneSub}</p></div>` : `<div class="h2 split"><span>${u.confirmTitle}</span><button class="btn sec" data-act="goCart">${u.editOrder}</button></div>`}
   <div class="sum-list">${rows}</div>
   ${unpriced ? `<div class="res no" style="margin:16px 48px 0" role="alert"><b>${u.priceUnconfirmed}</b><p>${u.cannotPayUnconfirmed}</p></div>` : ''}
   ${v ? `<div class="vnote" role="status"><span class="vi">${ico('hand')}</span><span><b>${u.touchHandoffTitle}</b>${u.touchHandoffSub}</span></div>` : ''}</div>
  <div class="total"><span>${u.finalPayAmt}</span><b>${cartTotalLabel()}</b></div>
  <div class="foot col2"><button class="btn pri block" data-act="toPay" ${unpriced ? 'disabled' : ''}>${unpriced ? u.priceUnconfirmed : u.choosePayMethod(won(cartTotal()))}</button><button class="btn sec block" data-act="toMenu">${v ? `<span class="vi">${vicon('mic')}</span>` : ''}${u.addMoreMenu}</button></div></div>`;
}

// ---------- coupon / payment views ----------
const post = (u, b) => fetch(u, { method: 'POST', body: JSON.stringify(b) }).then((r) => r.json());
const payFinal = () => { const c = S.pay.cpn; const d = c?.status === 'ok' ? c.discount : 0; return { total: cartTotal(), disc: d, final: Math.max(0, cartTotal() - d) }; };
const cform = (ctx) => { const u = UI(), v = S[ctx].code; return `<form class="cform" data-form="${ctx}"><input id="${ctx}code" value="${esc(v)}" placeholder="${esc(u.cpnPlaceholder)}" aria-label="${esc(u.cpnAria)}" autocomplete="off"><button class="btn pri" type="submit">${ctx === 'pre' ? u.cpnCheckBtn : u.cpnApplyBtn}</button></form><p class="hint">${u.cpnHint}</p>`; };
const resCard = (r, ctx) => {
  if (!r) return '';
  const u = UI();
  const staff = `<button class="btn sec" data-act="staff">${u.reqStaff}</button>`;
  if (r.status === 'busy') return `<div class="res"><div class="spin sm"></div>${u.cpnBusy}</div>`;
  if (r.status === 'ok') return `<div class="res ok" role="status"><b>✓ ${esc(r.coupon.name)}${ctx === 'pay' ? u.cpnOkPay : u.cpnOkPre}</b><p>${ctx === 'pay' ? u.cpnOkPayMsg(won(r.discount)) : u.cpnOkPreMsg}</p>${ctx === 'pay' ? `<div class="racts"><button class="btn sec" data-act="cpnClear">${u.cpnRemove}</button></div>` : ''}</div>`;
  if (r.status === 'unusable') return `<div class="res no" role="alert"><b>✕ ${esc(r.coupon.name)}${u.cpnUnusable}</b><p><strong>${u.reasonLabel}</strong> ${esc(r.reason)}</p><p><strong>${u.howToFixLabel}</strong> ${esc(r.alternative)}</p>${ctx === 'pay' ? `<div class="racts"><button class="btn sec" data-act="cpnRetry">${u.cpnRetry}</button><button class="btn sec" data-act="cpnClear">${u.cpnWithout}</button>${r.hint === 'addMore' ? `<button class="btn sec" data-act="toMenu">${u.addMoreMenu}</button>` : ''}<button class="btn sec" data-act="goCart">${u.editOrder}</button></div>` : ''}</div>`;
  if (r.status === 'unknown') return `<div class="res no" role="alert"><b>${u.cpnUnknown}</b><p><strong>${u.reasonLabel}</strong> ${u.cpnUnknownReason}</p><p><strong>${u.howToFixLabel}</strong> ${u.cpnUnknownAlt}</p><div class="racts">${ctx === 'pay' ? `<button class="btn sec" data-act="cpnRetry">${u.cpnRetry}</button><button class="btn sec" data-act="cpnClear">${u.cpnWithout}</button>` : ''}${staff}</div></div>`;
  return `<div class="res no" role="alert"><b>${u.cpnNetErr}</b><p><strong>${u.reasonLabel}</strong> ${u.cpnNetReason}</p><p><strong>${u.howToFixLabel}</strong> ${u.cpnNetAlt}</p><div class="racts">${ctx === 'pay' ? `<button class="btn sec" data-act="cpnClear">${u.cpnWithout}</button>` : ''}${staff}</div></div>`;
};
const mchip = (m) => { const u = UI(); return m.supported ? `<span class="chip2 ok">${u.usableChip}</span>` : `<span class="chip2 no">${u.unusableChip}</span>`; };

function viewPre() {
  const u = UI();
  return `<div class="screen">${hdr(`<button class="back" data-act="toStart">${u.backToHome}</button>`, helpBtn())}
  <div class="scroll" data-keep><div class="h2" style="padding-bottom:8px">${u.preTitle}</div><p class="lead2">${u.preLead}</p>
  <div class="sect"><h3>${u.preCheckCpn}</h3>${cform('pre')}${resCard(S.pre.res, 'pre')}</div>
  <div class="sect"><h3>${u.preCpnTypes}</h3><div class="faq">${S.types.map((t, i) => `<div style="margin-top:12px"><button class="q" data-act="typeOpen" data-i="${i}" aria-expanded="${S.typeOpen === i}"><span>${esc(t.name)} ${t.kioskUsable ? `<span class="chip2 ok">${u.usableChip}</span>` : `<span class="chip2 no">${u.unusableKioskChip}</span>`}</span><span>${S.typeOpen === i ? '▲' : '▼'}</span></button>${S.typeOpen === i ? `<div class="a"><p>${esc(t.purpose)}</p>${t.kioskUsable ? `<h5>${u.cpnCondH}</h5><ul>${t.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><h5>${u.cpnHowH}</h5><ol>${t.howTo.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>` : `<h5>${u.cpnWhyH}</h5><p>${esc(t.reason)}</p><h5>${u.cpnAltH}</h5><p>${esc(t.alternative)}</p>`}</div>` : ''}</div>`).join('')}</div></div>
  <div class="sect"><h3>${u.prePayMethods}</h3>${S.groups.map((g) => `<h4 class="gt">${esc(payGroupLabel(g))}</h4>${S.methods.filter((m) => m.group === g).map((m) => { const mi = payMethodInfo(m); return `<div class="mrow"><div><b>${esc(mi.name)}</b>${m.supported ? '' : `<small>${esc(m.reason)} ${esc(m.alternative)}</small>`}</div>${mchip(m)}</div>`; }).join('')}`).join('')}</div><div style="height:40px"></div></div>
  <div class="foot"><button class="btn pri block" data-act="toStart">${u.startOrder}</button></div></div>`;
}

function viewPay() {
  const u = UI(), p = S.pay, unpriced = hasUnpricedCart(), { total, disc, final } = payFinal();
  if (p.phase === 'processing') return `<div class="screen done plain"><div class="spin"></div><h1 style="font-size:52px">${u.payProcessingTitle}</h1><p>${u.payProcessingSub}</p></div>`;
  if (p.phase === 'pending') return `<div class="screen done plain"><div class="spin"></div><h1 style="font-size:52px">${u.payPendingTitle}</h1><p>${u.payPendingSub}</p><div class="vstack"><button class="btn sec block" data-act="checkTx">${u.recheckPending}</button><button class="btn sec block" data-act="staff">${u.reqStaff}</button></div></div>`;
  if (p.phase === 'failed') return `<div class="screen">${hdr(logo(), helpBtn())}<div class="scroll"><div class="h2">${u.payFailedTitle}</div><div class="res no" style="margin:0 48px" role="alert"><b>${u.payNotCharged}</b><p><strong>${u.reasonLabel}</strong> ${esc(p.fail.reason)}</p><p><strong>${u.howToFixLabel}</strong> ${esc(p.fail.solution)}</p></div>
  <div class="note">${u.payKeptNote(cartCount(), p.cpn?.status === 'ok')}</div>
  <div class="vstack" style="padding:0 48px"><button class="btn pri block" data-act="retryPay">${u.retrySameMethod}</button><button class="btn sec block" data-act="otherMethod">${u.chooseOtherMethod}</button><button class="btn sec block" data-act="goCart">${u.editMyOrder}</button><button class="btn sec block" data-act="staff">${u.reqStaff}</button></div></div></div>`;
  const sel = S.methods.find((m) => m.id === p.method);
  const selInfo = sel ? payMethodInfo(sel) : null;
  const label = unpriced ? u.priceUnconfirmed : final === 0 ? u.payBtnFullCpn : sel ? u.payBtnAmt(won(final)) : u.payBtnPick;
  const pt = (m, cls = '') => { const mi = payMethodInfo(m); return `<button class="pt ${cls}" data-act="selMethod" data-v="${m.id}" aria-pressed="${p.method === m.id}">${p.method === m.id ? `<i class="ck">${u.selected}</i>` : ''}${m.mark ? `<b class="mk" style="color:${m.color}">${esc(m.mark)}</b>` : `<b>${esc(mi.name)}</b>`}<small>${esc(mi.sub)}</small></button>`; };
  const by = (g) => S.methods.filter((m) => m.group === g);
  const bn = S.benefits || [];
  return `<div class="screen">${topbar(backB('toConfirm', u.backToSummary))}${crumbs(2)}
  <div class="scroll" data-keep>
   ${unpriced ? `<div class="res no" style="margin:16px 48px 0" role="alert"><b>${u.priceUnconfirmed}</b><p>${u.cannotPayUnconfirmed}</p></div>` : ''}
   <div class="amt"><div><span>${u.amountToPay}</span><b>${unpriced ? cartTotalLabel() : won(final)}</b></div><small>${u.amountBreakdown(unpriced ? cartTotalLabel() : won(total), won(disc))}</small></div>
   <div class="sec2"><h2>${u.benefitsQ}</h2><span class="optl">${u.optionalBadge}</span></div><p class="sub2">${u.benefitsSub}</p>
   <div class="box"><h3>${u.telcoTitle}</h3><div class="bgrid">${bn.map((b) => `<button class="pt" data-act="benefit" data-v="${b.id}" aria-pressed="${p.benefit === b.id}">${p.benefit === b.id ? `<i class="ck">${u.selected}</i>` : ''}<b class="mk" style="color:${b.color}">${esc(b.mark)}</b><small>${esc(b.name)}</small></button>`).join('')}</div>
    ${p.benefit ? `<p class="mock">${u.telcoMock}</p>` : ''}
    <button class="rowbtn" data-act="cpnToggle" aria-expanded="${p.cpnOpen || p.cpn?.status === 'ok'}"><span class="m">M</span><span>${u.megaAppCpn}</span><span class="chev">${ico('chev')}</span></button>
    ${p.cpnOpen || p.cpn?.status === 'ok' ? `<div class="cpnbox">${p.cpn?.status === 'ok' ? resCard(p.cpn, 'pay') : `${cform('pay')}${resCard(p.cpn, 'pay')}`}</div>` : ''}</div>
   <p class="sub2 c">${u.noBenefitHint}</p><hr class="hr2">
   <div class="sec2"><h2>${u.howToPayQ}</h2></div>
   ${final === 0 && !unpriced ? `<div class="note">${u.fullCouponNote}</div>` : `
   <h3 class="gl">${u.cardPayTitle}</h3>${by('카드 결제').map((m) => { const mi = payMethodInfo(m); return `<button class="cardpay" data-act="selMethod" data-v="${m.id}" aria-pressed="${p.method === m.id}"><span class="ci">${L('credit-card')}</span><span><b>${esc(mi.name)}</b><small>${esc(mi.sub)}</small></span>${p.method === m.id ? `<i class="ck2">${u.selected}</i>` : `<span class="chev">${ico('chev')}</span>`}</button>`; }).join('')}
   <div class="box"><h3 class="gl">${u.mobilePayTitle}</h3><div class="mgrid4">${by('휴대폰으로 결제').map((m) => pt(m, m.id === 'appcard' ? 'wide' : '')).join('')}</div></div>
   <div class="box"><h3 class="gl">${u.giftPayTitle}</h3><div class="bgrid">${by('상품권·선불카드').map((m) => pt(m)).join('')}</div></div>`}
   <button class="rowbtn stamp" data-act="stamp" aria-pressed="${p.stamp}"><span class="m">M</span><span><b>${u.stampTitle}</b><small>${p.stamp ? u.stampSelected : u.stampDefault}</small></span><span class="chev">${ico('chev')}</span></button>
   ${sel ? `<div class="guide"><b>${esc(u.payGuideTitle(selInfo.name))}</b><ol>${sel.howTo.map((h) => `<li>${esc(h)}</li>`).join('')}</ol><p>${u.payGuideMock}</p></div>` : ''}
   <div style="height:24px"></div></div>
  <div class="foot col2"><button class="btn pri block" data-act="payNow" ${!unpriced && (final === 0 || sel) ? '' : 'disabled'}>${label}</button></div>
  <div class="ubar"><button data-act="dlg" data-v="lang"><b>${u.langTitle}</b><small>Language</small></button><button data-act="dlg" data-v="access"><b>${u.accessTitle}</b><small>Accessibility</small></button><button data-act="help"><b>${u.payHelpLabel}</b><small>Help</small></button></div></div>`;
}

function viewDone() {
  const u = UI(), o = S.order, mi = modeInfo(o.mode);
  const methodLabel = o.fullCpn ? u.payBtnFullCpn : (o.methodId && S.methods.find((x) => x.id === o.methodId) ? payMethodInfo(S.methods.find((x) => x.id === o.methodId)).name : o.method);
  return `<div class="screen done"><h1>${u.doneTitle}</h1><div class="no" aria-label="${esc(u.doneOrderNoAria(o.no))}">${o.no}</div>
  <ol class="steps" aria-label="${esc(u.stepsAria)}"><li class="on" aria-current="step"><i>${ico('check')}</i>${u.stepReceived}<small>${u.stepHere}</small></li><li><i>2</i>${u.stepPrepare}<small>${u.stepPrepareSub}</small></li><li><i>3</i>${u.stepReady}<small>${u.stepReadySub}</small></li></ol><p>${u.pickupText}</p><p class="mut">${u.doneMode(mi.name)}</p>
  <div class="sum-list">${o.items.map((l) => { const m = l.menuId && menu(l.menuId); const nm = m ? mName(m) : l.name; const op = l.menuId && l.opts ? optText({ menuId: l.menuId, temp: l.temp, opts: l.opts }) : l.opt; return `<div><span>${esc(nm)} × ${l.qty}<small>${op}</small></span><span>${won(l.price)}</span></div>`; }).join('')}${o.discount ? `<div><span>${u.cpnDiscountRow}<small>${esc(o.coupon)}</small></span><span>− ${won(o.discount)}</span></div>` : ''}<div><span>${u.paidAmtRow}<small>${esc(methodLabel)}</small></span><span>${won(o.final)}</span></div></div>
  <button class="btn" data-act="reset" style="background:var(--ink);color:#fff;min-height:120px;font-size:44px;width:100%">${u.toHomeBtn}</button><p class="mut" style="font-size:30px">${u.autoHomeNote}</p></div>`;
}

function viewHelp() {
  const u = UI(), h = helpFor();
  return `<div class="dim"><div class="sheet" role="dialog" aria-label="${esc(u.helpBtn)}" style="z-index:20"><div class="sheet-h"><span class="title">${esc(h.title)}</span><button class="x" data-act="closeHelp">${u.helpCloseBtn}</button></div>
  <div class="sheet-body" data-keep><p class="hlp" style="font-size:30px">${u.helpLead}</p>
   <div class="faq">${h.items.map(([q, a], i) => `<div style="margin-top:14px"><button class="q" data-act="faq" data-i="${i}" aria-expanded="${S.helpOpen === i}">${esc(q)}<span>${S.helpOpen === i ? '▲' : '▼'}</span></button>${S.helpOpen === i ? `<div class="a">${esc(a)}</div>` : ''}</div>`).join('')}</div></div>
  <div class="sheet-f"><div style="font-size:28px;color:var(--mute);font-weight:600">${u.helpStaffNote}</div><div class="row"><button class="btn sec" data-act="staff">${u.reqStaff}</button><button class="btn pri" data-act="closeHelp">${u.helpContinue}</button></div></div></div></div>`;
}

const dialogMode = () => { const u = UI(); return `<div class="dim center" style="z-index:25"><div class="dialog" role="dialog" aria-label="${esc(u.modeDlgTitle)}"><h2>${u.modeDlgTitle}</h2><div class="modes in">${modeBtn('dine', S.mode === 'dine')}${modeBtn('take', S.mode === 'take')}</div><button class="back" data-act="closeModeDlg" style="align-self:center">${u.modeDlgKeep}</button></div></div>`; };
const dialogCancel = () => { const u = UI(); return `<div class="dim center" style="z-index:25"><div class="dialog" role="alertdialog"><h2>${u.cancelDlgTitle}</h2><p style="font-size:34px">${u.cancelDlgBody(cartCount())}</p><div class="row"><button class="btn sec" data-act="keep">${u.goBack}</button><button class="btn dng" data-act="reset">${u.cancelAllOrder}</button></div></div></div>`; };

function render() {
  const actEl = document.activeElement;
  const focusId = actEl && actEl.id ? actEl.id : '';
  const selStart = focusId && typeof actEl.selectionStart === 'number' ? actEl.selectionStart : null;
  const keep = [...document.querySelectorAll('[data-keep]')].map((e) => e.scrollTop);
  const v = { start: viewStart, pre: viewPre, menu: viewMenu, cart: viewCart, confirm: viewConfirm, pay: viewPay, done: viewDone }[S.screen]();
  $('#stage').innerHTML = v + (S.detail ? viewDetail() : '') + (S.help ? viewHelp() : '') + (S.modeDialog ? dialogMode() : '') + (S.confirmCancel ? dialogCancel() : '') + (S.dlg ? dialogInfo() : '') + (S.sess.warn ? dialogSess() : '') +
    (S.toast ? `<div class="toast" role="status">${esc(S.toast)}</div>` : '') + (S.apiDown ? '<div class="dbg" style="left:auto;right:8px;color:#fc0">기본 메뉴 데이터 사용 중</div>' : '') +
    (dbg.on ? `<div class="dbg" id="dbg"></div>` : '');
  window.lucide?.createIcons();
  document.querySelectorAll('[data-keep]').forEach((e, i) => { if (keep[i]) e.scrollTop = keep[i]; });
  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus(); if (selStart != null && el.setSelectionRange) try { el.setSelectionRange(selStart, selStart); } catch {} }
  }
}

// ---------- actions ----------
const toast = (t) => { S.toast = t; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = ''; render(); }, 2200); };
const go = (s) => { if (['confirm', 'pay', 'pre', 'done'].includes(s)) vOff(); S.screen = s; S.detail = null; S.help = false; render(); };
const closeHelp = () => { S.help = false; S.helpOpen = -1; render(); };
const openDetail = (id, edit) => {
  const m = menu(id);
  if (!m) return;
  const temps = Array.isArray(m.temperature) ? m.temperature : [];
  S.detail = id; S.help = false;
  S.dtl = edit ? { temp: edit.temp, opts: { ...edit.opts }, qty: edit.qty, editIdx: edit.idx } : { temp: temps.length === 1 ? temps[0] : (temps.length === 0 ? null : ''), opts: {}, qty: 1, editIdx: null };
  render();
};
const freshPay = () => ({ method: null, code: '', cpn: null, busy: false, phase: 'choose', fail: null, key: '', attempt: 0, tx: null, benefit: null, cpnOpen: false, stamp: false });
const reset = () => { clearTimeout(reset.t); clearInterval(S.pay.poll); vOff(); Object.assign(S, { lang: 'ko', usedVoice: false, vf: null, sess: { last: Date.now(), warn: 0, freeze: S.sess.freeze }, pay: freshPay(), pre: { code: '', res: null, busy: false }, typeOpen: -1, screen: 'start', cart: [], detail: null, help: false, prim: 'rec', sub: 'all', tasteOpen: false, dlg: null, filters: [], mode: null, modeDialog: false, confirmCancel: false, order: null }); document.documentElement.lang = 'ko'; dbg.t0 = 0; render(); };
const merge = () => { // merge identical lines after an edit
  const out = [];
  for (const it of S.cart) { const k = JSON.stringify([it.menuId, it.temp, it.opts]); const f = out.find((o) => JSON.stringify([o.menuId, o.temp, o.opts]) === k); f ? (f.qty = Math.min(20, f.qty + it.qty)) : out.push(it); }
  S.cart = out;
};

// ---------- coupon + payment logic ----------
const cartItems = () => S.cart.map(({ menuId, temp, qty, opts }) => ({ menuId, temp, qty, opts }));
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
  const { disc, final } = payFinal(), p = S.pay, sel = S.methods.find((m) => m.id === p.method);
  S.order = { no: 'A-' + String(100 + Math.floor(Math.random() * 900)), mode: S.mode, discount: disc, final, coupon: p.cpn?.status === 'ok' ? p.cpn.coupon.name : '', methodId: final === 0 ? '' : p.method, fullCpn: final === 0, method: final === 0 ? UI().payBtnFullCpn : payMethodInfo(sel).name, items: S.cart.map((it) => ({ menuId: it.menuId, temp: it.temp, opts: { ...it.opts }, name: mName(menu(it.menuId)), qty: it.qty, opt: optText(it), price: unit(it) * it.qty })) };
  S.cart = []; S.pay = freshPay(); // previous customer's order cleared after approval
  go('done');
  reset.t = setTimeout(reset, RETURN_MS);
}
async function payNow() {
  if (hasUnpricedCart()) { toast(UI().cannotPayUnconfirmed); return; }
  const p = S.pay, { final } = payFinal();
  if (p.busy) return; // double-tap guard
  if (final === 0) return complete();
  p.busy = true; p.phase = 'processing'; p.attempt++; render();
  await new Promise((r) => setTimeout(r, 900));
  try {
    const r = await post('/api/pay', { method: p.method, amount: final, key: p.key, attempt: p.attempt, hasUnpriced: hasUnpricedCart() }); // same key => server never charges twice
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

// ---------- voice order (Gemini 3.8 Live API + demo-board compatibility) ----------
const VB_ICONS = {
  idle: 'mic',
  connecting: 'spin',
  listening: 'wave',
  processing: 'spin',
  speaking: 'wave',
  confirm: 'check',
  error: 'micoff',
};
const vicon = (k) => L({ mic: 'mic', wave: 'audio-lines', spin: 'loader-circle', check: 'circle-check', micoff: 'mic-off' }[k]);
const vUtts = () => {
  const u = UI();
  if (S.screen === 'start') return u.vUttsStart;
  if (S.detail) return u.vUttsDetail;
  return u.vUttsMenu;
};
function vbar(ctx) {
  if (['confirm', 'pay', 'pre', 'done'].includes(S.screen)) return ''; // Hidden: order review, payment, completion
  const u = UI(), v = S.voice, tp = TEMP();
  if (!v.on && ctx === 'menu') return ''; // menu: compact trigger lives in the header row
  if (!v.on && ctx === 'start') return `<button class="vstart" data-act="vStart"><span class="vi">${vicon('mic')}</span><span><b>${u.voiceOrderBtn}</b><small>${u.voiceStartSub}</small></span></button>`;
  const key = !v.on ? 'idle' : ({ connecting: 'connecting', listening: 'listening', processing: 'processing', speaking: 'speaking', confirming: 'confirm', error: 'error' }[v.st] || 'idle');
  const ic = VB_ICONS[key], [label, sub] = u.vb[key];
  const bar = key === 'idle'
    ? `<button class="vb vb-idle" data-act="vStart"><span class="vi">${vicon(ic)}</span>${label}</button>`
    : `<div class="vb vb-${key}" role="status" aria-live="polite"><span class="vi">${vicon(ic)}</span>${label}</div>`;
  let panel = '';
  if (v.on) {
    const m = v.pend && menu(v.pend.menuId);
    const body = v.live
      ? `${v.mic === 'denied' ? `<p class="vhint">${u.vMicDenied}</p>` : ''}
         ${v.st !== 'error' ? `<form class="vtext" data-form="vtext"><input id="vtextinput" value="${esc(v.draft)}" placeholder="${esc(u.vTextPlaceholder)}" aria-label="${esc(u.vTextAria)}" autocomplete="off"><button class="btn pri" type="submit">${u.vSend}</button></form>
         <div class="vchips">${vUtts().map((ut) => `<button class="vchip" data-act="vLiveChip" data-v="${esc(ut)}">${esc(ut)}</button>`).join('')}</div>` : ''}`
      : (v.st === 'listening' ? `<p class="vhint">${u.vReadyTextNext}</p><div class="vchips">${vUtts().map((ut) => `<button class="vchip" data-act="vUtter" data-v="${esc(ut)}">${esc(ut)}</button>`).join('')}</div>`
        : v.st === 'confirming' && m ? `<div class="vcard"><b>${esc(mName(m))}</b><span>${tp[v.pend.temp]} · ${u.countUnit(v.pend.qty)}</span><strong>${won((m.price + (v.pend.temp === 'HOT' ? m.hotExtra || 0 : 0)) * v.pend.qty)}</strong></div><div class="vacts"><button class="btn pri" data-act="vAdd">${u.addOptNone}</button><button class="btn sec" data-act="vEdit">${u.editOpt}</button></div>`
        : v.ask ? `<div class="vacts">${menu(v.ask).temperature.map((t) => `<button class="btn sec" data-act="vTemp" data-v="${t}">${tp[t]}</button>`).join('')}</div>`
        : v.cands ? `<div class="vchips">${v.cands.map((id) => `<button class="vchip" data-act="vPick" data-v="${id}">${esc(mName(menu(id)))}</button>`).join('')}</div>` : '');
    const retry = v.st === 'error' || v.st === 'confirming' ? `<button class="btn sec" data-act="vStart">${u.vRetry}</button>` : '';
    const muteBtn = v.live && v.mic === 'ready' && v.st !== 'error' ? `<button class="btn sec" data-act="vMute">${v.muted ? u.vMuteOn : u.vMuteOff}</button>` : '';
    panel = `<div class="vpanel">${v.heard ? `<p><small>${u.vHeardLabel}</small>“${esc(v.heard)}”</p>` : ''}${v.say ? `<p><small>${u.vAiLabel}</small>${esc(v.say)}</p>` : ''}${v.next ? `<p><small>${u.vNextLabel}</small>${esc(v.next)}</p>` : ''}${body}<div class="vacts">${retry}${muteBtn}<button class="btn sec" data-act="vEnd">${u.vEndTouch}</button></div></div>`;
  }
  return `<div class="vwrap">${bar}<div class="vsub-row"><div class="vsub">${sub}</div>${v.live && v.mic === 'ready' ? `<div class="vsub">${v.muted ? u.vMicOffBadge : u.vMicOnBadge}</div>` : ''}</div>${panel}</div>`;
}

// ---------- Gemini Live voice order: UI adapter ----------
// The audio / WebSocket engine is public/live-client.js (UXLive); this block only maps its events onto the kiosk's own
// state (S) and cart, so voice and touch always share ONE cart. Every cart change requested by the AI is re-validated
// against the same menu data here, applied with the same helpers touch uses, and the REAL result goes back to the AI.
const liveContext = (init = false, langChanged = false) => ({ init, langChanged, lang: S.lang, screen: S.screen, mode: S.mode, cartCount: cartCount(), hasUnpriced: hasUnpricedCart() });
function syncLiveContext(init = false, langChanged = false) { if (UXLive.isReady()) UXLive.sendContext(liveContext(init, langChanged)); }

function setLang(lang, { toastNotify = true, sync = true } = {}) {
  const raw = String(lang || '').toLowerCase().slice(0, 2);
  const next = ['ko', 'en', 'zh', 'ja'].includes(raw) ? raw : 'en';
  if (S.lang === next) return false;
  S.lang = next;
  document.documentElement.lang = next;
  const u = UI();
  if (S.voice.on && S.voice.live && S.voice.st === 'listening' && !S.voice.err) {
    S.voice.next = S.voice.mic === 'denied' ? u.vReadyTextNext : u.vReadyNext;
  }
  render();
  if (sync) syncLiveContext(false, true);
  if (toastNotify) {
    const info = I18N.LANGS.find(([code]) => code === next);
    toast(u.toastLangChanged(info ? info[1] : next));
  }
  return true;
}

function liveStop(keepUi = false) {
  UXLive.stop();
  if (!keepUi) Object.assign(S.voice, { on: false, st: 'idle', heard: '', say: '', next: '', pend: null, ask: null, cands: null, live: false, mic: 'init', muted: false, draft: '', err: '' });
}

// What the AI is told after a cart action: the cart exactly as the screen shows it.
const liveCart = () => ({
  count: cartCount(), total: cartTotal(), hasUnpriced: hasUnpricedCart(),
  lines: S.cart.map((it) => { const m = menu(it.menuId), up = unit(it); return { menuId: it.menuId, name: m ? m.name : it.menuId, temp: it.temp, options: optText(it), qty: it.qty, unitPrice: up, lineTotal: up == null ? null : up * it.qty }; }),
});
const liveOk = (extra = {}) => ({ ok: true, ...extra, cart: liveCart(), screen: S.screen, mode: S.mode });
const liveErr = (error, extra = {}) => ({ ok: false, error, ...extra, cart: liveCart() });
const sameLine = (a, b) => a.menuId === b.menuId && a.temp === b.temp && JSON.stringify(a.opts || {}) === JSON.stringify(b.opts || {});
const leaveStart = () => { if (S.screen === 'start') { S.mode = S.mode || 'dine'; dbg.t0 = Date.now(); S.screen = 'menu'; } };

// Validates a requested line against the menu data (the same data the server used). -> { line } or { error }
function liveLine(a) {
  const m = menu(a.menuId);
  if (!m || m.available === false) return { error: 'menu_not_found' };
  const temps = Array.isArray(m.temperature) ? m.temperature : [];
  let temp = null;
  if (temps.length === 1) temp = temps[0];
  else if (temps.length > 1) { if (!temps.includes(a.temp)) return { error: 'temperature_required', supported: temps }; temp = a.temp; }
  const qty = Number(a.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) return { error: 'invalid_quantity' };
  const opts = {};
  for (const [g, c] of Object.entries(a.opts && typeof a.opts === 'object' && !Array.isArray(a.opts) ? a.opts : {})) {
    const grp = (m.options || []).find((x) => x.id === g), ch = grp && grp.choices.find((x) => x.id === String(c));
    if (!ch || (grp.onlyTemp && grp.onlyTemp !== temp)) return { error: 'invalid_option' };
    if (ch.id !== '0') opts[g] = ch.id;
  }
  return { line: { menuId: m.id, temp, opts, qty } };
}
// cart lines matching a request (menuId and, when given, temperature): exactly one is required for a change
function liveTarget(a) {
  const hits = S.cart.map((it, i) => ({ it, i })).filter(({ it }) => it.menuId === a.menuId && (!a.temp || it.temp === a.temp));
  if (!hits.length) return { error: liveErr('not_in_cart') };
  if (hits.length > 1) return { error: liveErr('ambiguous', { choices: hits.map(({ it }) => ({ temp: it.temp, options: optText(it), qty: it.qty })) }) };
  return { hit: hits[0] };
}

// One AI request -> kiosk result. Called for every tool the model uses; never throws.
function applyLiveAction(name, a) {
  if (name === 'set_language') { if (a.lang) setLang(a.lang, { toastNotify: true, sync: false }); return liveOk({ lang: S.lang }); }
  if (name === 'set_order_mode') { S.mode = a.mode === 'take' ? 'take' : 'dine'; S.modeDialog = false; leaveStart(); render(); syncLiveContext(); return liveOk({ orderMode: S.mode }); }
  if (name === 'show_menu_list') {
    leaveStart();
    if (S.screen === 'cart') S.screen = 'menu';
    S.detail = null;
    goPrim(a.category || 'all', a.sub || 'all');
    S.filters = Array.isArray(a.tags) ? a.tags : [];
    const maxN = Number(a.maxPrice) || 0, query = String(a.query || '').trim();
    S.vf = (maxN || query) ? { label: a.label || query || `≤ ${won(maxN)}`, max: maxN, query } : null;
    render();
    const list = visibleMenus();
    return liveOk({ screenCount: list.length, menus: list.slice(0, 12).map((m) => ({ id: m.id, name: m.name, price: m.tempPrices || m.price, temperature: m.temperature })) });
  }
  if (name === 'open_menu_detail') {
    if (!menu(a.menuId)) return liveErr('menu_not_found');
    leaveStart();
    openDetail(a.menuId);
    if (a.temp && S.dtl) S.dtl.temp = a.temp;
    if (a.qty && S.dtl) S.dtl.qty = Math.max(1, Math.min(20, Number(a.qty) || 1));
    render();
    return liveOk({ menuId: a.menuId });
  }
  if (name === 'add_to_cart') {
    const r = liveLine(a);
    if (r.error) return liveErr(r.error, r.supported ? { supportedTemperatures: r.supported } : {});
    const same = S.cart.find((it) => sameLine(it, r.line));
    if ((same ? same.qty : 0) + r.line.qty > 20) return liveErr('quantity_limit', { max: 20, inCart: same ? same.qty : 0 });
    leaveStart();
    S.cart.push(r.line); merge(); S.detail = null;
    const m = menu(r.line.menuId), up = unit(r.line);
    toast(UI().toastAdded(mName(m)));
    syncLiveContext();
    return liveOk({ added: { menuId: m.id, name: m.name, temp: r.line.temp, options: optText(r.line), qty: r.line.qty, unitPrice: up, lineTotal: up == null ? null : up * r.line.qty }, priceConfirmed: up != null });
  }
  if (name === 'update_cart_quantity') {
    const t = liveTarget(a);
    if (t.error) return t.error;
    const qty = Math.round(Number(a.qty));
    if (!Number.isInteger(qty) || qty < 0 || qty > 20) return liveErr('invalid_quantity');
    const m = menu(t.hit.it.menuId);
    if (qty === 0) { S.cart.splice(t.hit.i, 1); toast(UI().toastRemoved(m ? mName(m) : '')); } else { t.hit.it.qty = qty; render(); }
    syncLiveContext();
    return liveOk({ updated: { menuId: a.menuId, qty } });
  }
  if (name === 'remove_from_cart') {
    const t = liveTarget(a);
    if (t.error) return t.error;
    const m = menu(t.hit.it.menuId);
    S.cart.splice(t.hit.i, 1);
    toast(UI().toastRemoved(m ? mName(m) : ''));
    syncLiveContext();
    return liveOk({ removed: { menuId: a.menuId } });
  }
  if (name === 'get_cart') return liveOk();
  if (name === 'request_cancel_order') {
    if (!S.cart.length) return liveErr('cart_empty');
    S.confirmCancel = true; render(); // the kiosk's own confirmation dialog: the customer must press it on the screen
    return liveOk({ awaitingTouchConfirmation: true });
  }
  if (name === 'finish_ordering_to_confirm') {
    if (!S.cart.length) return liveErr('cart_empty');
    setTimeout(() => { if (S.cart.length) go('confirm'); }, 900); // lets the spoken reply finish first
    return liveOk({ goingTo: 'confirm' });
  }
  return liveErr('unknown_action');
}

// Customer-facing text for a server/engine error code (technical details stay in the server log).
const liveErrText = (code) => (['MISSING_API_KEY', 'AUTH', 'MODEL'].includes(code) ? UI().vLiveUnavailable : ['QUOTA', 'MODEL_BUSY'].includes(code) ? UI().vLiveBusy : code === 'SOCKET' ? UI().vServerErr : UI().vGenericErr);

async function liveStart() {
  liveStop(true);
  S.usedVoice = true;
  Object.assign(S.voice, { on: true, live: true, st: 'connecting', heard: '', say: '', next: UI().vConnectNext, pend: null, ask: null, cands: null, mic: 'init', muted: false, err: '' });
  render();
  await UXLive.start({
    context: liveContext,
    onReady: () => { S.voice.st = 'listening'; S.voice.next = S.voice.mic === 'denied' ? UI().vReadyTextNext : UI().vReadyNext; render(); },
    onMic: (state) => { S.voice.mic = state; if (state === 'ready' && S.voice.st === 'listening') S.voice.next = UI().vReadyNext; if (state === 'denied' && S.voice.st !== 'error') S.voice.next = UI().vReadyTextNext; render(); },
    onInput: (text, newTurn) => {
      S.voice.heard = newTurn ? text : S.voice.heard + text;
      if (S.voice.st !== 'speaking') S.voice.st = 'listening';
      const det = I18N.detectLangFromText(S.voice.heard);
      if (det && det !== S.lang) setLang(det, { toastNotify: true, sync: false });
      render();
    },
    onOutput: (text, newTurn) => { S.voice.say = newTurn ? text : S.voice.say + text; render(); },
    onSpeaking: () => { if (S.voice.st !== 'speaking') { S.voice.st = 'speaking'; render(); } },
    onSpeakEnd: () => { if (S.voice.on && S.voice.st === 'speaking') { S.voice.st = 'listening'; render(); } },
    onInterrupted: () => { S.voice.st = 'listening'; render(); },
    onTurnComplete: (silent) => { if (silent && S.voice.st !== 'error') { S.voice.st = 'listening'; render(); } },
    onAction: ({ id, name, args }) => { let r; try { r = applyLiveAction(name, args); } catch (e) { r = liveErr('kiosk_error'); } UXLive.reply(id, r); },
    onError: (code) => { liveStop(true); S.voice.st = 'error'; S.voice.err = liveErrText(code); S.voice.next = S.voice.err; render(); },
    onClosed: (reason) => {
      if (!S.voice.on || S.voice.st === 'error') return;
      if (reason === 'model' || reason === 'socket') { liveStop(true); S.voice.st = 'error'; S.voice.err = liveErrText('SOCKET'); S.voice.next = S.voice.err; render(); } // dropped connection: say so, cart stays, touch continues
      else { liveStop(false); render(); } // idle / time limit: close quietly
    },
  });
}

function liveSendText(text) {
  const t = String(text || '').trim();
  if (!t) return;
  if (!UXLive.isReady()) { toast(UI().toastConnecting); return; }
  const det = I18N.detectLangFromText(t);
  if (det && det !== S.lang) setLang(det, { toastNotify: true, sync: false });
  S.voice.heard = t; S.voice.draft = ''; S.voice.st = 'processing';
  render();
  UXLive.sendText(t);
}

const vOff = () => { const v = S.voice; v.req++; liveStop(false); };
const vSet = (st, say, next) => { Object.assign(S.voice, { st, say, next, pend: null, ask: null, cands: null }); };
const vStartPend = (m, temp, qty) => {
  const v = S.voice, tmp = temp || (m.temperature.length === 1 ? m.temperature[0] : '');
  if (!tmp) { vSet('idle', '따뜻하게 드릴까요, 차갑게 드릴까요?', '말하거나 화면을 눌러 주세요.'); v.ask = m.id; v.pend = null; v.qty = qty || 1; return; }
  vSet('confirming', '이렇게 담아드릴까요?', '맞으면 담고, 다르면 수정해 주세요.'); v.pend = { menuId: m.id, temp: tmp, qty: qty || v.qty || 1 }; v.qty = 0;
};

// ---------- session (PRD v3 FR-17) ----------
const sessOn = () => ['menu', 'cart', 'confirm', 'pay', 'pre'].includes(S.screen) && !['processing', 'pending'].includes(S.pay.phase) && !(S.voice.on && ['connecting', 'listening', 'processing', 'speaking'].includes(S.voice.st));
const sessLeft = () => Math.max(0, Math.ceil((SESS_GRACE_MS - (Date.now() - S.sess.warn)) / 1000));
const dialogSess = () => { const u = UI(); return `<div class="dim center" style="z-index:40"><div class="dialog sess" role="alertdialog" aria-label="${esc(u.sessTitle)}"><span class="sc">${ico('clock')}</span><h2>${u.sessTitle}</h2><p class="sd">${u.sessBody}</p><p class="sessleft" aria-live="polite">${u.sessLeft(sessLeft())}</p><button class="btn pri block" data-act="sessKeep">${u.sessKeepBtn}</button><button class="btn sec block" data-act="sessEnd">${u.sessEndBtn}</button></div></div>`; };
const dialogInfo = () => {
  const u = UI();
  if (S.dlg === 'lang') {
    const rows = I18N.LANGS.map(([code, label]) => {
      const on = S.lang === code;
      return `<button class="${on ? 'on' : ''}" data-act="setLang" data-v="${code}"><b>${on ? '✓ ' : ''}${label}</b><small>${on ? u.langDlgActive : u.langDlgSelect}</small></button>`;
    }).join('');
    return `<div class="dim center" style="z-index:30"><div class="dialog" role="dialog" aria-label="${esc(u.langTitle)}"><h2>${u.langTitle}</h2><div class="inforows">${rows}</div><p style="font-size:28px;color:var(--mute)">${u.langDlgNote}</p><button class="btn pri block" data-act="dlg" data-v="">${u.closeBtn}</button></div></div>`;
  }
  return `<div class="dim center" style="z-index:30"><div class="dialog" role="dialog" aria-label="${esc(u.accessTitleDlg)}"><h2>${u.accessTitleDlg}</h2><div class="inforows">${u.accessRows.map(([n]) => `<div><b>${n}</b><small>${u.preparing}</small></div>`).join('')}</div><p style="font-size:28px;color:var(--mute)">${u.accessNote}</p><button class="btn pri block" data-act="dlg" data-v="">${u.closeBtn}</button></div></div>`;
};
setInterval(() => {
  const s = S.sess; if (s.freeze) return;
  if (!sessOn()) { s.last = Date.now(); if (s.warn) { s.warn = 0; render(); } return; }
  const now = Date.now();
  if (s.warn) { if (now - s.warn >= SESS_GRACE_MS) return reset(); const el = document.querySelector('.sessleft'); if (el) el.textContent = UI().sessLeft(sessLeft()); }
  else if (now - s.last >= SESS_IDLE_MS) { s.warn = now; render(); }
}, 1000);

const A = {
  vStart: () => { if (S.voice.on && S.voice.live && S.voice.st !== 'error') return; liveStart(); },
  vEnd: () => { vOff(); render(); },
  vMute: () => { S.voice.muted = !S.voice.muted; UXLive.setMuted(S.voice.muted); render(); },
  vLiveChip: (e) => liveSendText(e.v),
  vUtter: (e) => liveSendText(e.v),
  vTemp: (e) => { vStartPend(menu(S.voice.ask), e.v, S.voice.qty); S.voice.heard = ''; render(); },
  vPick: (e) => { const q = S.voice.qty; vStartPend(menu(e.v), '', q); render(); },
  vAdd: () => { const v = S.voice; if (v.st !== 'confirming' || !v.pend) return; S.cart.push({ menuId: v.pend.menuId, temp: v.pend.temp, opts: {}, qty: v.pend.qty }); merge(); vSet('idle', UI().toastAdded(mName(menu(v.pend.menuId))), UI().vReadyNext); v.heard = ''; render(); },
  vEdit: () => { const p = S.voice.pend; vSet('idle', '', ''); openDetail(p.menuId); S.dtl.temp = p.temp; S.dtl.qty = p.qty; render(); },
  setLang: (e) => { S.dlg = null; if (!setLang(e.v, { toastNotify: true, sync: true })) render(); },
  sessKeep: () => { S.sess.warn = 0; S.sess.last = Date.now(); render(); },
  sessEnd: () => reset(),
  setMode: (e) => { const first = !S.mode; S.mode = e.v; S.modeDialog = false; if (first) { dbg.t0 = Date.now(); go('menu'); } else render(); syncLiveContext(); },
  modeDlg: () => { S.modeDialog = true; render(); }, closeModeDlg: () => { S.modeDialog = false; render(); },
  help: () => { S.help = true; S.helpOpen = -1; dbg.help++; render(); },
  closeHelp, faq: (e) => { S.helpOpen = S.helpOpen === +e.i ? -1 : +e.i; render(); },
  staff: () => { closeHelp(); toast(UI().toastStaff); },
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
    const hasTemps = Array.isArray(m.temperature) && m.temperature.length > 0;
    if (hasTemps && !d.temp) { d.tried = true; render(); return $('.err')?.scrollIntoView({ block: 'center' }); }
    const line = { menuId: m.id, temp: hasTemps ? d.temp : null, opts: { ...d.opts }, qty: d.qty };
    const edit = d.editIdx != null;
    if (edit) S.cart[d.editIdx] = line; else S.cart.push(line);
    merge(); S.detail = null;
    toast(edit ? UI().toastEdited : UI().toastAdded(mName(m)));
    syncLiveContext();
  },
  goCart: () => go('cart'), toMenu: () => go('menu'),
  cq: (e) => { const it = S.cart[+e.i]; it.qty = Math.max(1, Math.min(20, it.qty + +e.v)); render(); syncLiveContext(); },
  del: (e) => { S.cart.splice(+e.i, 1); render(); syncLiveContext(); },
  edit: (e) => { const it = S.cart[+e.i]; openDetail(it.menuId, { ...it, idx: +e.i }); },
  askCancel: () => { S.confirmCancel = true; render(); }, keep: () => { S.confirmCancel = false; render(); },
  reset,
  toConfirm: () => go('confirm'),
  toStart: () => go('start'), precheck: () => { S.pre = { code: '', res: null, busy: false }; go('pre'); },
  typeOpen: (e) => { S.typeOpen = S.typeOpen === +e.i ? -1 : +e.i; render(); },
  toPay: async () => {
    if (hasUnpricedCart()) { toast(UI().cannotPayUnconfirmed); return; }
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
  if (c === 'pre') checkPre(S.pre.code);
  else if (c === 'pay') applyCpn(S.pay.code);
  else if (c === 'vtext') liveSendText(S.voice.draft);
});
document.addEventListener('input', (ev) => {
  if (ev.target.id === 'precode') S.pre.code = ev.target.value;
  if (ev.target.id === 'paycode') S.pay.code = ev.target.value;
  if (ev.target.id === 'vtextinput') S.voice.draft = ev.target.value;
});

// scale the fixed 1080x1920 kiosk stage into the viewport
const fit = () => { const s = Math.min(innerWidth / 1080, innerHeight / 1920); const st = $('#stage'); st.style.transform = `scale(${s})`; st.style.left = (innerWidth - 1080 * s) / 2 + 'px'; st.style.top = (innerHeight - 1920 * s) / 2 + 'px'; };
addEventListener('resize', fit); fit();
if (dbg.on) setInterval(() => { const d = $('#dbg'); if (d) d.textContent = `taps ${dbg.taps} · ${dbg.t0 ? Math.round((Date.now() - dbg.t0) / 1000) : 0}s · help ${dbg.help}`; }, 500);
boot();
