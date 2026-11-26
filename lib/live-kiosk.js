// Gemini Live voice ordering — server side. The browser never sees the API key: it talks to THIS server over a
// WebSocket (/api/live) and this server talks to Gemini Live.
//
// Cart consistency: the kiosk (browser) owns the cart so touch and voice use the very same state. When the model
// calls a tool, this server validates the arguments against data/menus.json, asks the kiosk to apply the change,
// WAITS for the kiosk's answer (the real cart after the change) and only then answers the model with that result.
// So what the AI says always matches what the screen shows.
//
// Environment: GEMINI_API_KEY (required), GEMINI_LIVE_MODEL, GEMINI_LIVE_VOICE (optional). See docs/live-integration.md.
import { randomUUID } from 'node:crypto';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import { limits } from './live-guard.js';
import { loadCatalog } from './catalog.js';

export const liveModel = () => process.env.GEMINI_LIVE_MODEL || 'gemini-3.8-live';
const liveVoice = () => process.env.GEMINI_LIVE_VOICE || 'Kore';
export const apiKey = () => process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
export const liveConfigured = () => !!apiKey();

const SUPPORTED_LANGS = ['ko', 'en', 'zh', 'ja'];
const LANG_NAMES = { ko: '한국어 (Korean)', en: 'English', zh: '中文 (Chinese)', ja: '日本語 (Japanese)' };
const SCREENS = ['start', 'menu', 'opt', 'review', 'proc', 'cart', 'confirm', 'pay', 'pre', 'done'];
const ACK_TIMEOUT_MS = 5000;

const redact = (s) => { const k = apiKey(); return k ? String(s).split(k).join('[REDACTED]') : String(s); };

// Internal code → what the browser gets. Customers only ever see a friendly line; details stay in the server log.
export function classifyError(err) {
  const msg = redact(err?.message || err || '');
  let code = 'UNKNOWN';
  if (/API_KEY_INVALID|API key not valid|\b401\b|UNAUTHENTICATED/i.test(msg)) code = 'AUTH';
  else if (/PERMISSION_DENIED|\b403\b/i.test(msg)) code = 'AUTH';
  else if (/RESOURCE_EXHAUSTED|\b429\b|quota/i.test(msg)) code = 'QUOTA';
  else if (/NOT_FOUND|\b404\b|not found|not supported|unsupported/i.test(msg)) code = 'MODEL';
  else if (/UNAVAILABLE|\b503\b|overloaded|high demand/i.test(msg)) code = 'MODEL_BUSY';
  return { code, detail: msg.slice(0, 300) };
}

// Option groups that are identical on every menu that has them (v6: shot/syrup/whip/ice) are defined once instead of per menu line.
function sharedOptionGroups(menus) {
  const seen = new Map();
  for (const m of menus) for (const g of (m.optionsConfirmed ? m.options || [] : [])) {
    const sig = JSON.stringify([g.term, g.onlyTemp || null, g.choices]);
    if (!seen.has(g.id)) seen.set(g.id, { sig, g, ok: true }); else if (seen.get(g.id).sig !== sig) seen.get(g.id).ok = false;
  }
  return new Map([...seen].filter(([, v]) => v.ok).map(([id, v]) => [id, v.g]));
}
const optText = (g) => `${g.id}(${g.term}${g.onlyTemp ? `, ${g.onlyTemp}만` : ''}: ${g.choices.map((c) => `${c.id}=${c.label}${c.price ? `+${c.price}원` : ''}`).join(', ')})`;

function buildSystemInstruction(menusData) {
  const shared = sharedOptionGroups(menusData.menus);
  const sharedText = shared.size ? `\n[공통 옵션 정의 — 메뉴 줄의 "옵션:" 에 이름이 있는 메뉴에만 적용]\n${[...shared.values()].map(optText).join('\n')}\n` : '';
  const menuLines = menusData.menus.map((m) => {
    const priceText = m.tempPrices ? Object.entries(m.tempPrices).map(([t, v]) => (v != null ? `${t} ${v}원` : `${t} 가격미확인`)).join('/') : (m.price != null ? `${m.price}원` : '가격미확인');
    const temps = Array.isArray(m.temperature) && m.temperature.length ? `[${m.temperature.join('/')}]` : '온도미확인';
    const descText = m.description ? m.description : '설명미확인';
    const cafText = m.caffeine_mg != null ? `${m.caffeine_mg}mg` : '카페인미확인';
    const aliasText = Array.isArray(m.aliases) && m.aliases.length ? ` | 별칭:${m.aliases.join(',')}` : '';
    const opts = m.optionsConfirmed && Array.isArray(m.options) && m.options.length
      ? m.options.map((g) => (shared.has(g.id) ? g.id : optText(g))).join('; ')
      : (!m.optionsConfirmed ? '옵션미확인' : '');
    return `- id="${m.id}" | ${m.name} | ${m.category} | ${priceText} | ${temps} | 카페인:${cafText} | 설명:${descText}${aliasText}${opts ? ` | 옵션:[${opts}]` : ''}`;
  }).join('\n');

  return `당신은 메가MGC커피 비공식 키오스크(UXPRESSO)의 친절하고 명확한 다국어 음성 주문 도우미입니다.
어르신, 외국인, 키오스크가 낯선 고객 모두 편하게 주문할 수 있도록 차분하고 짧고 쉬운 말로 안내하세요.
한 번에 1~2문장 이내로 간결하게 답하고, 마크다운이나 특수문자(별표, 글머리 기호 등)는 말하지 마세요.

[언어 자동 감지 및 전환 규칙 - 매우 중요]
1. 항상 고객이 방금 말하거나 입력한 언어(한국어 ko, 영어 en, 중국어 zh, 일본어 ja 등)로 자연스럽게 응답하세요.
2. 고객이 현재 키오스크 언어와 다른 언어로 말하거나("Hi", "I want an iced latte", "我要冰美式", "カフェラテください" 등) 언어 변경을 요청하면("English please", "日本語で", "用中文", "한국어로 바꿔줘"), 응답과 동시에 반드시 set_language 도구를 호출해 화면 언어를 즉시 바꾸세요.
   - 지원 언어 코드: 'ko'(한국어), 'en'(영어), 'zh'(중국어), 'ja'(일본어). 그 외 외국어로 말하면 화면 언어는 'en'으로 설정하고 고객의 언어로 답변하세요.
   - 이미 화면 언어와 같은 언어로 대화 중이라면 set_language를 반복 호출하지 마세요.
3. 도구 인자 규칙:
   - set_order_mode의 mode는 항상 'dine' 또는 'take', open_menu_detail/add_to_cart/update_cart_quantity/remove_from_cart의 menuId는 항상 메뉴 데이터의 정확한 id(예: americano, mega_001, mega_106)를 전달하세요.
   - temp는 메뉴 데이터에 HOT/ICE가 명시된 경우에만 'HOT' 또는 'ICE'를 전달하고, 온도미확인 메뉴나 푸드는 temp를 생략하거나 빈 값으로 두세요.
   - show_menu_list의 category('rec','coffee','decaf','drink','tea','food','all'), sub('all','HOT','ICE','latte','ade'), tags('커피','논커피','달콤한','상큼한','부드러운','깔끔한')는 고정 값을 사용하고, 키워드 검색/추천 시 query(예: "감자빵", "요거트", "메가리카노", "케익")를 함께 활용하세요. label은 고객의 현재 언어로 자연스럽게 작성하세요.

[미확인 정보 절대 생성 금지 원칙 - 매우 중요]
1. 메뉴 목록에 없는 메뉴, 가격, 설명, 온도, 카페인 함량, 원재료, 알레르기 정보를 절대 임의로 지어내지 마세요.
2. '가격미확인'(null) 메뉴는 절대 0원이나 무료라고 말하지 말고, 가격이 확인되지 않아 키오스크에서 결제를 확정할 수 없다고 정직하게 안내하세요.
3. '카페인미확인'(null) 메뉴는 절대 디카페인이나 무카페인이라고 단정하지 마세요. 카페인이 0mg이거나 디카페인/무카페인으로 명시된 메뉴만 디카페인/무카페인으로 안내하세요.
4. '온도미확인'(null) 메뉴는 HOT/ICE 가능 여부를 추측해 단정하지 말고, 온도 정보가 확인되지 않았음을 안내하세요.
5. '설명미확인' 메뉴는 맛이나 재료를 지어내지 말고 상세 설명이 등록되지 않았다고 안내하세요.
6. 알레르기 안전 여부는 이 데이터만으로 판단하지 말고, 알레르기 문의 시 직원에게 확인해 달라고 안내하세요.
7. 별칭은 음성 인식용 비공식 표현이니 안내할 때는 공식 메뉴명으로 확인해 주세요. 시즌·매장별 판매 여부는 미검증입니다.

[주문 규칙]
1. 메뉴 목록에 없는 상품은 없다고 정직하게 말하고, 목록에 있는 비슷한 메뉴를 추천하세요.
2. 매장 식사(dine)인지 포장(take)인지 아직 정해지지 않았고 고객이 말하면 set_order_mode를 호출하세요.
3. 메뉴를 찾아달라거나 추천, 푸드/디저트, 디카페인, 특정 키워드, 가격대 조건을 말하면 반드시 show_menu_list 도구를 호출해 화면을 바꾸고 간략히 소개하세요. 도구 결과의 screenCount가 실제 화면에 보이는 메뉴 수입니다.
4. 고객이 특정 메뉴를 주문하려 할 때:
   - 메뉴가 HOT과 ICE 모두 가능하고 고객이 온도를 말하지 않았다면 따뜻하게 드릴지 차갑게 드릴지 물어보세요.
   - 메뉴가 ICE 전용 또는 HOT 전용이면 그 온도로 바로 진행하거나 확인하세요.
   - 온도미확인 메뉴나 푸드는 온도를 강요하지 말고 바로 담을 수 있어요.
   - 메뉴와 수량(및 확인된 온도/옵션)이 파악되면 add_to_cart 도구를 호출해 장바구니에 담고, 담은 내용과 가격(또는 가격 미확인 여부)을 짧게 확인해 준 뒤 더 필요한 것이 있는지 물어보세요.
   - 여러 메뉴를 한 번에 말하면 메뉴마다 add_to_cart를 따로 호출하세요.
5. 장바구니 변경 규칙:
   - 수량을 바꾸려 하면 update_cart_quantity, 하나를 빼려 하면 remove_from_cart를 호출하세요. 같은 메뉴가 HOT/ICE 두 줄이면 어느 쪽인지 먼저 물어보세요.
   - 지금 뭘 담았는지 물으면 get_cart를 호출해 그 결과로만 답하세요.
   - 주문 전체를 취소하려 하면 request_cancel_order를 호출하세요. 화면에 확인 창이 뜨고, 확인은 고객이 화면에서 직접 눌러야 하니 그렇게 안내하세요. 직접 비웠다고 말하지 마세요.
   - 장바구니를 바꾼 뒤에는 도구 결과의 cart(실제 장바구니: 메뉴, 수량, 합계)만 근거로 말하세요. 도구가 ok:false를 돌려주면 처리하지 못했다고 솔직히 말하고 이유를 쉽게 설명하세요. 절대 성공한 것처럼 말하지 마세요.
6. 결제, 쿠폰 적용, 멤버십/스탬프 적립은 음성으로 처리할 수 없습니다. 고객이 결제나 쿠폰·적립을 말하면 화면을 직접 눌러 진행해 달라고 안내하세요.
7. 고객이 주문을 마치려 하고 장바구니에 메뉴가 있으면 finish_ordering_to_confirm 도구를 호출하세요. 장바구니가 비어 있으면 먼저 메뉴를 담아달라고 안내하세요.

[판매 중인 메뉴 데이터 (${menusData.menus.length}종)]${sharedText}
${menuLines}`;
}

const O = (properties, required = []) => ({ type: Type.OBJECT, properties, required });
const S = (description) => ({ type: Type.STRING, description });
const N = (description) => ({ type: Type.NUMBER, description });
const KIOSK_TOOLS = [
  { name: 'set_language', description: '고객이 말하거나 요청한 언어에 맞춰 키오스크 화면 언어를 즉시 전환합니다.', parameters: O({ lang: S("언어 코드: 'ko'(한국어), 'en'(영어), 'zh'(중국어), 'ja'(일본어). 기타 외국어는 'en'으로 설정하세요.") }, ['lang']) },
  { name: 'set_order_mode', description: '주문 방식을 매장에서 먹기(dine) 또는 포장하기(take)로 설정하고 메뉴 화면으로 이동합니다.', parameters: O({ mode: S("'dine' (매장에서 먹기) 또는 'take' (포장하기)") }, ['mode']) },
  {
    name: 'show_menu_list',
    description: '카테고리, 온도, 취향 태그, 키워드(메뉴명/별칭), 최대 가격 조건으로 메뉴 목록 화면을 필터링하여 보여줍니다.',
    parameters: O({
      category: S("대분류 ID: 'new'(신메뉴), 'rec'(추천메뉴), 'coffee'(커피), 'decaf'(디카페인/무카페인), 'drink'(음료: 라떼/스무디/에이드/주스), 'tea'(티), 'food'(푸드/디저트), 'goods'(상품), 'all'(전체)"),
      sub: S("하위 필터: 'all', 'HOT', 'ICE', 'latte', 'ade'"),
      tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "취향 태그 목록: '커피', '논커피', '달콤한', '상큼한', '부드러운', '깔끔한'" },
      query: S('메뉴 검색 키워드(메뉴명, 별칭, 재료/설명 등). 예: 메가리카노, 감자빵, 크로플, 스무디'),
      maxPrice: N('최대 가격(원). 예: 3000'),
      label: S('화면에 표시할 필터 제목(고객의 현재 언어로 작성). 예: 감자빵 검색 결과 / Coffee under ₩3,000'),
    }),
  },
  { name: 'open_menu_detail', description: '특정 메뉴의 상세 및 옵션 선택 화면을 엽니다.', parameters: O({ menuId: S('메뉴 ID (예: americano, latte, mega_001, mega_106)'), temp: S("선택 온도: 'HOT' 또는 'ICE' (해당 메뉴가 지원할 때만)"), qty: N('수량 (1~20)') }, ['menuId']) },
  {
    name: 'add_to_cart',
    description: '메뉴와 온도(필요 시), 수량, 선택 옵션을 검증해 장바구니에 담습니다. 키오스크가 실제로 반영한 결과(cart)를 돌려줍니다.',
    parameters: O({
      menuId: S('메뉴 ID (예: americano, latte, mega_001, mega_106)'),
      temp: S("온도: 'HOT' 또는 'ICE' (온도가 확인된 음료만 지정, 온도 미확인 메뉴나 푸드는 생략 가능)"),
      qty: N('수량 (기본 1, 한 메뉴당 최대 수량은 키오스크 한도 — 보통 9)'),
      shot: S("샷 추가: '0'(안 함), '1'(1개), '2'(2개)"),
      syrup: S("시럽 추가: '0'(안 함), '1'(추가)"),
      whip: S("휘핑크림: '0'(안 올림), '1'(올리기)"),
      ice: S("얼음 양(ICE 전용): '0'(보통), '1'(적게)"),
    }, ['menuId']),
  },
  { name: 'update_cart_quantity', description: '장바구니에 담긴 메뉴의 수량을 바꿉니다. qty가 0이면 그 메뉴를 뺍니다. 같은 메뉴가 온도별로 여러 줄이면 temp로 구분합니다.', parameters: O({ menuId: S('수량을 바꿀 메뉴 ID'), temp: S("'HOT' 또는 'ICE' (같은 메뉴가 두 줄 이상일 때)"), qty: N('바꿀 수량 (0~20)') }, ['menuId', 'qty']) },
  { name: 'remove_from_cart', description: '장바구니에서 특정 메뉴를 삭제합니다. 같은 메뉴가 온도별로 여러 줄이면 temp로 구분합니다.', parameters: O({ menuId: S('삭제할 메뉴 ID'), temp: S("'HOT' 또는 'ICE' (같은 메뉴가 두 줄 이상일 때)") }, ['menuId']) },
  { name: 'get_cart', description: '지금 키오스크 화면의 실제 장바구니(메뉴, 수량, 합계)를 확인합니다.', parameters: O({}) },
  { name: 'request_cancel_order', description: '주문 전체 취소를 요청합니다. 화면에 확인 창이 뜨며, 고객이 화면에서 직접 확인해야 취소됩니다.', parameters: O({}) },
  { name: 'finish_ordering_to_confirm', description: '메뉴 담기를 마치고 주문 확인 화면으로 이동합니다(음성 대화를 종료하고 터치 진행으로 전환).', parameters: O({}) },
];

function buildInitPrompt(ctx) {
  const lang = ctx.lang || 'ko';
  const startScreen = ctx.screen === 'start';
  if (lang === 'en') {
    const modeLabel = ctx.mode === 'dine' ? 'Dine in' : ctx.mode === 'take' ? 'Takeout' : 'not selected';
    return startScreen
      ? '[System instruction: The customer started voice ordering on the start screen with English selected. Greet them warmly in English in one short sentence and ask whether they want dine-in or takeout.]'
      : `[System instruction: The customer started voice ordering on the menu screen (order type: ${modeLabel}, cart items: ${ctx.cartCount}) with English selected. In one short sentence in English, invite them to tell you what drink they would like.]`;
  }
  if (lang === 'zh') {
    const modeLabel = ctx.mode === 'dine' ? '堂食' : ctx.mode === 'take' ? '打包' : '未选择';
    return startScreen
      ? '[系统提示：顾客已选择中文并在首页开启了语音点单。请用简短亲切的中文用一句话问候，并询问堂食还是打包带走。]'
      : `[系统提示：顾客已选择中文并在菜单页开启语音点单（用餐方式：${modeLabel}，购物车：${ctx.cartCount}件）。请用简短的中文一句话请顾客说出想点的饮品。]`;
  }
  if (lang === 'ja') {
    const modeLabel = ctx.mode === 'dine' ? '店内飲食' : ctx.mode === 'take' ? 'お持ち帰り' : '未選択';
    return startScreen
      ? '[システム指示：お客様が日本語を選択してトップ画面で音声注文を開始しました。短い自然な日本語一文で挨拶し、店内でお召し上がりかお持ち帰りかを尋ねてください。]'
      : `[システム指示：お客様が日本語を選択してメニュー画面で音声注文を開始しました（注文方法：${modeLabel}、カート：${ctx.cartCount}点）。短い日本語一文でご希望のメニューを尋ねてください。]`;
  }
  const modeLabel = ctx.mode === 'dine' ? '매장 식사' : ctx.mode === 'take' ? '포장 주문' : '미선택';
  return startScreen
    ? '[시스템 안내: 고객이 시작 화면에서 음성 주문을 시작했습니다. 매장에서 드실지 포장하실지 짧고 따뜻하게 한 문장으로 여쭤봐 주세요.]'
    : `[시스템 안내: 고객이 메뉴 화면(주문 방식: ${modeLabel}, 장바구니: ${ctx.cartCount}개)에서 음성 주문을 시작했습니다. 원하시는 메뉴나 취향을 편하게 말씀해 달라고 한 문장으로 짧게 안내해 주세요.]`;
}

export function findMenu(menus, rawIdOrName) {
  const q = String(rawIdOrName || '').trim();
  if (!q) return null;
  const ql = q.toLowerCase().replace(/\s+/g, '');
  return (
    menus.find((x) => x.id === q)
    || menus.find((x) => x.name === q)
    || menus.find((x) => x.name.toLowerCase().replace(/\s+/g, '') === ql)
    || menus.find((x) => Array.isArray(x.aliases) && x.aliases.some((a) => String(a).toLowerCase().replace(/\s+/g, '') === ql))
  ) || null;
}
const clampQty = (v, min = 1, max = 20) => Math.max(min, Math.min(max, Math.round(Number(v)) || min));
const tempOf = (v) => { const t = String(v || '').toUpperCase(); return t === 'HOT' || t === 'ICE' ? t : ''; };

// Validates the model's arguments against the menu data, then asks the kiosk to apply them (`kiosk` resolves with the
// kiosk's real result). Returns what the MODEL gets back. Pure apart from the kiosk() round trip, so it is unit-tested.
export async function runKioskTool(name, args, menusData, ctx, kiosk) {
  const menus = menusData.menus;
  const maxQty = menusData.maxQty || 20;
  const a = args && typeof args === 'object' ? args : {};

  if (name === 'set_language') {
    const raw = String(a.lang || '').toLowerCase().slice(0, 2);
    const lang = SUPPORTED_LANGS.includes(raw) ? raw : 'en';
    ctx.lang = lang;
    const r = await kiosk('set_language', { lang });
    return { message: `Kiosk UI language switched to ${LANG_NAMES[lang]}. Continue replying in the customer's language.`, ...r, lang };
  }

  if (name === 'set_order_mode') {
    const mode = a.mode === 'take' ? 'take' : 'dine';
    ctx.mode = mode;
    return kiosk('set_order_mode', { mode });
  }

  if (name === 'show_menu_list') {
    const category = ['new', 'rec', 'coffee', 'decaf', 'drink', 'tea', 'food', 'goods', 'all'].includes(a.category) ? a.category : 'all';
    const sub = ['all', 'HOT', 'ICE', 'latte', 'ade'].includes(a.sub) ? a.sub : 'all';
    const allowedTags = ['커피', '논커피', '달콤한', '상큼한', '부드러운', '깔끔한'];
    const tags = Array.isArray(a.tags) ? a.tags.filter((t) => allowedTags.includes(t)) : [];
    const maxPrice = typeof a.maxPrice === 'number' && a.maxPrice > 0 ? a.maxPrice : 0;
    const query = String(a.query || '').trim().slice(0, 60);
    const label = String(a.label || '').trim().slice(0, 80);
    const r = await kiosk('show_menu_list', { category, sub, tags, maxPrice, query, label });
    return r; // the kiosk answers with the real screenCount and the menus that are on screen
  }

  if (name === 'open_menu_detail') {
    const m = findMenu(menus, a.menuId);
    if (!m) return { ok: false, error: 'Menu item not found.' };
    const temps = Array.isArray(m.temperature) ? m.temperature : [];
    const reqTemp = tempOf(a.temp);
    const temp = reqTemp && temps.includes(reqTemp) ? reqTemp : (temps.length === 1 ? temps[0] : '');
    return kiosk('open_menu_detail', { menuId: m.id, temp, qty: clampQty(a.qty, 1, maxQty) });
  }

  if (name === 'add_to_cart') {
    const m = findMenu(menus, a.menuId);
    if (!m) return { ok: false, error: 'Menu item does not exist. Tell the customer and suggest a similar item from the list.' };
    if (Number(a.qty) > maxQty) return { ok: false, error: `The kiosk allows at most ${maxQty} of one item per order line. Tell the customer; nothing was added.` };
    const temps = Array.isArray(m.temperature) ? m.temperature : [];
    const reqTemp = tempOf(a.temp);
    if (reqTemp && temps.length && !temps.includes(reqTemp)) return { ok: false, error: `${m.name} is only available as ${temps.join(' / ')}, not ${reqTemp}. Tell the customer and ask whether that is fine; do not add it.` };
    let temp = null;
    if (temps.length === 1) temp = temps[0];
    else if (temps.length > 1) {
      if (!temps.includes(reqTemp)) return { ok: false, error: `${m.name} supports ${temps.join(', ')}. Ask the customer to pick HOT or ICE.` };
      temp = reqTemp;
    }
    const opts = {};
    for (const g of m.options || []) {
      if (g.onlyTemp && g.onlyTemp !== temp) continue;
      const val = a[g.id];
      if (val && val !== '0' && g.choices.some((c) => c.id === String(val))) opts[g.id] = String(val);
    }
    return kiosk('add_to_cart', { menuId: m.id, temp, qty: clampQty(a.qty, 1, maxQty), opts });
  }

  if (name === 'update_cart_quantity') {
    const m = findMenu(menus, a.menuId);
    if (!m) return { ok: false, error: 'Menu item not found.' };
    if (Number(a.qty) > maxQty) return { ok: false, error: `The kiosk allows at most ${maxQty} of one item per order line. Tell the customer; nothing was changed.` };
    return kiosk('update_cart_quantity', { menuId: m.id, temp: tempOf(a.temp), qty: clampQty(a.qty, 0, maxQty) });
  }

  if (name === 'remove_from_cart') {
    const m = findMenu(menus, a.menuId);
    if (!m) return { ok: false, error: 'Menu item not found.' };
    return kiosk('remove_from_cart', { menuId: m.id, temp: tempOf(a.temp) });
  }

  if (name === 'get_cart' || name === 'request_cancel_order' || name === 'finish_ordering_to_confirm') return kiosk(name, {});
  return { ok: false, error: `Unknown tool: ${name}` };
}

const defaultClientFactory = () => new GoogleGenAI({ apiKey: apiKey(), apiVersion: 'v1beta' });

// One browser <-> Gemini Live session. `release` frees the slot taken by live-guard.acquire().
export async function handleLiveConnection(clientWs, loadJson, { createClient = defaultClientFactory, release = () => {}, catalog = 'v6' } = {}) {
  const L = limits();
  let closed = false;
  const wsSend = (payload) => { if (!closed && clientWs.readyState === clientWs.OPEN) clientWs.send(JSON.stringify(payload)); };
  const fail = (code, err) => { console.log(`[live] error code=${code}${err ? ' ' + classifyError(err).detail.replace(/\s+/g, ' ').slice(0, 160) : ''}`); wsSend({ type: 'error', code }); };

  if (!liveConfigured()) { fail('MISSING_API_KEY'); try { clientWs.close(); } catch {} release(); return; }

  const menusData = await loadCatalog(catalog);
  const ctx = { screen: 'start', mode: null, cartCount: 0, lang: 'ko', hasUnpriced: false };
  let initSent = false;
  let lastInput = Date.now();
  let sessionClosed = false;
  const pending = new Map(); // action id -> resolver
  // Counters only (never content): they tell Render logs whether Gemini answered with audio at all.
  const st = { t0: Date.now(), audioIn: 0, audioOut: 0, bytesOut: 0, firstAudioMs: null, textIn: 0, outTranscripts: 0, toolCalls: 0, init: false };
  const msgTimes = [];

  const shutdown = (why) => {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    clearTimeout(maxTimer);
    for (const [, resolve] of pending) resolve({ ok: false, error: 'Session ended.' });
    pending.clear();
    sessionPromise?.then((s) => { try { s.close(); } catch {} }).catch(() => {});
    try { clientWs.close(); } catch {}
    release();
    console.log(`[live] session end reason=${why} secs=${Math.round((Date.now() - st.t0) / 1000)} micChunksFromBrowser=${st.audioIn} textFromBrowser=${st.textIn} initPrompt=${st.init} audioChunksFromGemini=${st.audioOut} audioBytes=${st.bytesOut} firstAudioMs=${st.firstAudioMs} outTranscripts=${st.outTranscripts} toolCalls=${st.toolCalls}`);
  };
  const timer = setInterval(() => {
    const idle = (Date.now() - lastInput) / 1000;
    if (idle > L.idleSeconds) { wsSend({ type: 'closed', reason: 'idle' }); shutdown('idle'); }
  }, 5000);
  const maxTimer = setTimeout(() => { wsSend({ type: 'closed', reason: 'max_duration' }); shutdown('max_duration'); }, L.maxSeconds * 1000);
  maxTimer.unref?.();

  // Ask the kiosk to apply an action and wait for the REAL result.
  const kiosk = (name, args) => new Promise((resolve) => {
    const id = randomUUID();
    const t = setTimeout(() => { pending.delete(id); resolve({ ok: false, error: 'The kiosk did not respond in time. Do not claim the change was made.' }); }, ACK_TIMEOUT_MS);
    pending.set(id, (r) => { clearTimeout(t); resolve(r); });
    wsSend({ type: 'action', id, name, args });
  });

  let sessionPromise;
  try {
    const ai = createClient();
    sessionPromise = ai.live.connect({
      model: liveModel(),
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: liveVoice() } } },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: buildSystemInstruction(menusData),
        tools: [{ functionDeclarations: KIOSK_TOOLS }],
      },
      callbacks: {
        onopen: () => wsSend({ type: 'ready' }),
        onmessage: (message) => {
          if (closed) return;
          const content = message.serverContent;
          if (content?.inputTranscription?.text) wsSend({ type: 'inputTranscript', text: content.inputTranscription.text });
          if (content?.outputTranscription?.text) st.outTranscripts++;
          if (content?.outputTranscription?.text) wsSend({ type: 'outputTranscript', text: content.outputTranscription.text });
          for (const part of content?.modelTurn?.parts ?? []) if (part.inlineData?.data) {
            if (!st.audioOut++) { st.firstAudioMs = Date.now() - st.t0; console.log(`[live] first audio from Gemini after ${st.firstAudioMs}ms (mime=${String(part.inlineData.mimeType || '?').slice(0, 40)})`); }
            st.bytesOut += part.inlineData.data.length;
            wsSend({ type: 'audio', data: part.inlineData.data });
          }
          if (content?.interrupted) wsSend({ type: 'interrupted' });
          if (content?.turnComplete) wsSend({ type: 'turnComplete' });
          for (const call of message.toolCall?.functionCalls ?? []) {
            st.toolCalls++;
            runKioskTool(call.name, call.args || {}, menusData, ctx, kiosk)
              .then((result) => sessionPromise.then((s) => { if (!closed) s.sendToolResponse({ functionResponses: [{ id: call.id, name: call.name, response: result }] }); }))
              .catch((err) => { console.log(`[live] tool ${call.name} failed: ${classifyError(err).detail.slice(0, 120)}`); });
          }
        },
        onerror: (err) => { fail(classifyError(err).code, err); shutdown('model_error'); }, // free the slot; the kiosk falls back to touch
        onclose: () => { sessionClosed = true; if (!closed) { wsSend({ type: 'closed', reason: 'model' }); shutdown('model_closed'); } },
      },
    });
    sessionPromise.catch((err) => { fail(classifyError(err).code, err); shutdown('connect_failed'); });
  } catch (err) { fail(classifyError(err).code, err); shutdown('connect_threw'); return; }

  const toSession = (fn) => sessionPromise.then((s) => { if (!closed && !sessionClosed) fn(s); }).catch(() => {});

  clientWs.on('message', (raw) => {
    const now = Date.now();
    msgTimes.push(now); while (msgTimes.length && now - msgTimes[0] > 1000) msgTimes.shift();
    if (msgTimes.length > L.maxMsgsPerSecond) { wsSend({ type: 'closed', reason: 'too_fast' }); shutdown('too_fast'); return; }
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'audio' && typeof msg.data === 'string' && msg.data.length > 0 && msg.data.length <= 65536) {
      lastInput = now; st.audioIn++;
      toSession((s) => s.sendRealtimeInput({ audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' } }));
    } else if (msg.type === 'text' && typeof msg.text === 'string' && msg.text.trim()) {
      lastInput = now; st.textIn++;
      const txt = msg.text.trim().slice(0, L.maxTextChars);
      toSession((s) => s.sendRealtimeInput({ text: txt }));
    } else if (msg.type === 'actionResult' && typeof msg.id === 'string' && pending.has(msg.id)) {
      lastInput = now;
      const r = msg.result && typeof msg.result === 'object' ? msg.result : { ok: false, error: 'Invalid kiosk response.' };
      if (JSON.stringify(r).length > 20000) { pending.get(msg.id)({ ok: false, error: 'Kiosk response too large.' }); pending.delete(msg.id); return; }
      if (r.cart && typeof r.cart === 'object') { ctx.cartCount = Number(r.cart.count) || 0; ctx.hasUnpriced = Boolean(r.cart.hasUnpriced); }
      pending.get(msg.id)(r); pending.delete(msg.id);
    } else if (msg.type === 'context') {
      lastInput = now;
      if (SCREENS.includes(msg.screen)) ctx.screen = msg.screen;
      ctx.mode = msg.mode === 'dine' || msg.mode === 'take' ? msg.mode : null;
      ctx.cartCount = Math.max(0, Math.min(999, Number(msg.cartCount) || 0));
      ctx.hasUnpriced = Boolean(msg.hasUnpriced);
      const prevLang = ctx.lang;
      if (SUPPORTED_LANGS.includes(msg.lang)) ctx.lang = msg.lang;
      if (msg.init && !initSent) { initSent = true; st.init = true; const prompt = buildInitPrompt(ctx); toSession((s) => s.sendRealtimeInput({ text: prompt })); }
      else if (msg.langChanged && ctx.lang !== prevLang) {
        const notice = `[System instruction: The customer changed the kiosk UI language to ${LANG_NAMES[ctx.lang]}. Reply in ${LANG_NAMES[ctx.lang]} from now on.]`;
        toSession((s) => s.sendRealtimeInput({ text: notice }));
      }
    }
  });
  clientWs.on('close', () => shutdown('client_closed'));
  clientWs.on('error', () => shutdown('client_error'));
}
