import { GoogleGenAI, Modality, Type } from '@google/genai';

const SUPPORTED_LANGS = ['ko', 'en', 'zh', 'ja'];
const LANG_NAMES = {
  ko: '한국어 (Korean)',
  en: 'English',
  zh: '中文 (Chinese)',
  ja: '日本語 (Japanese)',
};

function detectLangFromText(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  if (/[\u3040-\u30ff]/.test(s)) return 'ja';
  if (/[\uac00-\ud7af\u1100-\u11ff]/.test(s)) return 'ko';
  const hanzi = s.match(/[\u4e00-\u9fff]/g) || [];
  if (hanzi.length >= 2) return 'zh';
  const words = s.match(/[A-Za-z]{2,}/g) || [];
  if (words.length >= 2) return 'en';
  if (words.length === 1 && /^(hello|hi|hey|english|coffee|latte|tea|menu|order|yes|no|please|thanks|thank|takeout|dine|americano)$/i.test(words[0])) {
    return 'en';
  }
  return null;
}

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatLiveError(err) {
  const msg = String(err?.message || err || '');
  if (/API_KEY_INVALID|PERMISSION_DENIED|401|403/i.test(msg)) {
    return 'API 키를 확인할 수 없어요. Settings > Secrets 패널에서 GEMINI_API_KEY를 확인해 주세요.';
  }
  if (/RESOURCE_EXHAUSTED|429/i.test(msg)) {
    return '요청 한도를 초과했어요. 잠시 후 다시 시도하거나 Settings > Secrets에서 API 키 상태를 확인해 주세요.';
  }
  if (/NOT_FOUND|404/i.test(msg)) {
    return `모델 연결 오류(404): ${msg}`;
  }
  return msg || 'Gemini Live 음성 연결에 문제가 생겼어요. 다시 시도해 주세요.';
}

function buildSystemInstruction(menusData) {
  const menuLines = menusData.menus.map((m) => {
    const priceText = m.tempPrices
      ? `HOT ${m.tempPrices.HOT}원/ICE ${m.tempPrices.ICE}원`
      : (m.price != null ? `${m.price}원` : '가격미확인');
    const temps = Array.isArray(m.temperature) && m.temperature.length ? `[${m.temperature.join('/')}]` : '온도미확인';
    const descText = m.description ? m.description : '설명미확인';
    const cafText = m.caffeine_mg != null ? `${m.caffeine_mg}mg` : '카페인미확인';
    const aliasText = Array.isArray(m.aliases) && m.aliases.length ? ` | 별칭:${m.aliases.join(',')}` : '';
    const opts = m.optionsConfirmed && Array.isArray(m.options) && m.options.length
      ? m.options.map((g) => `${g.id}(${g.term}: ${g.choices.map((c) => `${c.id}=${c.label}${c.price ? `+${c.price}원` : ''}`).join(', ')})`).join('; ')
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
   - set_order_mode의 mode는 항상 'dine' 또는 'take', open_menu_detail/add_to_cart의 menuId는 항상 메뉴 데이터의 정확한 id(예: americano, mega_001, mega_106)를 전달하세요.
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
3. 메뉴를 찾아달라거나 추천, 푸드/디저트, 디카페인, 특정 키워드, 가격대 조건을 말하면 반드시 show_menu_list 도구를 호출해 화면을 바꾸고 간략히 소개하세요.
4. 고객이 특정 메뉴를 주문하려 할 때:
   - 메뉴가 HOT과 ICE 모두 가능하고 고객이 온도를 말하지 않았다면 따뜻하게 드릴지 차갑게 드릴지 물어보세요.
   - 메뉴가 ICE 전용 또는 HOT 전용이면 그 온도로 바로 진행하거나 확인하세요.
   - 온도미확인 메뉴나 푸드는 온도를 강요하지 말고 바로 담을 수 있어요.
   - 메뉴와 수량(및 확인된 온도/옵션)이 파악되면 add_to_cart 도구를 호출해 장바구니에 담고, 담은 내용과 가격(또는 가격 미확인 여부)을 짧게 확인해 준 뒤 더 필요한 것이 있는지 물어보세요.
5. 결제, 쿠폰 적용, 멤버십/스탬프 적립은 음성으로 처리할 수 없습니다. 고객이 결제나 쿠폰·적립을 말하면 화면을 직접 눌러 진행해 달라고 안내하세요.
6. 고객이 주문을 마치려 하고 장바구니에 메뉴가 있으면 finish_ordering_to_confirm 도구를 호출하세요. 장바구니가 비어 있으면 먼저 메뉴를 담아달라고 안내하세요.

[판매 중인 메뉴 데이터 (${menusData.menus.length}종)]
${menuLines}`;
}

const KIOSK_TOOLS = [
  {
    name: 'set_language',
    description: '고객이 말하거나 요청한 언어에 맞춰 키오스크 화면 언어를 즉시 전환합니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        lang: {
          type: Type.STRING,
          description: "언어 코드: 'ko'(한국어), 'en'(영어), 'zh'(중국어), 'ja'(일본어). 기타 외국어는 'en'으로 설정하세요.",
        },
      },
      required: ['lang'],
    },
  },
  {
    name: 'set_order_mode',
    description: '주문 방식을 매장에서 먹기(dine) 또는 포장하기(take)로 설정하고 메뉴 화면으로 이동합니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        mode: { type: Type.STRING, description: "'dine' (매장에서 먹기) 또는 'take' (포장하기)" },
      },
      required: ['mode'],
    },
  },
  {
    name: 'show_menu_list',
    description: '카테고리, 온도, 취향 태그, 키워드(메뉴명/별칭), 최대 가격 조건으로 메뉴 목록 화면을 필터링하여 보여줍니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        category: {
          type: Type.STRING,
          description: "대분류 ID: 'rec'(추천메뉴), 'coffee'(커피), 'decaf'(디카페인/무카페인), 'drink'(음료: 라떼/스무디/에이드/주스), 'tea'(티), 'food'(푸드/디저트), 'all'(전체)",
        },
        sub: {
          type: Type.STRING,
          description: "하위 필터: 'all', 'HOT', 'ICE', 'latte', 'ade'",
        },
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "취향 태그 목록: '커피', '논커피', '달콤한', '상큼한', '부드러운', '깔끔한'",
        },
        query: {
          type: Type.STRING,
          description: '메뉴 검색 키워드(메뉴명, 별칭, 재료/설명 등). 예: 메가리카노, 감자빵, 크로플, 스무디',
        },
        maxPrice: {
          type: Type.NUMBER,
          description: '최대 가격(원). 예: 3000',
        },
        label: {
          type: Type.STRING,
          description: '화면에 표시할 필터 제목(고객의 현재 언어로 작성). 예: 감자빵 검색 결과 / Coffee under ₩3,000',
        },
      },
    },
  },
  {
    name: 'open_menu_detail',
    description: '특정 메뉴의 상세 및 옵션 선택 화면을 엽니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuId: { type: Type.STRING, description: '메뉴 ID (예: americano, latte, mega_001, mega_106)' },
        temp: { type: Type.STRING, description: "선택 온도: 'HOT' 또는 'ICE' (해당 메뉴가 지원할 때만)" },
        qty: { type: Type.NUMBER, description: '수량 (1~20)' },
      },
      required: ['menuId'],
    },
  },
  {
    name: 'add_to_cart',
    description: '메뉴와 온도(필요 시), 수량, 선택 옵션을 검증해 장바구니에 담습니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuId: { type: Type.STRING, description: '메뉴 ID (예: americano, latte, mega_001, mega_106)' },
        temp: { type: Type.STRING, description: "온도: 'HOT' 또는 'ICE' (온도가 확인된 음료만 지정, 온도 미확인 메뉴나 푸드는 생략 가능)" },
        qty: { type: Type.NUMBER, description: '수량 (기본 1, 최대 20)' },
        shot: { type: Type.STRING, description: "샷 추가: '0'(안 함), '1'(1개), '2'(2개)" },
        syrup: { type: Type.STRING, description: "시럽 추가: '0'(안 함), '1'(추가)" },
        whip: { type: Type.STRING, description: "휘핑크림: '0'(안 올림), '1'(올리기)" },
        ice: { type: Type.STRING, description: "얼음 양(ICE 전용): '0'(보통), '1'(적게)" },
      },
      required: ['menuId'],
    },
  },
  {
    name: 'remove_from_cart',
    description: '장바구니에서 특정 메뉴를 삭제합니다.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        menuId: { type: Type.STRING, description: '삭제할 메뉴 ID' },
      },
      required: ['menuId'],
    },
  },
  {
    name: 'finish_ordering_to_confirm',
    description: '메뉴 담기를 마치고 주문 확인 화면으로 이동합니다(음성 대화를 종료하고 터치 진행으로 전환).',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
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

function findMenu(menus, rawIdOrName) {
  const q = String(rawIdOrName || '').trim();
  if (!q) return null;
  const ql = q.toLowerCase().replace(/\s+/g, '');
  return (
    menus.find((x) => x.id === q)
    || menus.find((x) => x.name === q)
    || menus.find((x) => x.name.toLowerCase().replace(/\s+/g, '') === ql)
    || menus.find((x) => Array.isArray(x.aliases) && x.aliases.some((a) => String(a).toLowerCase().replace(/\s+/g, '') === ql))
  );
}

function handleKioskTool(name, args, menusData, ctx, wsSend) {
  const menus = menusData.menus;

  if (name === 'set_language') {
    const raw = String(args.lang || '').toLowerCase().slice(0, 2);
    const lang = SUPPORTED_LANGS.includes(raw) ? raw : 'en';
    ctx.lang = lang;
    wsSend({ type: 'action', name: 'set_language', args: { lang } });
    return {
      ok: true,
      lang,
      message: `Kiosk UI language switched to ${LANG_NAMES[lang] || lang}. Continue replying in the customer's language.`,
    };
  }

  if (name === 'set_order_mode') {
    const mode = args.mode === 'take' ? 'take' : 'dine';
    ctx.mode = mode;
    if (ctx.screen === 'start') ctx.screen = 'menu';
    wsSend({ type: 'action', name, args: { mode } });
    return { ok: true, mode, message: mode === 'dine' ? 'Order mode set to dine-in.' : 'Order mode set to takeout.' };
  }

  if (name === 'show_menu_list') {
    const category = ['rec', 'coffee', 'decaf', 'drink', 'tea', 'food', 'all'].includes(args.category) ? args.category : 'all';
    const sub = ['all', 'HOT', 'ICE', 'latte', 'ade'].includes(args.sub) ? args.sub : 'all';
    const allowedTags = ['커피', '논커피', '달콤한', '상큼한', '부드러운', '깔끔한'];
    const tags = Array.isArray(args.tags) ? args.tags.filter((t) => allowedTags.includes(t)) : [];
    const maxPrice = typeof args.maxPrice === 'number' && args.maxPrice > 0 ? args.maxPrice : 0;
    const query = String(args.query || '').trim();
    const qLower = query.toLowerCase();
    const qCompact = qLower.replace(/\s+/g, '');

    const primMatch = (m) => {
      if (category === 'rec') return Boolean(m.featured);
      if (category === 'coffee') return m.category === '커피';
      if (category === 'decaf') return (m.tags || []).includes('디카페인') || m.caffeine_mg === 0 || /디카페인|무카페인/.test(m.name);
      if (category === 'drink') return ['라떼', '음료', '에이드·스무디', '에이드&주스', '스무디&프라페'].includes(m.category);
      if (category === 'tea') return m.category === '티';
      if (category === 'food') return m.category === '푸드';
      return true;
    };
    const subMatch = (m) => {
      const temps = Array.isArray(m.temperature) ? m.temperature : [];
      if (sub === 'HOT') return temps.includes('HOT');
      if (sub === 'ICE') return temps.includes('ICE');
      if (sub === 'latte') return ['라떼', '음료'].includes(m.category);
      if (sub === 'ade') return ['에이드·스무디', '에이드&주스', '스무디&프라페'].includes(m.category);
      return true;
    };
    const queryMatch = (m) => {
      if (!qLower) return true;
      const hay = [m.name, m.category, m.description || '', ...(m.aliases || []), ...(m.tags || [])].join(' ').toLowerCase();
      return hay.includes(qLower) || hay.replace(/\s+/g, '').includes(qCompact);
    };
    const priceMatch = (m) => {
      if (!maxPrice) return true;
      if (m.tempPrices) return Math.min(...Object.values(m.tempPrices)) <= maxPrice;
      return m.price != null && m.price <= maxPrice;
    };
    const matched = menus.filter(
      (m) => primMatch(m) && subMatch(m) && tags.every((t) => (m.tags || []).includes(t)) && priceMatch(m) && queryMatch(m),
    );
    wsSend({ type: 'action', name, args: { category, sub, tags, maxPrice, query, label: args.label || '' } });
    return {
      ok: true,
      count: matched.length,
      menus: matched.slice(0, 20).map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        price: m.tempPrices || m.price,
        temperature: m.temperature,
        caffeine_mg: m.caffeine_mg ?? null,
        description: m.description ?? null,
      })),
    };
  }

  if (name === 'open_menu_detail') {
    const m = findMenu(menus, args.menuId);
    if (!m) return { ok: false, error: 'Menu item not found.' };
    const temps = Array.isArray(m.temperature) ? m.temperature : [];
    const reqTemp = String(args.temp || '').toUpperCase();
    const temp = reqTemp && temps.includes(reqTemp) ? reqTemp : (temps.length === 1 ? temps[0] : '');
    const qty = Math.max(1, Math.min(20, Number(args.qty) || 1));
    wsSend({ type: 'action', name, args: { menuId: m.id, temp, qty } });
    return {
      ok: true,
      menuId: m.id,
      name: m.name,
      price: m.tempPrices || m.price,
      supportedTemperatures: m.temperature,
      selectedTemp: temp || null,
      caffeine_mg: m.caffeine_mg ?? null,
      description: m.description ?? null,
      optionsConfirmed: Boolean(m.optionsConfirmed),
    };
  }

  if (name === 'add_to_cart') {
    const m = findMenu(menus, args.menuId);
    if (!m) return { ok: false, error: 'Menu item does not exist.' };
    const temps = Array.isArray(m.temperature) ? m.temperature : [];
    const reqTemp = String(args.temp || '').toUpperCase();
    let temp = null;
    if (temps.length === 1) {
      temp = temps[0];
    } else if (temps.length > 1) {
      if (!temps.includes(reqTemp)) {
        return {
          ok: false,
          error: `${m.name} supports ${temps.join(', ')}. Ask the customer to pick HOT or ICE.`,
        };
      }
      temp = reqTemp;
    }
    const qty = Math.max(1, Math.min(20, Number(args.qty) || 1));
    const opts = {};
    for (const g of m.options || []) {
      if (g.onlyTemp && g.onlyTemp !== temp) continue;
      const val = args[g.id];
      if (val && val !== '0' && g.choices.some((c) => c.id === val)) {
        opts[g.id] = val;
      }
    }
    const basePrice = (m.tempPrices && temp && m.tempPrices[temp] != null) ? m.tempPrices[temp] : m.price;
    const unitPrice = basePrice == null
      ? null
      : basePrice + (m.options || []).reduce((s, g) => s + (g.choices.find((c) => c.id === opts[g.id])?.price || 0), 0);
    ctx.cartCount = (ctx.cartCount || 0) + qty;
    if (unitPrice == null) ctx.hasUnpriced = true;
    wsSend({ type: 'action', name, args: { menuId: m.id, temp, qty, opts } });
    return {
      ok: true,
      priceConfirmed: unitPrice != null,
      warning: unitPrice == null ? 'Price is unconfirmed (null). Inform the customer that payment cannot be finalized for unconfirmed-price items.' : undefined,
      added: { menuId: m.id, name: m.name, temp, qty, opts, unitPrice, totalPrice: unitPrice == null ? null : unitPrice * qty },
      cartCount: ctx.cartCount,
    };
  }

  if (name === 'remove_from_cart') {
    const m = findMenu(menus, args.menuId);
    const id = m ? m.id : args.menuId;
    wsSend({ type: 'action', name, args: { menuId: id } });
    return { ok: true, removedMenuId: id };
  }

  if (name === 'finish_ordering_to_confirm') {
    if (!ctx.cartCount) {
      return { ok: false, error: 'Cart is empty. Ask the customer to add a menu item first.' };
    }
    wsSend({ type: 'action', name, args: {} });
    return {
      ok: true,
      hasUnpriced: Boolean(ctx.hasUnpriced),
      message: ctx.hasUnpriced
        ? 'Moving to order confirmation screen. Remind the customer that unconfirmed-price items cannot complete payment.'
        : 'Moving to order confirmation screen and ending voice session.',
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}

export async function handleLiveConnection(clientWs, loadJson) {
  const wsSend = (payload) => {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify(payload));
    }
  };

  const ai = getAiClient();
  if (!ai) {
    wsSend({
      type: 'error',
      code: 'MISSING_API_KEY',
      message: 'GEMINI_API_KEY가 설정되지 않았어요. Settings > Secrets 패널에서 API 키를 설정해 주세요.',
    });
    clientWs.close();
    return;
  }

  const menusData = await loadJson('menus.json');
  const ctx = { screen: 'start', mode: null, cartCount: 0, lang: 'ko' };
  let closed = false;
  let userTranscriptBuf = '';
  let initSent = false;

  const sessionPromise = ai.live.connect({
    model: 'gemini-3.8-live',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: buildSystemInstruction(menusData),
      tools: [{ functionDeclarations: KIOSK_TOOLS }],
    },
    callbacks: {
      onopen: () => {
        wsSend({ type: 'ready' });
      },
      onmessage: (message) => {
        if (closed) return;
        const content = message.serverContent;
        if (content?.inputTranscription?.text) {
          userTranscriptBuf += content.inputTranscription.text;
          wsSend({ type: 'inputTranscript', text: content.inputTranscription.text });
          const detected = detectLangFromText(userTranscriptBuf);
          if (detected && detected !== ctx.lang) {
            ctx.lang = detected;
            wsSend({ type: 'action', name: 'set_language', args: { lang: detected, source: 'transcript' } });
          }
        }
        if (content?.modelTurn?.parts?.length) {
          userTranscriptBuf = '';
        }
        if (content?.outputTranscription?.text) {
          wsSend({ type: 'outputTranscript', text: content.outputTranscription.text });
        }
        for (const part of content?.modelTurn?.parts ?? []) {
          if (part.inlineData?.data) {
            wsSend({ type: 'audio', data: part.inlineData.data });
          }
        }
        if (content?.interrupted) {
          userTranscriptBuf = '';
          wsSend({ type: 'interrupted' });
        }
        if (content?.turnComplete) {
          userTranscriptBuf = '';
          wsSend({ type: 'turnComplete' });
        }
        for (const call of message.toolCall?.functionCalls ?? []) {
          const result = handleKioskTool(call.name, call.args || {}, menusData, ctx, wsSend);
          sessionPromise
            .then((s) => {
              if (!closed) {
                s.sendToolResponse({
                  functionResponses: [{
                    id: call.id,
                    name: call.name,
                    response: result,
                  }],
                });
              }
            })
            .catch(() => {});
        }
      },
      onerror: (err) => {
        wsSend({ type: 'error', message: formatLiveError(err) });
      },
      onclose: (ev) => {
        if (!closed) {
          wsSend({ type: 'closed', reason: ev?.reason || '' });
        }
      },
    },
  });

  sessionPromise.catch((err) => {
    wsSend({ type: 'error', message: formatLiveError(err) });
    try { clientWs.close(); } catch {}
  });

  clientWs.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'audio' && msg.data) {
      sessionPromise
        .then((s) => {
          if (!closed) s.sendRealtimeInput({ audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' } });
        })
        .catch(() => {});
    } else if (msg.type === 'text' && msg.text) {
      userTranscriptBuf = '';
      const txt = String(msg.text);
      const detected = detectLangFromText(txt);
      if (detected && detected !== ctx.lang) {
        ctx.lang = detected;
        wsSend({ type: 'action', name: 'set_language', args: { lang: detected, source: 'text' } });
      }
      sessionPromise
        .then((s) => {
          if (!closed) s.sendRealtimeInput({ text: txt });
        })
        .catch(() => {});
    } else if (msg.type === 'context') {
      ctx.screen = msg.screen || ctx.screen;
      ctx.mode = msg.mode ?? ctx.mode;
      ctx.cartCount = Number(msg.cartCount) || 0;
      ctx.hasUnpriced = Boolean(msg.hasUnpriced);
      const prevLang = ctx.lang;
      if (SUPPORTED_LANGS.includes(msg.lang)) ctx.lang = msg.lang;
      if (msg.init && !initSent) {
        initSent = true;
        const prompt = buildInitPrompt(ctx);
        sessionPromise
          .then((s) => {
            if (!closed) s.sendRealtimeInput({ text: prompt });
          })
          .catch(() => {});
      } else if (msg.langChanged && ctx.lang !== prevLang) {
        const notice = `[System instruction: The customer changed the kiosk UI language to ${LANG_NAMES[ctx.lang] || ctx.lang}. Reply in ${LANG_NAMES[ctx.lang] || ctx.lang} from now on.]`;
        sessionPromise
          .then((s) => {
            if (!closed) s.sendRealtimeInput({ text: notice });
          })
          .catch(() => {});
      }
    }
  });

  clientWs.on('close', () => {
    closed = true;
    sessionPromise.then((s) => { try { s.close(); } catch {} }).catch(() => {});
  });
}
