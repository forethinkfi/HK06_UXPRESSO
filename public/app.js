// UXPRESSO kiosk (unofficial) — design system v6.0. Vanilla JS, full re-render on state change.
const $ = (s) => document.querySelector(s);
const won = (n) => n.toLocaleString('ko-KR') + '원';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (n, cls = '') => `<i data-lucide="${n}" class="${cls}" aria-hidden="true"></i>`;

const IDLE_MS = 120000, GRACE_MS = 60000, RETURN_MS = 30000; // session values are a hypothesis (PRD FR-17)
const MODE = { dine: { name: '매장에서 먹기', icon: 'utensils' }, take: { name: '포장하기', icon: 'shopping-bag' } };
const inCat = (...names) => (m) => m.cats.some((c) => names.includes(c));
const groupSubs = (...names) => names.map((n) => [n, n, (m) => m.group === n]);
const CATS = [
  { id: 'new', name: '신메뉴', fn: inCat('신메뉴') },
  { id: 'rec', name: '추천메뉴', fn: (m) => m.featured || m.cats.includes('신메뉴') }, // BEST picks first (data order), then new menus
  { id: 'coffee', name: '커피', fn: inCat('커피') },
  { id: 'decaf', name: '디카페인', fn: inCat('디카페인') },
  { id: 'drink', name: '음료', fn: inCat('음료', '에이드·주스', '스무디·프라페'), subs: [['latte', '라떼·음료', inCat('음료')], ['ade', '에이드·주스', inCat('에이드·주스')], ['frappe', '스무디·프라페', inCat('스무디·프라페')]] },
  { id: 'tea', name: '티', fn: inCat('티') },
  { id: 'food', name: '푸드', fn: (m) => m.category === '푸드', subs: groupSubs('베이커리', '디저트', '샌드위치·간식') },
  { id: 'goods', name: '상품', fn: (m) => m.category === '상품', subs: groupSubs('굿즈', '콜라보 상품') },
];

const fresh = () => ({
  screen: 'start', mode: null, cat: 'rec', sub: 'all', cart: [], draft: null, dlg: null,
  coupon: null, benefit: null, stamp: '', pay: { method: null, status: 'idle', fail: null, attempt: 0, key: '' }, order: null,
  voice: { on: false, st: 'listening', heard: '', say: '', next: '', audio: false },
});
let S = fresh();
const DB = { menus: [], methods: [], benefits: [] };
const sess = { last: Date.now(), warn: 0, off: false };
let timers = [];
let seq = 0; // bumps on every non-voice action so a late voice response never overwrites a newer choice
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

// ---------- data: API first, bundled JSON fallback ----------
const getJSON = async (api, file, pick) => {
  try { const r = await fetch(api); if (!r.ok) throw 0; return await r.json(); } catch { return pick(await (await fetch(file)).json()); }
};

// ---------- cart ----------
const menu = (id) => DB.menus.find((m) => m.id === id);
const groups = (it) => menu(it.menuId).options.filter((g) => !g.onlyTemp || g.onlyTemp === it.temp);
const choice = (g, it) => g.choices.find((c) => c.id === it.opts[g.id]) || g.choices[0];
const unit = (it) => menu(it.menuId).price + groups(it).reduce((s, g) => s + choice(g, it).price, 0);
const total = () => S.cart.reduce((s, it) => s + unit(it) * it.qty, 0);
const count = () => S.cart.reduce((s, it) => s + it.qty, 0);
const due = () => total() - (S.coupon?.status === 'ok' ? S.coupon.discount : 0);
const needsTemp = (it) => !it.temp && menu(it.menuId).temperature.length > 0;
const optText = (it) => [it.temp, ...groups(it).filter((g) => (it.opts[g.id] || g.choices[0].id) !== g.choices[0].id).map((g) => choice(g, it).label)].filter(Boolean).join(' · ');

// ---------- shared parts ----------
const btn = (label, act, { v = 'primary', ic, val = '', off, cls = '' } = {}) => `<button class="btn ${v} ${cls}" data-act="${act}" data-v="${val}" ${off ? 'disabled' : ''}>${ic ? icon(ic) : ''}${label}</button>`;
const iconBtn = (ic, label, act, { val = '', off, line } = {}) => `<button class="icon-btn ${line ? 'line' : ''}" aria-label="${label}" data-act="${act}" data-v="${val}" ${off ? 'disabled' : ''}>${icon(ic)}</button>`;
const feedback = (tone, msg, detail = '') => `<div class="feedback ${tone}" role="${tone === 'error' ? 'alert' : 'status'}">${icon(tone === 'success' ? 'circle-check' : tone === 'pending' ? 'clock' : tone === 'warning' ? 'triangle-alert' : 'circle-alert')}<div><b>${msg}</b>${detail ? `<p>${detail}</p>` : ''}</div></div>`;
const photo = (m, badge = '') => `<span class="photo">${badge}사진 준비 중${m.image_url ? `<img src="${m.image_url}" alt="" loading="lazy" onerror="this.remove()">` : ''}</span>`;
// description, allergens and nutrition as published on the brand's homepage; nothing is filled in when it is missing
const facts = (m, temp) => {
  const infos = Object.entries(m.info || {}).filter(([t]) => !temp || !t || t === temp);
  const goods = m.category === '상품';
  return `<p>${esc(m.description)}</p>${infos.map(([t, f]) => `<div class="fact">
    ${infos.length > 1 ? `<h3>${t}</h3>` : ''}
    ${f.volume || f.kcal ? `<p>${[f.volume && `용량 ${esc(f.volume)}`, f.kcal && `열량 ${esc(f.kcal)}`].filter(Boolean).join(' · ')}</p>` : ''}
    ${goods ? '' : `<p><b>알레르기</b> ${f.allergens ? esc(f.allergens) : '홈페이지에 표시된 성분이 없어요. 직원에게 확인해 주세요.'}</p>`}
    ${f.nutrition ? `<ul>${f.nutrition.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}</div>`).join('')}
    <p class="sub">${goods ? '' : '알레르기가 있으면 주문 전에 직원에게 꼭 확인해 주세요. '}메가MGC커피 홈페이지 기준(2026-11-26)이에요.</p>`;
};
// two temperatures: a radio pair. One temperature: show only that one, as fixed information (it is already chosen).
const TEMP_LABEL = { HOT: 'HOT 따뜻하게', ICE: 'ICE 차갑게' };
const tempSection = (m, temp, radio) => {
  const only = m.temperature.length === 1 && m.temperature[0];
  const text = (t) => `<span class="${t.toLowerCase()}">${TEMP_LABEL[t]}</span>`;
  return `<section class="group"><h2 class="section">온도 <span class="tag">${only ? `${only} 전용` : '필수'}</span></h2>${only
    ? `<div class="only">${text(only)}<span>${only}만 주문할 수 있어요</span></div>`
    : `<div class="opts" role="radiogroup" aria-label="온도">${m.temperature.map((t) => radio(temp === t, 'temp', t, text(t), '', false, 'temp')).join('')}</div>`}</section>`;
};
const header = ({ back, voice = true } = {}) => `<header class="header">
  ${back ? btn('이전', back, { v: 'tertiary', ic: 'chevron-left' }) : btn('처음으로', 'askReset', { v: 'tertiary', ic: 'house' })}
  <span class="logo">공식 로고</span>
  <span class="mode-label">${S.mode ? MODE[S.mode].name : ''}</span>
  ${iconBtn('circle-help', '도움말', 'dlg', { val: 'help' })}
  ${voice && !S.voice.on ? btn('음성으로 주문하기', 'voiceOn', { v: 'voice', ic: 'mic' }) : ''}</header>`;
const steps = (cur) => `<ol class="steps">${['메뉴 선택', '주문 확인', '할인·결제', '주문 완료'].map((t, i) => `<li class="${i < cur ? 'done' : ''}" ${i === cur ? 'aria-current="step"' : ''}><i>${i < cur ? icon('check') : i + 1}</i>${t}</li>`).join('')}</ol>`;

const VOICE_UI = { listening: ['audio-lines', '듣고 있어요'], processing: ['loader-circle', '말씀하신 내용을 확인하고 있어요'], active: ['mic', '말씀하신 대로 화면을 바꿨어요'], error: ['circle-alert', '잘 듣지 못했어요'] };
const UTTERANCES = ['메뉴 추천해 줘', '디카페인 보여줘', '아이스 아메리카노 두 잔 주세요', '카페라떼 주세요', '따뜻하게 주세요', '이걸로 담아줘', '이제 됐어', '음 그러니까'];
const guide = () => {
  const v = S.voice;
  if (!v.on) return '';
  const [ic, label] = VOICE_UI[v.st];
  return `<section class="guide" aria-live="polite">
    <div class="row between"><span class="state">${icon(ic, v.st === 'processing' ? 'spin' : '')}${label}</span>
      <span class="row">${btn(v.audio ? '음성 안내 ON' : '음성 안내 OFF', 'voiceAudio', { v: 'tertiary', ic: v.audio ? 'volume-2' : 'volume-x' })}${btn('음성 종료', 'voiceOff', { v: 'secondary', ic: 'mic-off' })}</span></div>
    ${v.heard ? `<p class="sub">말씀하신 내용: “${esc(v.heard)}”</p>` : ''}
    ${v.say ? `<p><b>${v.say}</b></p>` : ''}<p>${v.next}</p>
    <p class="sub">연습용 발화예요. 실제 음성은 인식하지 않아요.</p>
    <div class="chips">${UTTERANCES.map((u) => `<button data-act="say" data-v="${u}" ${v.st === 'processing' ? 'disabled' : ''}>${u}</button>`).join('')}</div></section>`;
};

// ---------- screens ----------
const SCREENS = {
  start: () => `<div class="screen">
    <div class="ad">${icon('image')}<p>브랜드 광고 · 시즌 · 콜라보 자리 (공식 그래픽 준비 중)</p></div>
    <div class="pad stack" style="gap:24px">
      <h1 class="title" tabindex="-1">주문 방법을 선택해 주세요</h1>
      <div class="modes">${Object.entries(MODE).map(([k, m]) => `<button class="mode" data-act="start" data-v="${k}">${icon(m.icon)}${m.name}</button>`).join('')}</div>
      ${btn('음성으로 주문하기', 'voiceOn', { v: 'voice', ic: 'mic', cls: 'lg' })}
      <div class="utils">${btn('언어', 'dlg', { v: 'secondary', ic: 'globe', val: 'lang' })}${btn('도움말', 'dlg', { v: 'secondary', ic: 'circle-help', val: 'help' })}</div>
      <p class="notice">메가MGC커피의 공식 서비스가 아닌 UX/UI 개선 시안이에요. 가격과 옵션은 시연용이에요.</p>
    </div></div>`,

  menu: () => {
    const cat = CATS.find((c) => c.id === S.cat);
    const subs = cat.subs || []; // temperature is chosen on the product screen, not filtered here
    const sf = subs.find((s) => s[0] === S.sub)?.[2] || (() => true);
    const list = DB.menus.filter((m) => cat.fn(m) && sf(m));
    const last = S.cart[S.cart.length - 1];
    return `<div class="screen">${header()}${guide()}
    <nav class="cats" role="tablist" aria-label="메뉴 분류">${CATS.map((c) => `<button class="cat" role="tab" aria-selected="${c.id === S.cat}" data-act="cat" data-v="${c.id}">${c.name}</button>`).join('')}</nav>
    ${subs.length ? `<div class="subs" role="tablist">${[['all', '전체'], ...subs].map(([id, l]) => `<button class="subtab" role="tab" aria-selected="${S.sub === id}" data-act="sub" data-v="${id}">${l}</button>`).join('')}</div>` : ''}
    <div class="scroll-wrap">
    <div class="scroll" data-keep="${S.cat}/${S.sub}">
      ${list.length ? `<div class="grid">${list.map((m) => {
        const out = m.available === false;
        // NEW follows the homepage's new-menu list. BEST shows only for `best: true` in the menu data (needs real sales data).
        const tags = out ? ['<span class="badge soldout">품절</span>'] : [m.cats.includes('신메뉴') && '<span class="badge new">NEW</span>', m.best && '<span class="badge">BEST</span>'].filter(Boolean);
        const badge = tags.length ? `<span class="badges">${tags.join('')}</span>` : '';
        return `<article class="card"><button class="card-main" data-act="open" data-v="${m.id}" ${out ? 'disabled' : ''}>${photo(m, badge)}<span class="name">${esc(m.name)}</span><span class="price">${out ? '품절' : won(m.price)}</span></button></article>`;
      }).join('')}</div>`
      : `<div class="empty">${cat.empty || '이 조건의 메뉴가 없어요.'}<p class="sub">다른 분류를 눌러 주세요.</p></div>`}
    </div>
    <div class="updown" hidden>${iconBtn('chevron-up', '위로 보기', 'scroll', { val: -1, line: true })}${iconBtn('chevron-down', '아래로 보기', 'scroll', { val: 1, line: true })}</div>
    </div>
    <div class="cart">
      <div class="row between summary"><div class="grow"><p>${last ? `${esc(menu(last.menuId).name)} × ${last.qty}${S.cart.length > 1 ? ` 외 ${S.cart.length - 1}건` : ''}` : '담은 메뉴가 없어요.'}</p><p>2분 동안 조작이 없으면 종료 안내가 표시돼요.</p></div>${btn('시간 연장', 'extend', { v: 'tertiary', ic: 'clock' })}${S.cart.length ? btn('전체 삭제', 'dlg', { v: 'destructive', ic: 'trash-2', val: 'clear' }) : ''}</div>
      <div class="total"><span>총 결제금액 · ${count()}개</span><b>${won(total())}</b></div>
      ${btn('주문 확인', 'review', { off: !S.cart.length })}
    </div></div>`;
  },

  option: () => {
    const d = S.draft, m = menu(d.menuId);
    const radio = (checked, act, val, label, extra = '', off = false, cls = '') => `<button class="opt ${cls}" role="radio" aria-checked="${checked}" data-act="${act}" data-v="${val}" ${off ? 'disabled' : ''}><span class="radio"></span>${label}${extra ? `<span class="extra">${extra}</span>` : ''}</button>`;
    return `<div class="screen">${header({ back: 'toMenu' })}${guide()}
    <div class="scroll" data-keep>
      <div class="hero">${photo(m)}<div class="stack"><h1 class="title" tabindex="-1">${esc(m.name)}</h1><p class="desc">${esc(m.description)}</p><b class="title">${won(m.price)}</b>${btn(d.more ? '상세 정보 접기' : '상세 정보 펼치기', 'more', { v: 'secondary', ic: d.more ? 'chevron-up' : 'chevron-down' })}</div></div>
      ${d.more ? `<section class="group facts">${facts(m, d.temp)}</section>` : ''}
      ${m.temperature.length ? tempSection(m, d.temp, radio) : ''}
      ${(d.temp ? groups(d) : m.options.filter((g) => !g.onlyTemp)).map((g) => `<section class="group"><h2 class="section">${g.label} <span class="tag">선택</span></h2>
        <div class="opts" role="radiogroup" aria-label="${g.label}">${g.choices.map((c) => radio(choice(g, d) === c, 'opt', `${g.id}:${c.id}`, c.label, c.price ? `+${won(c.price)}` : '')).join('')}</div></section>`).join('')}
      <section class="group row between"><h2 class="section" style="margin:0">수량</h2><div class="stepper">${iconBtn('minus', '수량 줄이기', 'qty', { val: -1, off: d.qty <= 1, line: true })}<output>${d.qty}</output>${iconBtn('plus', '수량 늘리기', 'qty', { val: 1, off: d.qty >= 20, line: true })}</div></section>
    </div>
    <div class="cart">${!needsTemp(d) ? '' : '<p class="sub">온도를 고르면 담을 수 있어요.</p>'}
      <div class="total"><span>선택한 금액</span><b>${won(unit(d) * d.qty)}</b></div>
      ${btn(d.edit != null ? '변경 내용 저장' : '장바구니에 담기', 'add', { off: needsTemp(d) })}</div></div>`;
  },

  review: () => `<div class="screen">${header({ back: 'toMenu', voice: false })}${steps(1)}
    <div class="scroll pad" data-keep><h1 class="title" tabindex="-1">주문 내역을 확인해 주세요</h1><p class="sub">${MODE[S.mode].name} 주문이에요. 할인·결제는 직접 눌러 진행해 주세요.</p>
      ${S.cart.map((it, i) => `<div class="item"><div class="row between"><h3>${esc(menu(it.menuId).name)}</h3><b>${won(unit(it) * it.qty)}</b></div><p class="sub">${optText(it)}</p>
        <div class="row between"><div class="stepper">${iconBtn('minus', '수량 줄이기', 'cq', { val: `${i}:-1`, off: it.qty <= 1, line: true })}<output>${it.qty}</output>${iconBtn('plus', '수량 늘리기', 'cq', { val: `${i}:1`, off: it.qty >= 20, line: true })}</div>
        <div class="row">${btn('옵션 변경', 'edit', { v: 'secondary', val: i })}${btn('삭제', 'dlg', { v: 'destructive', ic: 'trash-2', val: `del:${i}` })}</div></div></div>`).join('')}
    </div>
    <div class="cart"><div class="total"><span>총 결제금액 · ${count()}개</span><b>${won(total())}</b></div></div>
    <div class="footer">${btn('메뉴 더 담기', 'toMenu', { v: 'secondary' })}${btn('결제하기', 'toPay')}</div></div>`,

  pay: () => {
    // official logo files only (`logo` in data/payments.json); never drawn or imitated. Until then, a marked slot.
    const logo = (x) => `<span class="brand-logo">${x.logo ? `<img src="${esc(x.logo)}" alt="">` : '로고'}</span>`;
    const tile = (m) => `<button class="tile" data-act="method" data-v="${m.id}" ${m.supported ? '' : 'disabled'}>${logo(m)}<b>${esc(m.name)}</b>${m.sub && m.sub !== m.name ? `<small>${esc(m.sub)}</small>` : ''}</button>`;
    const by = (g) => DB.methods.filter((m) => m.group === g);
    const title = (ic, text, extra = '') => `<h2 class="section">${icon(ic)}${text}${extra}</h2>`;
    const c = S.coupon, off = DB.methods.filter((m) => !m.supported).map((m) => m.name);
    return `<div class="screen">${header({ back: 'review', voice: false })}${steps(2)}
    <div class="scroll pay" data-keep>
      <div class="paysum"><div><h1 class="section" tabindex="-1">결제할 금액</h1><p class="sub">${MODE[S.mode].name} · ${count()}개${c?.status === 'ok' ? ` · 주문 ${won(total())} - 쿠폰 ${won(c.discount)}` : ''}</p></div><b>${won(due())}</b></div>
      <section>${title('ticket', '할인·적립', ' <span class="tag">선택</span>')}
        <div class="tiles">${DB.benefits.map((b) => `<button class="tile" data-act="dlg" data-v="benefit:${b.id}">${logo(b)}<b>${esc(b.name)}</b></button>`).join('')}
          <button class="tile" data-act="dlg" data-v="coupon">${icon(c?.status === 'ok' ? 'circle-check' : 'ticket')}<b>${c?.status === 'ok' ? '쿠폰 적용됨' : '메가 쿠폰'}</b></button>
          <button class="tile" data-act="dlg" data-v="stamp">${icon(S.stamp ? 'circle-check' : 'stamp')}<b>${S.stamp ? '적립 번호 입력됨' : '스탬프 적립'}</b></button></div></section>
      ${due() === 0 ? feedback('success', '쿠폰으로 전액 결제돼요.', '결제 수단을 고르지 않아도 돼요.') : `
      <section>${title('credit-card', '어떻게 결제하시겠어요?')}
        ${by('카드 결제').map((m) => `<button class="tile card-pay" data-act="method" data-v="${m.id}">${icon('credit-card')}<span><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span>${icon('chevron-right')}</button>`).join('')}</section>
      <section>${title('smartphone', '휴대폰으로 결제')}<div class="tiles">${by('휴대폰으로 결제').map(tile).join('')}</div></section>
      <section>${title('gift', '상품권·선불카드')}<div class="tiles three">${by('상품권·선불카드').map(tile).join('')}</div></section>`}
      <div class="row between"><p class="sub">${off.length ? `${off.join(', ')}은 이 키오스크에서 쓸 수 없어요.` : ''}</p>${btn('직원 도움', 'dlg', { v: 'secondary', ic: 'circle-help', val: 'staff' })}</div>
    </div>${due() === 0 ? `<div class="footer">${btn('쿠폰으로 주문 완료하기', 'free')}</div>` : ''}</div>`;
  },

  guide: () => {
    const p = S.pay, m = DB.methods.find((x) => x.id === p.method);
    if (p.status === 'processing' || p.status === 'pending') return `<div class="screen"><div class="center" role="status">${icon('loader-circle', 'spin')}<h1 class="title" tabindex="-1">${p.status === 'pending' ? '결제 결과를 확인하고 있어요' : '결제 확인 중'}</h1><p>확인이 끝날 때까지 다시 결제하지 마세요.</p>${p.status === 'pending' ? btn('직원 도움 요청', 'dlg', { v: 'secondary', val: 'staff' }) : ''}</div></div>`;
    return `<div class="screen">${header({ back: 'toPay', voice: false })}${steps(2)}
    <div class="scroll pad stack" style="gap:32px" data-keep><h1 class="title" tabindex="-1">${esc(m.name)}</h1><div class="total"><span>결제할 금액</span><b>${won(due())}</b></div>
      ${p.fail ? feedback('error', '결제가 완료되지 않았어요.', `${esc(p.fail.reason)} ${esc(p.fail.solution)}`) : ''}
      <ol class="stack" style="padding-left:32px">${m.howTo.map((h) => `<li>${esc(h)}</li>`).join('')}</ol>
      <p class="sub">연습용이라 실제 결제는 되지 않고, 카드 정보를 받지 않아요.</p></div>
    <div class="footer">${btn('다른 수단 선택', 'toPay', { v: 'secondary' })}${btn(p.fail ? '다시 결제하기' : '결제하기', 'payNow')}</div></div>`;
  },

  done: () => `<div class="screen">${steps(3)}<div class="center">${icon('circle-check')}<h1 class="title" tabindex="-1">주문이 접수되었어요</h1><p>주문 번호</p><div class="order-no">${S.order.no}</div>
    <p>${MODE[S.order.mode].name} · ${won(S.order.amount)}<br>주문 번호가 호출되면 픽업대에서 받아 주세요.</p></div><div class="footer">${btn('처음으로', 'reset')}</div></div>`,
};

// ---------- dialogs (never stacked) ----------
const HELP = {
  start: [['어떻게 시작하나요?', '매장에서 먹기 또는 포장하기를 눌러 주세요.'], ['말로 주문할 수 있나요?', '음성으로 주문하기를 누르면 메뉴 선택을 말로 할 수 있어요. 결제는 화면에서 해요.']],
  menu: [['메뉴는 어떻게 담나요?', '메뉴 사진을 누르면 온도와 옵션을 고르는 화면이 열려요.'], ['잘못 담았어요', '주문 확인에서 수량을 바꾸거나 삭제할 수 있어요.']],
  option: [['꼭 골라야 하는 것은요?', '온도만 필수예요. 나머지 옵션은 그대로 두어도 돼요.']],
  review: [['메뉴를 바꾸고 싶어요', '옵션 변경 또는 삭제를 눌러 주세요.']],
  pay: [['할인이 없어요', '할인·적립은 건너뛰고 아래 결제 수단을 누르면 돼요.']],
  guide: [['결제가 안 돼요', '다른 수단 선택을 누르거나 직원에게 알려 주세요. 담은 메뉴는 그대로예요.']],
};
const close = btn('닫기', 'close', { v: 'secondary' });
const confirm = (title, body, label, act, val = '') => `<h2 tabindex="-1">${title}</h2><p>${body}</p><div class="row">${close}${btn(label, act, { v: 'destructive', val })}</div>`;
const DIALOGS = {
  help: () => `<h2 tabindex="-1">도움말</h2><div class="help">${(HELP[S.screen] || HELP.menu).map(([q, a]) => `<details><summary>${q}${icon('chevron-down')}</summary><p>${a}</p></details>`).join('')}</div><div class="row">${btn('직원 도움 요청', 'dlg', { v: 'secondary', val: 'staff' })}${btn('닫기', 'close', { v: 'secondary' })}</div>`,
  staff: () => `<h2 tabindex="-1">직원 도움</h2>${feedback('warning', '카운터의 직원에게 말씀해 주세요.', '연습용이라 호출 신호는 보내지 않아요. 담은 메뉴는 그대로예요.')}${btn('닫기', 'close', { v: 'secondary' })}`,
  lang: () => {
    return `<h2 tabindex="-1">언어</h2>
    <div class="opts" role="radiogroup" aria-label="언어">${['한국어', 'English', '日本語', '中文'].map((l, i) => `<button class="opt" role="radio" aria-checked="${!i}" ${i ? 'disabled' : ''}><span class="radio"></span>${l}${i ? ' (준비 중)' : ''}</button>`).join('')}</div>${btn('닫기', 'close', { v: 'secondary' })}`;
  },
  clear: () => confirm('담은 메뉴를 모두 삭제할까요?', '삭제하면 되돌릴 수 없어요.', '전체 삭제', 'clear'),
  del: (i) => confirm(`${esc(menu(S.cart[i].menuId).name)}을(를) 삭제할까요?`, '다른 메뉴는 그대로 있어요.', '삭제', 'del', i),
  reset: () => confirm('처음 화면으로 갈까요?', '담은 메뉴가 모두 지워져요.', '주문 종료', 'reset'),
  benefit: (id) => `<h2 tabindex="-1">${esc(DB.benefits.find((b) => b.id === id).name)}</h2>${feedback('warning', '연습용 시안이라 할인이 적용되지 않아요.', '멤버십 정보를 받지 않아요. 결제는 그대로 진행할 수 있어요.')}${btn('닫기', 'close', { v: 'secondary' })}`,
  coupon: () => `<h2 tabindex="-1">메가 쿠폰</h2><p class="sub">연습용 쿠폰 번호를 눌러 주세요.</p>
    <div class="opts">${['WELCOME10', 'DRINK1000', 'FREEAMERICANO', 'APP-ONLY'].map((c) => btn(c, 'coupon', { v: 'secondary', val: c })).join('')}</div>
    ${S.coupon?.status === 'unusable' ? feedback('error', esc(S.coupon.reason), esc(S.coupon.alternative)) : ''}
    ${S.coupon?.status === 'ok' ? feedback('success', `${esc(S.coupon.coupon.name)} 적용됨`, `${won(S.coupon.discount)} 할인`) : ''}
    ${S.coupon?.status === 'unknown' ? feedback('warning', '쿠폰을 확인하지 못했어요.', '직원에게 문의하거나 쿠폰 없이 결제해 주세요.') : ''}${btn('닫기', 'close', { v: 'secondary' })}`,
  stamp: () => `<h2 tabindex="-1">스탬프 적립</h2><p class="sub">연습용이에요. 실제 번호를 넣지 마세요. 번호는 저장하지 않아요.</p>
    <div class="input" aria-live="polite">${S.stamp || '<span class="sub">휴대폰 번호</span>'}</div>
    <div class="keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-act="key" data-v="${n}">${n}</button>`).join('')}<button data-act="key" data-v="clear">전체 지우기</button><button data-act="key" data-v="0">0</button><button data-act="key" data-v="back">한 글자 지우기</button></div>${btn('확인', 'close')}`,
  session: () => `<h2 tabindex="-1">아직 주문 중이신가요?</h2><p>계속 주문하기를 누르면 선택한 메뉴가 그대로 유지돼요.</p><p class="title" id="left">${left()}초 후 주문 내역이 초기화됩니다.</p>${btn('계속 주문하기', 'extend')}${btn('주문 종료하기', 'reset', { v: 'secondary' })}`,
};

let shown = '';
function render() {
  // scroll position survives re-renders, but a new category starts at the top
  const keep = [...document.querySelectorAll('[data-keep]')].map((e) => [e.dataset.keep, e.scrollTop]);
  const catsAt = $('.cats')?.scrollLeft || 0;
  const dlg = sess.warn ? 'session' : S.dlg;
  const [name, arg] = (dlg || '').split(':');
  $('#stage').innerHTML = SCREENS[S.screen]() + (dlg ? `<div class="scrim"><div class="dialog" role="dialog" aria-modal="true">${DIALOGS[name](arg)}</div></div>` : '');
  window.lucide?.createIcons();
  const cats = $('.cats');
  if (cats) {
    const sel = cats.querySelector('[aria-selected=true]');
    cats.scrollLeft = catsAt;
    if (sel.offsetLeft - 40 < cats.scrollLeft || sel.offsetLeft + sel.offsetWidth + 40 > cats.scrollLeft + cats.clientWidth) cats.scrollLeft = sel.offsetLeft - (cats.clientWidth - sel.offsetWidth) / 2;
  }
  const view = `${S.screen}/${dlg || ''}`;
  if (view !== shown) { shown = view; $(dlg ? '.dialog h2' : '#stage h1')?.focus({ preventScroll: true }); } // v6 8.2: move focus on screen change
  else document.querySelectorAll('[data-keep]').forEach((e, i) => { e.scrollTop = keep[i]?.[0] === e.dataset.keep ? keep[i][1] : 0; });
  syncUpDown();
}

// ---------- navigation, voice, payment ----------
const voiceOff = () => { S.voice.on = false; speechSynthesis.cancel(); };
const go = (screen) => { if (['review', 'pay', 'guide', 'done'].includes(screen)) voiceOff(); S.screen = screen; S.dlg = null; S.draft = screen === 'option' ? S.draft : null; };
const reset = () => { timers.forEach(clearTimeout); timers = []; speechSynthesis.cancel(); S = fresh(); sess.warn = 0; sess.last = Date.now(); render(); };
const openItem = (id, extra = {}) => {
  const m = menu(id);
  if (m.available === false) return;
  S.draft = { menuId: id, temp: m.temperature.length === 1 ? m.temperature[0] : null, opts: {}, qty: 1, ...extra };
  go('option');
};
const addDraft = () => {
  const { edit, more, ...it } = S.draft;
  if (needsTemp(it)) return false;
  if (edit != null) { S.cart[edit] = it; go('review'); } else { S.cart.push(it); go('menu'); }
  S.coupon = null; // cart changed -> discount must be recalculated
  return true;
};
const setVoice = (st, say, next) => {
  Object.assign(S.voice, { st, say, next });
  if (S.voice.audio) { speechSynthesis.cancel(); speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(`${say} ${next}`), { lang: 'ko-KR' })); }
};
function applyIntent(i) {
  const d = S.screen === 'option' ? S.draft : null;
  const askTemp = () => setVoice('active', '따뜻하게 드릴까요, 차갑게 드릴까요?', '말하거나 화면에서 눌러 주세요.');
  const ready = () => setVoice('active', '이렇게 담아드릴까요?', '“이걸로 담아줘”라고 말하거나 장바구니에 담기를 눌러 주세요.');
  if (i.intent === 'navigate_category') {
    S.cat = i.category; S.sub = 'all'; go('menu');
    setVoice('active', `${CATS.find((c) => c.id === i.category).name}를 보여드릴게요.`, '원하는 메뉴를 말하거나 눌러 주세요.');
  } else if (i.intent === 'select_product') {
    const m = menu(i.menuId);
    if (m.available === false) return setVoice('active', `${m.name}는 품절이에요.`, '다른 메뉴를 골라 주세요.');
    const extra = { qty: i.quantity || 1 };
    if (m.temperature.includes(i.temperature)) extra.temp = i.temperature;
    openItem(i.menuId, extra);
    needsTemp(S.draft) ? askTemp() : ready();
  } else if (i.intent === 'set_temperature' && d && menu(d.menuId).temperature.includes(i.temperature)) { d.temp = i.temperature; ready(); }
  else if (i.intent === 'set_quantity' && d) { d.qty = i.quantity; needsTemp(d) ? askTemp() : ready(); }
  else if (i.intent === 'confirm_item' && d) { if (addDraft()) setVoice('active', '장바구니에 담았어요.', '더 주문하거나 “이제 됐어”라고 말해 주세요.'); else askTemp(); }
  else if (i.intent === 'finish_selection') { if (S.cart.length) go('review'); else setVoice('active', '아직 담은 메뉴가 없어요.', '메뉴를 먼저 골라 주세요.'); }
  else if (i.intent === 'unsupported_payment') setVoice('active', '할인·적립·결제는 화면에서 직접 해 주세요.', '메뉴를 다 담았으면 주문 확인을 눌러 주세요.');
  else setVoice('error', '', '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.');
}

async function payNow() {
  const p = S.pay, mine = S;
  if (p.status !== 'idle') return; // block duplicate execution
  p.status = 'processing'; p.fail = null; p.attempt++; p.key ||= crypto.randomUUID(); render();
  const body = { method: p.method, amount: due(), key: p.key, attempt: p.attempt };
  let r;
  try { r = await (await fetch('/api/pay', { method: 'POST', body: JSON.stringify(body) })).json(); }
  catch { r = { status: 'unknown' }; }
  const settle = async (res) => {
    if (S !== mine) return;
    if (res.status === 'approved') return finish();
    if (res.status === 'failed') { p.status = 'idle'; p.fail = res; return render(); }
    p.status = 'pending'; render(); // unknown or pending: never offer to pay again
    if (res.txId) later(async () => { try { settle(await (await fetch(`/api/pay/${res.txId}`)).json()); } catch { settle(res); } }, 1000);
  };
  settle(r);
}
function finish() {
  S.order = { no: `A-${100 + Math.floor(Math.random() * 900)}`, mode: S.mode, amount: due() };
  S.cart = []; S.stamp = ''; S.coupon = null; go('done'); render();
  later(reset, RETURN_MS);
}

// ---------- actions ----------
const ACT = {
  start: (v) => { S.mode = v; go('menu'); },
  voiceOn: () => { S.voice.on = true; setVoice('listening', '', '원하시는 메뉴를 말씀해 주세요.'); if (!S.mode) S.dlg = 'ordertype'; },
  voiceOff: () => voiceOff(),
  voiceAudio: () => { S.voice.audio = !S.voice.audio; if (!S.voice.audio) speechSynthesis.cancel(); },
  cancelVoice: () => { voiceOff(); S.dlg = null; },
  say: (v) => {
    const mine = S.voice, at = seq;
    Object.assign(mine, { heard: v }); setVoice('processing', '', '');
    // stale response guard: a touch that changed the screen or draft wins (DS conflict handling)
    later(() => { if (S.voice === mine && mine.on && seq === at) applyIntent(parseIntent(v, DB.menus)); else if (mine.on) setVoice('listening', '', '원하시는 메뉴를 말씀해 주세요.'); render(); }, 700);
  },
  cat: (v) => { S.cat = v; S.sub = 'all'; },
  sub: (v) => { S.sub = v; },
  open: (v) => openItem(v),
  temp: (v) => { S.draft.temp = v; },
  more: () => { S.draft.more = !S.draft.more; },
  opt: (v) => { const [g, c] = v.split(':'); S.draft.opts[g] = c; },
  qty: (v) => { S.draft.qty += Number(v); },
  add: () => addDraft(),
  toMenu: () => go('menu'),
  review: () => go('review'),
  cq: (v) => { const [i, d] = v.split(':').map(Number); S.cart[i].qty += d; S.coupon = null; },
  edit: (v) => { S.draft = { ...S.cart[v], opts: { ...S.cart[v].opts }, edit: Number(v) }; go('option'); },
  del: (v) => { S.cart.splice(Number(v), 1); S.coupon = null; S.dlg = null; if (!S.cart.length) go('menu'); },
  clear: () => { S.cart = []; S.coupon = null; S.dlg = null; },
  toPay: () => { S.pay = { method: null, status: 'idle', fail: null, attempt: 0, key: '' }; go('pay'); },
  method: (v) => { S.pay.method = v; go('guide'); },
  payNow: () => payNow(),
  free: () => finish(),
  coupon: async (code) => {
    try { S.coupon = await (await fetch('/api/coupons/apply', { method: 'POST', body: JSON.stringify({ code, items: S.cart }) })).json(); }
    catch { S.coupon = { status: 'unknown' }; }
    render();
  },
  key: (v) => { S.stamp = v === 'clear' ? '' : v === 'back' ? S.stamp.slice(0, -1) : (S.stamp + v).slice(0, 11); },
  dlg: (v) => { S.dlg = v; },
  close: () => { S.dlg = null; },
  askReset: () => { if (S.cart.length) S.dlg = 'reset'; else reset(); },
  reset: () => reset(),
  extend: () => { sess.warn = 0; sess.last = Date.now(); },
};
// voice does not pick the order type for the customer
DIALOGS.ordertype = () => `<h2 tabindex="-1">어디에서 드시나요?</h2><div class="row">${Object.entries(MODE).map(([k, m]) => btn(m.name, 'start', { ic: m.icon, val: k })).join('')}</div>${btn('닫기', 'cancelVoice', { v: 'secondary' })}`;

addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  sess.last = Date.now();
  const act = el.dataset.act;
  if (act !== 'say') seq++;
  const { v } = el.dataset;
  // up/down buttons: move most of a screen, no re-render
  if (act === 'scroll') { const sc = $('.scroll-wrap .scroll'); return sc.scrollBy({ top: v * sc.clientHeight * 0.8, behavior: 'smooth' }); }
  ACT[act](v);
  if (act !== 'reset') render();
  if (e.detail) document.activeElement?.blur?.(); // no focus ring left behind after touch
  // keyboard / assistive input: the re-render replaced the button, so put focus back on it
  else if (document.activeElement === document.body) $(`[data-act="${act}"]${v ? `[data-v="${v}"]` : ''}`)?.focus({ preventScroll: true });
});
addEventListener('pointerdown', () => { sess.last = Date.now(); });

// ---------- product list up/down buttons ----------
// shown only when the list is longer than the screen; each end disables its button
const syncUpDown = () => {
  const sc = $('.scroll-wrap .scroll'), box = $('.updown');
  if (!sc || !box) return;
  const max = sc.scrollHeight - sc.clientHeight;
  box.hidden = max <= 1;
  const [up, down] = box.children;
  up.disabled = sc.scrollTop <= 1;
  down.disabled = sc.scrollTop >= max - 1;
};
addEventListener('scroll', (e) => { if (e.target.parentElement?.className === 'scroll-wrap') { sess.last = Date.now(); syncUpDown(); } }, true);

// ---------- category swipe ----------
// touch swipes natively; a mouse (demo in a desktop browser) needs drag-to-scroll
let drag = null;
addEventListener('pointerdown', (e) => {
  const g = e.pointerType === 'mouse' && e.target.closest('.cats');
  drag = g ? { g, x: e.clientX, from: g.scrollLeft, moved: false } : null;
});
addEventListener('pointermove', (e) => {
  if (!drag || !e.buttons) return;
  const dx = (e.clientX - drag.x) / ($('#stage').getBoundingClientRect().width / 1080); // stage is scaled
  if (Math.abs(dx) > 10) drag.moved = true;
  if (drag.moved) drag.g.scrollLeft = drag.from - dx;
});
// a drag is not a tap: swallow the click that follows it
addEventListener('click', (e) => { if (drag?.moved) { e.stopPropagation(); e.preventDefault(); } drag = null; }, true);
addEventListener('keydown', () => { sess.last = Date.now(); });

// ---------- session ----------
const left = () => Math.max(0, Math.ceil((GRACE_MS - (Date.now() - sess.warn)) / 1000));
setInterval(() => {
  const busy = S.pay.status !== 'idle' || S.voice.st === 'processing' && S.voice.on;
  if (sess.off || S.screen === 'start' || S.screen === 'done' || busy) { sess.last = Date.now(); return; }
  if (sess.warn) { if (left() === 0) return reset(); const el = $('#left'); if (el) el.textContent = `${left()}초 후 주문 내역이 초기화됩니다.`; }
  else if (Date.now() - sess.last >= IDLE_MS) { sess.warn = Date.now(); render(); }
}, 1000);

// ---------- boot ----------
const fit = () => { const k = Math.min(innerWidth / 1080, innerHeight / 1920); $('#stage').style.transform = `translate(${(innerWidth - 1080 * k) / 2}px,${(innerHeight - 1920 * k) / 2}px) scale(${k})`; };
addEventListener('resize', fit);

// ?demo=name opens a screen state directly (design review)
function demo(n) {
  if (!n) return;
  sess.off = n !== 'session';
  if (n === 'start') return;
  S.mode = 'take'; S.screen = 'menu';
  S.cart = [{ menuId: 'latte', temp: 'ICE', opts: { shot: '1' }, qty: 2 }];
  if (n === 'option') openItem('latte', { temp: 'ICE' });
  if (n === 'review') S.screen = 'review';
  if (n === 'pay') S.screen = 'pay';
  if (n === 'guide') { S.screen = 'guide'; S.pay.method = 'card'; }
  if (n === 'done') { S.order = { no: 'A-127', mode: 'take', amount: 8000 }; S.screen = 'done'; }
  if (n === 'voice') { S.voice.on = true; S.voice.heard = '아이스 아메리카노 두 잔 주세요'; applyIntent(parseIntent(S.voice.heard, DB.menus)); }
  if (n === 'session') sess.warn = Date.now();
}

(async () => {
  DB.menus = await getJSON('/api/menus', '/data/menus.json', (d) => d.menus);
  const pm = await getJSON('/api/payment-methods', '/data/payments.json', (d) => d);
  DB.methods = pm.methods; DB.benefits = pm.benefits;
  fit();
  demo(new URLSearchParams(location.search).get('demo'));
  render();
})();
