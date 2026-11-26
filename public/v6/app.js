// v2-I 시안의 흐름·모션을 디자인 시스템 v6로 옮긴 비공식 프로토타입. 가격·분류는 시연용(menu-data.json).
import { createLive } from './live-adapter.js'; // Gemini Live 음성 주문 연결부 (AI 코드는 live-adapter.js·../live-client.js·서버 lib/에 있다)
const IMG = 'https://ik.imagekit.io/siney0051/%EB%A9%94%EA%B0%80%EC%BB%A4%ED%94%BC_%ED%82%A4%EC%98%A4%EC%8A%A4%ED%81%AC_IMG/mega_kiosk/';
const { categories: CATS, recommended, products } = await (await fetch('menu-data.json')).json();
const P = Object.fromEntries(products.map((p) => [p.id, p]));
const REC = recommended.map((n) => products.find((p) => p.name === n)).filter(Boolean);
const IDLE_MS = 120000, GRACE_S = 60;
const IDLE_COPY = '2분 동안 조작이 없으면 종료 안내가 표시돼요.';

const tagged = (...t) => [{ n: '전체' }, ...t.map(([n, tag]) => ({ n, f: (p) => p.tags.includes(tag || n) }))];
const SUBS = [
  tagged(['콜라보 메뉴', 'c0:콜라보']),
  [{ n: '전체' }, { n: '커피', f: (p) => p.coffee }, { n: '음료', f: (p) => p.kind === 'd' && !p.coffee }, { n: '푸드', f: (p) => p.kind === 'f' }],
  tagged(['에스프레소', 'c2:에스프레소'], ['라떼', 'c2:라떼'], ['콜드브루', 'c2:콜드브루']),
  [{ n: '전체' }], // 디카페인: HOT/ICE는 상품 옵션 화면에서 고른다
  tagged(['라떼·밀크', 'c4:라떼·밀크'], ['스무디·프라페', 'c4:스무디·프라페'], ['주스·에이드', 'c4:주스·에이드'], ['기타 음료', 'c4:기타 음료']),
  tagged(['과일차', 'c5:과일차'], ['허브·블렌딩 티', 'c5:허브·블렌딩 티'], ['아이스티', 'c5:아이스티']),
  tagged(['베이커리', 'c6:베이커리'], ['디저트', 'c6:디저트'], ['샌드위치·간식', 'c6:샌드위치·간식']),
  tagged(['굿즈', 'c7:굿즈'], ['콜라보 상품', 'c7:콜라보 상품']),
];
const ORBIT = ['d005', 'd107', 'd100', 'd052', 'd129', 'd156', 'f036', 'd111']; // CATS 순서
const UTT = { recommend: '메뉴 추천해 줘', decaf: '디카페인 보여줘', newm: '새로 나온 메뉴 있어?', ice2: '아이스 아메리카노 두 잔 주세요', latte: '카페라떼 주세요', pay: '결제해 줘', done: '이제 됐어', fail: '(잡음) 인식 실패 시연', hot: '따뜻하게 주세요', shot: '샷 하나 추가해 줘', two: '두 잔 주세요', add: '이걸로 담아줘' };

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const won = (n) => n.toLocaleString('ko-KR') + '원';
const icon = (n) => `<i data-lucide="${n}"></i>`;
const icons = () => window.lucide?.createIcons();
const src = (p, temp) => { const f = p.images[temp] || p.images.ICE || p.images.HOT || p.images.one; return `${IMG}${f.split('_')[0]}/${f}`; };
const pic = (p, temp, cls = '') => `<img class="mult ${cls}" src="${src(p, temp)}" alt="">`;
// 옵션: { shot: 1, syrup: 1 } — 값은 고른 항목의 순번, 0(기본)은 저장하지 않는다
const chosen = (id, opts) => P[id].options.filter((g) => opts[g.id]).map((g) => ({ group: g, choice: g.choices.find((c) => +c.id === opts[g.id]) }));
const unit = (id, temp, opts = {}) => P[id].sample_price[temp || (P[id].temps.length ? dtemp(P[id]) : 'one')] + chosen(id, opts).reduce((a, o) => a + o.choice.price, 0);
const dtemp = (p) => (p.temps.includes('HOT') ? 'HOT' : p.temps[0] || null);

const stage = $('#stage'), screen = $('#screen'), voiceEl = $('#voice'), fx = $('#fx'), dlg = $('#dlg');
let S, timers = [], rotate, idle, orderNo = 126;
const fresh = () => ({ screen: '', cat: 2, sub: 0, items: [], opt: null, type: '', stamp: false, method: null, key: '', attempt: 0, uid: 0, voice: null });
const later = (fn, ms) => timers.push(setTimeout(fn, ms));
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; clearInterval(rotate); };
const total = () => S.items.reduce((a, i) => a + i.unit * i.qty, 0);
const count = () => S.items.reduce((a, i) => a + i.qty, 0);
const itemName = (i) => {
  const extra = [i.temp, ...chosen(i.pid, i.opts).map(({ group, choice }) => (group.id === 'ice' ? `얼음 ${choice.label}` : choice.label))].filter(Boolean);
  return P[i.pid].name + (extra.length ? ` (${extra.join(' · ')})` : '');
};

const logo = '<img class="logo" src="logo.svg" alt="메가MGC커피">';
const voiceBtn = () => `<button class="btn ${S.voice ? 'btn-secondary' : 'btn-voice'}" data-a="voice" id="vbtn">${icon('mic')}${S.voice ? '음성 종료' : '음성 주문'}</button>`;
const header = (back = 'home') => `<header class="hdr">${back === 'home'
  ? `<button class="btn btn-text" data-a="home">${icon('house')}처음으로</button>`
  : `<button class="btn btn-text" data-a="menu">${icon('chevron-left')}메뉴로</button>`}${logo}${voiceBtn()}</header>`;
const steps = (cur) => `<ol class="steps">${['메뉴 선택', '주문 확인', '할인·적립', '결제', '주문 완료']
  .map((n, i) => `<li class="${i < cur ? 'past' : i === cur ? 'now' : ''}" ${i === cur ? 'aria-current="step"' : ''}>${n}</li>`).join('')}</ol>`;
const cupPath = 'M18 14h84l-10 108q-1 10-11 10H39q-10 0-11-10z';
const cupSvg = (id, w, h, stroke, inner) => `<svg viewBox="0 0 120 140" width="${w}" height="${h}" aria-hidden="true"><defs><clipPath id="${id}"><path d="${cupPath}"/></clipPath></defs><g clip-path="url(#${id})">${inner}</g><path d="${cupPath}" fill="none" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"/><rect x="8" y="4" width="104" height="14" rx="4" fill="${stroke}"/></svg>`;
const wavePath = (fill, cls) => `<path class="${cls}" d="M-120 0q30-14 60 0t60 0t60 0t60 0t60 0t60 0V240H-120z" fill="${fill}"/>`;

// 공식 로고 파일이 있는 항목만 이미지로 보여준다. 결제사 로고는 그리지 않고 기능 아이콘으로 대신한다.
// 로고를 받으면 LOGOS에 'id: 경로'를 추가하면 된다.
const LOGOS = { cjgift: 'pay/cjgift.png', cjone: 'pay/cjone.png', daangn: 'pay/daangn.webp', hana: 'pay/hana.png', kakao: 'pay/kakao.png', kbpay: 'pay/kbpay.png', kia: 'pay/kia.png', kt: 'pay/kt.png', mpoint: 'pay/mpoint.png', naver: 'pay/naver.png', paybook: 'pay/paybook.png', payco: 'pay/payco.png', sol: 'pay/sol.png', tmem: 'pay/tmem.png', uju: 'pay/uju.png', zero: 'pay/zero.png', megacoupon: 'pay/mega.png', prepaid: 'pay/mega.png' };
const WHITE_LOGOS = ['cjone', 'uju']; // 흰색 로고는 색을 바꾸지 않고 검은 바탕에 올린다
const PAY_ICONS = { card: 'credit-card', appcard: 'qr-code', mobilegift: 'gift', cjgift: 'gift', cash: 'banknote', mpoint: 'coins', stamp: 'stamp', kt: 'ticket-percent', tmem: 'ticket-percent', cjone: 'coins', kia: 'ticket-percent', uju: 'ticket-percent' };
const PAY_LABEL = { card: ['카드 결제', '삼성페이'], appcard: ['앱카드', 'QR·바코드'], mobilegift: ['모바일 상품권', '교환권·금액권'] };
const mark = (id) => `<span class="mark${LOGOS[id] ? ' has-logo' : ''}${WHITE_LOGOS.includes(id) ? ' dark' : ''}">${LOGOS[id] ? `<img src="${LOGOS[id]}" alt="">` : icon(PAY_ICONS[id] || 'smartphone')}</span>`;

// 고른 만큼 컵이 차오른다
const SHOT_CUP = 'M8 8h44l-5 56q-.5 6-6 6H19q-5.5 0-6-6z';
const shotCups = (n) => Array.from({ length: n }, () => `<svg class="shot-cup" viewBox="0 0 60 80" width="36" height="48" aria-hidden="true"><clipPath id="shotClip"><path d="${SHOT_CUP}"/></clipPath><g clip-path="url(#shotClip)"><rect x="0" y="8" width="60" height="70" fill="#6B4226"/></g><path d="${SHOT_CUP}" fill="none" stroke="#575757" stroke-width="4" stroke-linejoin="round"/></svg>`).join('');

/* ---------- screens ---------- */
const VIEWS = {
  start() {
    const nodes = CATS.map((n, i) => {
      const a = -90 + (i - 2) * 45;
      return `<div class="sat" style="transform:rotate(${a}deg) translateX(385px) rotate(${-a}deg)"><div><button class="node" data-a="cat" data-v="${i}">${pic(P[ORBIT[i]], 'ICE')}${n}</button></div></div>`;
    }).join('');
    return `<section class="scr start" aria-label="주문 시작">
      <header class="hdr"><span></span>${logo}<button class="btn btn-text" disabled title="준비 중">${icon('globe')}언어</button></header>
      <h1>오늘의 한 잔,<br><span>골라 볼까요?</span></h1>
      <div class="disc" style="left:20px;top:400px;width:1040px;height:1040px;background:rgba(255,255,255,.45)"></div>
      <svg class="ring" width="800" height="800" viewBox="0 0 800 800" aria-hidden="true"><circle cx="400" cy="400" r="385" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 14" stroke-linecap="round"/></svg>
      <div class="disc" style="left:280px;top:660px;width:520px;height:520px;background:#fff"></div>
      <button class="center" data-a="center"><span class="imgs">${ORBIT.map((id) => pic(P[id], 'ICE')).join('')}</span><b></b><strong></strong></button>
      <div class="orbit">${nodes}</div>
      <button class="btn-voice voice-cta" data-a="startVoice"><span class="mic pulse">${icon('mic')}</span><span class="txt"><b>음성으로 주문하기</b><small>“아이스 아메리카노 두 잔 주세요”</small></span>
        <span class="bars live" aria-hidden="true">${[30, 59, 38, 67, 46, 75, 54].map((h, i) => `<i style="height:${h}px;animation-delay:${i * 110}ms"></i>`).join('')}</span></button>
      <p class="notice">UXPRESSO · 메가MGC커피 공식 프로젝트가 아닌 비공식 UX 개선 프로토타입 · 가격은 시연용</p>
    </section>`;
  },
  menu() {
    return `<section class="scr" aria-label="메뉴 선택">${header()}
      <div class="menu-body">
        <nav class="rail" role="tablist" aria-label="카테고리">${CATS.map((n, i) => `<button role="tab" data-a="selCat" data-v="${i}">${n}</button>`).join('')}</nav>
        <div class="menu-main"><div class="subs" role="tablist" aria-label="서브 메뉴"></div><div class="scroll" id="grid"></div></div>
      </div>
      <footer class="cart">
        <div class="session"><p role="status">${IDLE_COPY}</p><button class="btn btn-secondary" data-a="extend">시간 연장</button></div>
        <div class="summary-row">
          <div class="info">
            <div class="cart-title">${icon('shopping-cart')}<b>장바구니</b><span class="count"></span><span class="added" role="status"></span></div>
            <div class="products"></div>
            <p class="amount"><span>주문금액</span><strong></strong></p>
          </div>
          <div class="acts"><button class="btn btn-primary" data-a="review">주문 확인</button><button class="btn btn-destructive" data-a="askClear">전체 삭제</button></div>
        </div>
      </footer></section>`;
  },
  opt() {
    const p = P[S.opt.pid];
    const head = (title, g) => `<div><div class="label"><h2>${title}</h2><span class="badge${g.required ? '' : ' opt'}">${g.required ? '필수' : '선택'}</span></div>${g.help ? `<p class="cap">${g.help}</p>` : ''}</div>`;
    const temps = p.temps.length ? `<div class="group">${head('온도', { required: true, help: p.temps.length === 1 ? `${p.temps[0] === 'ICE' ? '차갑게' : '따뜻하게'}만 주문할 수 있어요.` : '' })}
      <div class="temp" role="radiogroup" aria-label="온도"><span class="thumb" aria-hidden="true"></span>${['HOT', 'ICE'].map((t) => `<button role="radio" data-a="temp" data-v="${t}" ${p.temps.includes(t) ? '' : 'disabled'}><b>${t}</b>${t === 'HOT' ? '따뜻하게' : '차갑게'}</button>`).join('')}</div></div>` : '';
    // 샷은 컵을 눌러 채운다. 같은 컵을 다시 누르면 하나 줄어든다.
    const groups = p.options.map((g) => {
      const shot = g.id === 'shot';
      const buttons = shot
        ? g.choices.filter((c) => +c.id).map((c) => `<button class="cup-btn" data-a="shot" data-v="${c.id}" aria-label="${c.label}">${shotCups(1)}<span>+${won(c.price)}</span></button>`).join('')
        : g.choices.map((c) => `<button role="radio" data-a="option" data-g="${g.id}" data-v="${c.id}">${c.label}${c.price ? ` +${won(c.price)}` : ''}</button>`).join('');
      return `<div class="group line" ${g.onlyTemp ? `data-only="${g.onlyTemp}"` : ''}>${head(shot ? '샷 추가' : g.label, shot ? { required: g.required, help: '컵을 눌러 에스프레소 샷을 채워요.' } : g)}
        <div class="picks" ${shot ? 'role="group"' : 'role="radiogroup"'} aria-label="${g.label}">${buttons}</div></div>`;
    }).join('');
    return `<section class="scr" aria-label="옵션 선택">${header('menu')}
      <div class="hero">
        <div class="hero-top"><div><h1>${p.name}</h1><button class="btn btn-text" data-a="more" aria-expanded="false" aria-controls="more"><span>자세히 보기</span>${icon('chevron-down')}</button></div><strong class="price-tag" id="unit"></strong></div>
        <img class="mult" id="optImg" alt="${p.name}">
        <div id="more" hidden></div>
      </div>
      <div class="sheet">${temps}${groups}
        <div class="group line"><h2>수량</h2><div class="stepper"><button class="icon-btn" data-a="qty" data-v="-1" aria-label="수량 줄이기">${icon('minus')}</button><output></output><button class="icon-btn" data-a="qty" data-v="1" aria-label="수량 늘리기">${icon('plus')}</button></div></div>
        <p class="hint" role="status"></p>
        <button class="btn btn-primary cta" data-a="add" id="addBtn"></button>
      </div></section>`;
  },
  review() {
    return `<section class="scr" aria-label="주문 확인">${steps(1)}
      <div class="bar-top"><button class="btn btn-secondary" data-a="menu">${icon('chevron-left')}메뉴 더 담기</button><button class="btn btn-text" data-a="home">${icon('house')}처음으로</button></div>
      <div class="title"><h1>주문서</h1><p class="cap">직접 확인해 주세요</p></div>
      <div class="receipt-clip"><div class="receipt"><h2>UXPRESSO ORDER</h2><div class="rows">${rows(true)}</div><div class="total"></div></div></div>
      <div class="where"><h2>어디에서 드시나요?</h2><div class="tiles2">
        <button data-a="type" data-v="매장에서 먹기">${icon('utensils')}매장에서 먹기</button><button data-a="type" data-v="포장하기">${icon('shopping-bag')}포장하기</button></div>
        <p class="cap">누르면 할인·적립·결제로 넘어가요.</p></div></section>`;
  },
  pay() {
    const by = Object.fromEntries(methods.map((m) => [m.id, m]));
    const tile = (id, cls = '') => {
      const m = by[id];
      if (!m) return '';
      return `<button class="tile ${cls}" data-a="pay" data-v="${id}" ${m.supported ? '' : 'disabled'}>${mark(id)}<span>${PAY_LABEL[id]?.[0] || m.name}</span>${PAY_LABEL[id]?.[1] ? `<small>${PAY_LABEL[id][1]}</small>` : ''}${m.supported ? '' : '<small>사용할 수 없어요</small>'}</button>`;
    };
    const off = (id, name, cls = '') => `<button class="tile ${cls}" disabled>${mark(id)}<span>${name}</span></button>`;
    return `<section class="scr" aria-label="할인과 결제">${steps(2)}
      <div class="bar-top"><button class="btn btn-secondary" data-a="review">${icon('chevron-left')}주문서로</button><span class="cap">${S.type}</span></div>
      <div class="pay-list">
        <div class="step-title"><span class="badge">STEP 1</span><h2>할인·적립을 선택해 주세요</h2></div>
        <div class="discounts">
          <button class="tile wide" data-a="stampOpen">${mark('stamp')}<span>스탬프 적립</span>${S.stamp ? '<span class="stamp">적용됨</span>' : ''}</button>
          ${off('kt', 'KT 멤버십', 'wide')}${off('tmem', 'T 멤버십', 'wide')}${off('cjone', 'CJ ONE 포인트', 'wide')}
          ${off('kia', '기아멤버스', 'wide')}${off('uju', 'SKT 우주패스', 'wide')}${off('megacoupon', '메가쿠폰', 'wide')}
        </div>
        <p class="cap">지금은 스탬프 적립만 쓸 수 있어요. 할인이 없으면 아래에서 바로 결제해요.</p>
        <div class="step-title"><span class="badge">STEP 2</span><h2>결제 수단을 선택해 주세요</h2></div>
        <div class="methods">
          ${tile('card', 'big')}${tile('appcard', 'big')}<span></span>
          ${['kakao', 'payco', 'naver', 'zero', 'paybook', 'hana', 'kbpay', 'sol', 'daangn', 'alipay', 'mobilegift', 'prepaid', 'cjgift'].map((id) => tile(id)).join('')}
          ${off('mpoint', '현대 M포인트')}${tile('cash')}
        </div>
        ${methods.length ? '' : '<p class="empty">결제 수단을 불러오지 못했어요.<br>직원에게 알려 주세요.</p>'}
      </div>
      <div class="paybar"><div><span>주문금액</span><b>${won(total())}</b></div><div><span>결제할 금액</span><strong>${won(total())}</strong></div></div></section>`;
  },
  proc() {
    return `<section class="scr proc" aria-label="결제 처리" aria-live="polite">
      <svg viewBox="0 -70 120 215" width="300" height="538" aria-hidden="true"><defs><clipPath id="cupPay"><path d="${cupPath}"/></clipPath></defs>
        <rect x="48" y="-70" width="24" height="24" rx="4" fill="#231F20"/><line class="flow" x1="60" y1="-46" x2="60" y2="118" stroke="#6B4226" stroke-width="7" stroke-linecap="round" stroke-dasharray="14 10"/>
        <g clip-path="url(#cupPay)"><g class="liqrise">${wavePath('#F8DA29', 'wave')}</g></g>
        <path d="${cupPath}" fill="none" stroke="#231F20" stroke-width="4" stroke-linejoin="round"/><rect x="8" y="4" width="104" height="14" rx="4" fill="#231F20"/></svg>
      <div><h1>결제 확인 중</h1><p><b>${S.method.name}</b> · ${won(total())}</p><p class="cap">화면의 안내에 따라 결제해 주세요.<br>확인이 끝날 때까지 다시 결제하지 마세요.</p></div>
      <p class="notice">모의 결제예요. 실제로 결제되지 않아요.</p></section>`;
  },
  done() {
    return `<section class="scr done" aria-label="주문 완료">
      <div class="check"><svg width="86" height="86" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></div>
      <h1>주문이 접수됐어요</h1><p>주문번호</p><div class="num">A-${orderNo}</div>
      <div class="summary">${S.items.map((i) => `<div><span>${itemName(i)}</span><b>${i.qty}개</b></div>`).join('')}<hr><div><span>${S.type} · ${S.method.name}</span><b>${won(total())}</b></div></div>
      <p style="margin-top:32px">주문번호가 화면에 나오면 받아 가 주세요.</p>
      <div class="receipts"><h2>영수증이 필요하세요?</h2><div class="pair2"><button class="btn btn-secondary" data-a="receipt" data-v="영수증을 출력하고 있어요.">${icon('printer')}영수증 발행</button><button class="btn btn-secondary" data-a="receipt" data-v="영수증 없이 마무리했어요.">영수증 미발행</button></div><p id="rmsg" role="status">&nbsp;</p></div>
      <button class="btn btn-primary btn-home" data-a="reset">처음으로</button><div class="shrink"></div></section>`;
  },
};

function rows(enter) {
  if (!S.items.length) return '<p class="empty">담은 메뉴가 없어요.<br>메뉴를 더 담아 주세요.</p>';
  return S.items.map((i, n) => `<div class="item ${enter ? 'enter' : ''}" style="animation-delay:${300 + n * 100}ms">${pic(P[i.pid], i.temp)}
    <div class="info"><b>${itemName(i)}</b><strong>${won(i.unit * i.qty)}</strong></div>
    <div class="stepper"><button class="icon-btn" data-a="rowQty" data-v="-1" data-id="${i.id}" aria-label="수량 줄이기" ${i.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button><output>${i.qty}</output><button class="icon-btn" data-a="rowQty" data-v="1" data-id="${i.id}" aria-label="수량 늘리기" ${i.qty >= 9 ? 'disabled' : ''}>${icon('plus')}</button></div>
    <button class="btn btn-destructive" data-a="del" data-id="${i.id}" aria-label="${itemName(i)} 삭제">${icon('trash-2')}</button></div>`).join('');
}

/* ---------- 부분 갱신: DOM을 유지해야 CSS 전환이 이어진다 ---------- */
function syncMenu() {
  $$('.rail button').forEach((b, i) => b.setAttribute('aria-selected', i === S.cat));
  $('.subs').innerHTML = SUBS[S.cat].map((s, i) => `<button role="tab" data-a="selSub" data-v="${i}" aria-selected="${i === S.sub}">${s.n}</button>`).join('');
  const sub = SUBS[S.cat][S.sub];
  const list = (S.cat === 1 ? REC : products.filter((p) => p.categories.includes(S.cat))).filter(sub.f || (() => true));
  $('#grid').innerHTML = list.length ? `<div class="grid">${list.map((p) => {
    const t = dtemp(p);
    return `<button class="card" data-a="open" data-v="${p.id}"><span class="shot-bg">${pic(p, t)}</span>${p.badge ? `<span class="badge">${p.badge}</span>` : ''}<b>${p.name}</b><strong>${won(unit(p.id, t))}</strong></button>`;
  }).join('')}</div>` : '<p class="empty">이 분류는 준비 중이에요.<br>다른 메뉴를 골라 주세요.</p>';
  $('#grid').scrollTop = 0;
  syncCart();
}
function syncCart() {
  const n = count();
  const kinds = [...new Map(S.items.map((i) => [i.pid, i])).values()]; // 상품 종류 (온도·옵션이 달라도 1종)
  const name = kinds.length && P[kinds[0].pid].name;
  const text = !n ? '아직 담은 메뉴가 없어요.' : kinds.length > 1 ? `${name} 외 ${kinds.length - 1}종` : `${name} ${n}개`;
  $('.cart .count').textContent = `· 총 ${n}개`;
  $('.cart .products').innerHTML = `${kinds.slice(0, 3).map((i) => `<span class="thumb-img">${pic(P[i.pid], i.temp)}</span>`).join('')}<p>${text}</p>`;
  $('.cart .amount strong').textContent = won(total());
  $('.cart .btn-primary').disabled = !n;
  $('.cart .btn-destructive').style.visibility = n ? 'visible' : 'hidden'; // 자리를 유지해 레이아웃이 움직이지 않게
}
function syncOpt() {
  const o = S.opt, p = P[o.pid];
  const temp = o.temp || dtemp(p);
  for (const g of p.options) if (g.onlyTemp && o.temp !== g.onlyTemp) delete o.opts[g.id];
  $('#unit').textContent = won(unit(o.pid, o.temp));
  $('#optImg').src = src(p, temp);
  $$('.temp button').forEach((b) => b.setAttribute('aria-checked', b.dataset.v === o.temp));
  const thumb = $('.temp .thumb'); // 처음엔 제자리에 나타나고, 바꿀 때만 미끄러진다
  if (thumb) {
    thumb.classList.toggle('right', o.temp === 'ICE');
    void thumb.offsetWidth;
    thumb.classList.toggle('on', !!o.temp);
  }
  $$('.cup-btn').forEach((b) => b.setAttribute('aria-pressed', (o.opts.shot || 0) >= +b.dataset.v));
  $$('.group[data-only]').forEach((g) => { g.hidden = g.dataset.only !== o.temp; });
  $$('[data-a=option]').forEach((b) => b.setAttribute('aria-checked', (o.opts[b.dataset.g] || 0) === +b.dataset.v));
  $('.stepper output').textContent = o.qty;
  $('[data-a=qty][data-v="-1"]').disabled = o.qty <= 1;
  $('[data-a=qty][data-v="1"]').disabled = o.qty >= 9;
  const need = p.temps.length && !o.temp;
  $('.sheet .hint').textContent = need ? '온도를 선택하면 장바구니에 담을 수 있어요.' : '';
  $('#addBtn').disabled = need;
  $('#addBtn').textContent = `${won(unit(o.pid, o.temp, o.opts) * o.qty)} · 담기`;
  // 영양 정보는 확인된 값만 보여준다
  const info = p.info[temp] || p.info.one || Object.values(p.info)[0];
  const date = p.info_source.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  $('#more').innerHTML = `<p>${p.description}</p>${info ? `${info.volume || info.kcal ? `<p>${[info.volume && `용량 ${info.volume}`, info.kcal && `열량 ${info.kcal}`].filter(Boolean).join(' · ')}</p>` : ''}
    <p><b>알레르기</b> ${info.allergens || '확인되지 않았어요'}</p><ul>${(info.nutrition || []).map((n) => `<li>${n}</li>`).join('')}</ul>` : '<p>영양·알레르기 정보는 확인되지 않았어요.</p>'}
    <p class="cap">알레르기가 있으면 주문 전에 직원에게 꼭 확인해 주세요.${date ? ` 메가MGC커피 홈페이지 기준(${date})이에요.` : ''}</p>`;
}
function syncReview(redraw) {
  if (redraw) $('.rows').innerHTML = rows(false);
  $('.total').innerHTML = `<span>총 ${count()}개</span><strong>${won(total())}</strong>`;
  $$('.tiles2 button').forEach((b) => { b.disabled = !S.items.length; });
  icons();
}

function show(name) {
  clearTimers();
  S.screen = name;
  if (!['menu', 'opt'].includes(name)) { S.voice = null; live?.stop(); } // 주문 확인부터 마이크를 끈다
  screen.innerHTML = VIEWS[name]();
  if (name === 'menu') syncMenu();
  if (name === 'opt') syncOpt();
  if (name === 'review') syncReview();
  if (name === 'start') orbitTick();
  if (name === 'done') later(reset, 20000);
  renderVoice();
  icons();
  const h = $('h1', screen);
  if (h) { h.tabIndex = -1; h.focus({ preventScroll: true, focusVisible: false }); }
}
function orbitTick() {
  let act = 2;
  const imgs = $$('.center img'), name = $('.center b'), price = $('.center strong');
  const draw = () => {
    const p = P[ORBIT[act]];
    imgs.forEach((im, i) => im.classList.toggle('on', i === act));
    name.textContent = p.name;
    price.textContent = won(unit(p.id, p.temps.includes('ICE') ? 'ICE' : dtemp(p)));
    $('.center').dataset.v = p.id;
  };
  draw();
  rotate = setInterval(() => { act = (act + 1) % ORBIT.length; draw(); }, 3200);
}
// 컵이 차오르는 전환
function nav(name) {
  fx.innerHTML = `<div class="wipe">${cupSvg('cupWipe', 220, 256, '#231F20', `<g class="liq">${wavePath('#231F20', 'wave')}</g>`)}</div>`;
  setTimeout(() => show(name), 400);
  setTimeout(() => { $('.wipe', fx)?.remove(); }, 860);
}
function reset() { dlg.close(); S = fresh(); armIdle(); nav('start'); }

/* ---------- 주문 ---------- */
// 온도가 둘이면 직접 고르게 비워 둔다
function openOpt(pid, extra = {}) { S.opt = { pid, temp: P[pid].temps.length === 1 ? P[pid].temps[0] : null, qty: 1, opts: {}, ...extra }; show('opt'); }
function add({ pid, temp, qty, opts = {} }) {
  const same = S.items.find((i) => i.pid === pid && i.temp === temp && JSON.stringify(chosen(i.pid, i.opts)) === JSON.stringify(chosen(pid, opts)));
  if (same) same.qty = Math.min(9, same.qty + qty);
  else S.items.push({ id: ++S.uid, pid, temp, opts: { ...opts }, qty, unit: unit(pid, temp, opts) });
  if (S.screen === 'menu') syncCart(); else show('menu');
  fx.insertAdjacentHTML('beforeend', pic(P[pid], temp, 'fly'));
  const el = fx.lastElementChild;
  setTimeout(() => el.remove(), 920);
  const cartIcon = $('.cart-title svg');
  cartIcon?.classList.remove('bump'); void cartIcon?.getBoundingClientRect(); cartIcon?.classList.add('bump');
  const added = $('.cart .added');
  added.textContent = '장바구니에 담았어요.';
  later(() => { added.textContent = ''; }, 2000);
}

/* ---------- 모의 결제 (/api/pay, 같은 key는 중복 결제되지 않음) ---------- */
let methods = [];
fetch('/api/payment-methods').then((r) => r.json()).catch(() => fetch('/data/payments.json').then((r) => r.json()))
  .then((d) => { methods = d.methods; }).catch(() => {});

async function pay(id) {
  S.method = methods.find((m) => m.id === id);
  S.key ||= crypto.randomUUID();
  S.attempt += 1;
  show('proc');
  const started = Date.now();
  try {
    let r = await (await fetch('/api/pay', { method: 'POST', body: JSON.stringify({ method: id, amount: total(), key: S.key, attempt: S.attempt }) })).json();
    while (r.status === 'pending') {
      await new Promise((ok) => setTimeout(ok, 1000));
      r = await (await fetch(`/api/pay/${r.txId}`)).json();
    }
    await new Promise((ok) => setTimeout(ok, Math.max(0, 3200 - (Date.now() - started)))); // 컵 모션이 끝날 시간
    if (r.status === 'approved') { orderNo += 1; return nav('done'); }
    failDialog(r.reason || '결제가 완료되지 않았어요.', r.solution || '결제 수단을 확인한 후 다시 시도해 주세요.');
  } catch {
    // 결과 불명: 같은 key를 유지해 중복 결제를 막고, 자동 초기화도 하지 않는다
    S.unknown = true;
    failDialog('결제 결과를 확인하지 못했어요.', '직원에게 알려 주세요. 담은 메뉴는 그대로예요.');
  }
}
function failDialog(reason, solution) {
  show('pay');
  open(`<h2>${icon('circle-alert')} ${reason}</h2><p>${solution}</p><div class="pair"><button class="btn btn-secondary" data-a="close">다른 결제 수단</button><button class="btn btn-primary" data-a="pay" data-v="${S.method.id}">다시 시도하기</button></div>`);
}

/* ---------- 대화상자 ---------- */
// 열려 있는 동안 뒤 화면은 누를 수 없다 (바깥 터치로는 닫히지도 실행되지도 않는다)
function open(html) { dlg.innerHTML = html; if (!dlg.open) dlg.show(); screen.inert = voiceEl.inert = true; icons(); }
dlg.addEventListener('close', () => { if (!dlg.open) screen.inert = voiceEl.inert = false; });
let phone = '';
function stampDialog() {
  const shown = phone ? phone.replace(/(\d{3})(\d{0,4})(\d{0,4})/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-')) : '휴대폰 번호를 눌러 주세요';
  open(`<h2>스탬프 적립</h2><p class="cap">시연용이에요. 번호는 저장하지 않아요.</p><div class="field" role="status">${shown}</div>
    <div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '전체 지우기', '0', '한 글자 지우기'].map((k) => `<button data-a="key" data-v="${k}">${k}</button>`).join('')}</div>
    <div class="pair"><button class="btn btn-secondary" data-a="close">취소</button><button class="btn btn-primary" data-a="stamp" ${phone.length < 10 ? 'disabled' : ''}>적립하기</button></div>`);
}

/* ---------- 음성 (모의 입력) ---------- */
const V = (o) => { S.voice = { status: 'listening', said: '', reply: '', next: '', pending: null, ...S.voice, ...o }; renderVoice(); };
const NEXT = '원하는 메뉴를 말하거나 눌러 주세요.';
function endVoice() { live?.stop(); S.voice = null; renderVoice(); }
function renderVoice() {
  const v = S.voice, b = $('#vbtn');
  if (b) { b.className = `btn ${v ? 'btn-secondary' : 'btn-voice'}`; b.innerHTML = `${icon('mic')}${v ? '음성 종료' : '음성 주문'}`; }
  voiceEl.hidden = !v;
  if (!v) { voiceEl.innerHTML = ''; return icons(); }
  voiceEl.classList.toggle('low', S.screen === 'opt');
  const title = { listening: '듣고 있어요.', processing: '확인하고 있어요.', confirming: '이 메뉴가 맞나요?', asking: '알려 주세요.', success: '담았어요!', speaking: '답하고 있어요.', error: v.live === 'off' && v.reply ? '음성 주문을 쓸 수 없어요.' : '잘 듣지 못했어요.' }[v.status] || '화면을 확인해 주세요.';
  const live = ['listening', 'processing'].includes(v.status);
  const p = v.pending && P[v.pending.pid];
  voiceEl.innerHTML = `<div class="head"><span class="mic ${live ? 'pulse' : ''}">${icon('mic')}</span><b aria-live="polite">${title}</b>
      <span class="bars ${live ? 'live' : ''}" aria-hidden="true">${[30, 45, 60, 37, 52, 33, 48, 56, 40].map((h, i) => `<i style="height:${h}px;animation-delay:${i * 100}ms"></i>`).join('')}</span>
      <button class="btn btn-secondary" data-a="endVoice" style="color:var(--black)">종료</button></div>
    ${v.said ? `<div><p class="cap">말씀하신 내용</p><p class="said">“${v.said}”</p></div>` : ''}
    ${v.reply ? `<div><p class="reply">${v.reply}</p><p class="cap">${v.next}</p></div>` : ''}
    ${v.status === 'confirming' && p ? `<div class="pending">${pic(p, v.pending.temp)}<div><b>${p.name}</b><p class="cap" style="color:var(--gray-70)">${v.pending.temp === 'HOT' ? 'HOT 따뜻하게' : 'ICE 차갑게'} · ${v.pending.qty}잔</p><strong>${won(unit(p.id, v.pending.temp) * v.pending.qty)}</strong></div>
      <button class="btn btn-secondary" data-a="editPending">수정</button><button class="btn btn-primary" data-a="confirmPending" style="height:88px">담기</button></div>` : ''}
    ${v.status === 'asking' ? '<div class="pair"><button class="btn btn-secondary" style="color:var(--black)" data-a="askTemp" data-v="HOT">HOT 따뜻하게</button><button class="btn btn-secondary" style="color:var(--black)" data-a="askTemp" data-v="ICE">ICE 차갑게</button></div>' : ''}
    ${v.status === 'error' ? `<div class="pair">${v.noRetry ? '' : '<button class="btn btn-primary" style="height:88px" data-a="retry">다시 말하기</button>'}<button class="btn ${v.noRetry ? 'btn-primary' : 'btn-secondary'}" ${v.noRetry ? 'style="height:88px"' : 'style="color:var(--black)"'} data-a="endVoice">화면에서 선택하기</button></div>` : ''}`;
  icons();
}
function say(k) {
  V({ status: 'processing', said: UTT[k], reply: '', next: '', pending: null });
  const session = S.voice;
  later(() => { if (S.voice === session) resolve(k); }, 1300);
}
function resolve(k) {
  const o = S.opt, reply = (r, n = NEXT) => V({ status: 'responding', reply: r, next: n });
  const toCat = (c, r) => { selCat(c); reply(r); };
  if (k === 'recommend') return toCat(1, '추천 메뉴를 보여드릴게요.');
  if (k === 'decaf') return toCat(3, '디카페인 메뉴를 보여드릴게요.');
  if (k === 'newm') return toCat(0, '새로 나온 메뉴를 보여드릴게요.');
  if (k === 'ice2') return V({ status: 'confirming', pending: { pid: 'd100', temp: 'ICE', qty: 2 }, reply: '이렇게 담아드릴까요?', next: '맞으면 담기를 눌러 주세요.' });
  if (k === 'latte') return V({ status: 'asking', pending: { pid: 'd107', temp: null, qty: 1 }, reply: '따뜻하게 드릴까요, 차갑게 드릴까요?', next: '말하거나 눌러 주세요.' });
  if (k === 'pay') return reply('결제는 화면에서 직접 선택해 주세요.', '주문 확인 뒤에 결제 수단을 직접 골라 주세요.');
  if (k === 'done') return S.items.length ? nav('review') : reply('먼저 메뉴를 담아 주세요.');
  if (k === 'fail') return V({ status: 'error', said: '', reply: '잘 듣지 못했어요.', next: '다시 말하거나 화면에서 선택해 주세요.' });
  if (S.screen !== 'opt') return reply('메뉴를 먼저 골라 주세요.');
  const p = P[o.pid];
  if (k === 'hot') {
    if (!p.temps.includes('HOT')) return reply('이 메뉴는 따뜻하게 주문할 수 없어요.', '다른 옵션을 골라 주세요.');
    o.temp = 'HOT'; syncOpt(); return reply('따뜻하게 선택했어요.', '담으려면 “이걸로 담아줘”라고 말해 주세요.');
  }
  if (k === 'shot') {
    if (!p.options.some((g) => g.id === 'shot')) return reply('이 메뉴에는 샷 추가가 없어요.', '다른 옵션을 골라 주세요.');
    o.opts.shot = Math.min(2, (o.opts.shot || 0) + 1); syncOpt(); return reply('샷을 추가했어요.', '금액을 확인하고 담아 주세요.');
  }
  if (k === 'two') { o.qty = 2; syncOpt(); return reply('2잔으로 바꿨어요.', '담으려면 “이걸로 담아줘”라고 말해 주세요.'); }
  if (k === 'add') {
    if (p.temps.length && !o.temp) return reply('온도를 먼저 골라 주세요.', '따뜻하게 또는 차갑게를 눌러 주세요.');
    add(o); return added();
  }
}
const added = () => V({ status: 'success', pending: null, reply: '장바구니에 담았어요.', next: '더 담거나 “이제 됐어”라고 말해 주세요.' });
function selCat(c) { S.cat = c; S.sub = 0; if (S.screen === 'menu') syncMenu(); else show('menu'); }

/* ---------- 이벤트 ---------- */
const A = {
  home: () => (S.items.length ? open('<h2>주문을 끝낼까요?</h2><p>담은 메뉴가 모두 지워져요.</p><div class="pair"><button class="btn btn-primary" data-a="close">계속 주문하기</button><button class="btn btn-secondary" data-a="reset">주문 종료하기</button></div>') : reset()),
  reset, close: () => { dlg.close(); if (warning) armIdle(); },
  extend: () => {
    armIdle();
    const p = $('.session p');
    p.textContent = '주문 시간을 연장했어요.';
    later(() => { p.textContent = IDLE_COPY; }, 2000);
  },
  cat: (v) => { S.cat = +v; S.sub = 0; nav('menu'); },
  center: (v) => { openOpt(v); },
  startVoice: () => { S.cat = 1; S.sub = 0; S.voice = null; show('menu'); V({}); live.start(); },
  voice: () => { if (S.voice) endVoice(); else { V({}); live.start(); } },
  endVoice,
  selCat: (v) => selCat(+v),
  selSub: (v) => { S.sub = +v; syncMenu(); },
  open: (v) => openOpt(v),
  menu: () => { S.opt = null; show('menu'); },
  temp: (v) => { S.opt.temp = v; syncOpt(); },
  option: (v, el) => { if (+v) S.opt.opts[el.dataset.g] = +v; else delete S.opt.opts[el.dataset.g]; syncOpt(); },
  shot: (v) => { const n = (S.opt.opts.shot || 0) === +v ? v - 1 : +v; if (n) S.opt.opts.shot = n; else delete S.opt.opts.shot; syncOpt(); },
  more: (_, el) => {
    const opened = $('#more').hidden;
    $('#more').hidden = !opened;
    el.setAttribute('aria-expanded', opened);
    el.innerHTML = `<span>${opened ? '접기' : '자세히 보기'}</span>${icon(opened ? 'chevron-up' : 'chevron-down')}`;
    icons();
  },
  qty: (v) => { S.opt.qty = Math.max(1, Math.min(9, S.opt.qty + +v)); syncOpt(); },
  add: () => { const talking = !!S.voice; add(S.opt); if (talking) added(); },
  askClear: () => open('<h2 class="cart-modal">담은 메뉴를 모두 삭제할까요?</h2><p>장바구니에 담긴 메뉴가 모두 삭제돼요.</p><div class="pair"><button class="btn btn-destructive" data-a="clear">전체 삭제</button><button class="btn btn-primary" data-a="close" autofocus>계속 주문하기</button></div>'),
  clear: () => { S.items = []; S.key = ''; S.attempt = 0; dlg.close(); syncCart(); },
  review: () => { if (S.items.length) nav('review'); },
  rowQty: (v, el) => { const i = S.items.find((x) => x.id === +el.dataset.id); i.qty = Math.max(1, Math.min(9, i.qty + +v)); S.key = ''; S.attempt = 0; syncReview(true); },
  del: (_, el) => { S.items = S.items.filter((x) => x.id !== +el.dataset.id); S.key = ''; S.attempt = 0; syncReview(true); },
  type: (v) => { S.type = v; nav('pay'); },
  stampOpen: () => { phone = ''; stampDialog(); },
  key: (k) => { phone = k === '전체 지우기' ? '' : k === '한 글자 지우기' ? phone.slice(0, -1) : (phone + k).slice(0, 11); stampDialog(); },
  stamp: () => { S.stamp = true; dlg.close(); show('pay'); },
  pay: (v) => { dlg.close(); pay(v); },
  receipt: (v) => { $('#rmsg').textContent = v; },
  say, retry: () => live.start(),
  confirmPending: () => { add({ ...S.voice.pending }); added(); },
  editPending: () => { const p = S.voice.pending; openOpt(p.pid, { temp: p.temp, qty: p.qty }); V({ status: 'responding', pending: null, reply: '옵션 화면에서 직접 고쳐 주세요.', next: '말로도, 눌러서도 바꿀 수 있어요.' }); },
  askTemp: (v) => V({ status: 'confirming', pending: { ...S.voice.pending, temp: v }, reply: '선택한 메뉴를 확인해 주세요.', next: '맞으면 담기를 눌러 주세요.' }),
};
stage.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled || $('.wipe', fx)) return;
  if (dlg.open && !dlg.contains(el)) return;
  A[el.dataset.a](el.dataset.v, el);
});

/* ---------- 미사용 120초 → 60초 안내 (결제 중·결과 불명일 때는 초기화하지 않는다) ---------- */
let warning = false;
function armIdle() {
  clearTimeout(idle); clearInterval(idle); warning = false;
  idle = setTimeout(() => {
    if (['start', 'proc', 'done'].includes(S.screen) || S.unknown) return armIdle();
    warning = true;
    let left = GRACE_S;
    endVoice();
    const warn = () => open(`<h2 class="cart-modal">아직 주문 중이신가요?</h2><p>계속 주문하기를 누르면 선택한 메뉴가 그대로 유지돼요.</p><p class="cap">${left}초 후 주문 내역이 초기화됩니다.</p><div class="pair"><button class="btn btn-secondary" data-a="reset">주문 종료하기</button><button class="btn btn-primary" data-a="close">계속 주문하기</button></div>`);
    warn();
    idle = setInterval(() => { left -= 1; if (left <= 0) reset(); else warn(); }, 1000);
  }, IDLE_MS);
}
// 안내가 떠 있을 때는 버튼을 눌러야만 풀린다
const onUse = () => { if (!warning) armIdle(); };
addEventListener('pointerdown', onUse);
addEventListener('keydown', onUse);

// AI 연결부: 음성과 터치가 같은 S.items를 쓴다. app.js의 상태·함수만 넘기고, AI 쪽은 화면을 직접 그리지 않는다.
const live = createLive({
  S: () => S, P, products, CATS, REC, SUBS,
  count, total, unit,
  optLabels: (i) => chosen(i.pid, i.opts).map(({ group, choice }) => (group.id === 'ice' ? `얼음 ${choice.label}` : choice.label)),
  add, openOpt, selCat, nav, askClear: () => A.askClear(), endVoice, V,
  afterCartChange: () => { S.key = ''; S.attempt = 0; if (S.screen === 'menu') syncCart(); },
});
const fit = () => { stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1080, innerHeight / 1920)})`; };
addEventListener('resize', fit);
fit();
S = fresh();
show('start');
armIdle();
