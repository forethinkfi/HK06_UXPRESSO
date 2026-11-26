// Mock voice: utterance text -> allowed intent only (PRD v3 FR-09). No free-form screens, no payment actions.
// ponytail: keyword matching; swap for an intent API if real speech input is added.
(function () {
  const squash = (s) => s.replace(/\s/g, '');
  const NUM = { 한: 1, 하나: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4 };

  function parseIntent(text, menus) {
    const t = squash(text);
    if (!t) return { intent: 'unknown' };
    if (/결제|쿠폰|적립|할인/.test(t)) return { intent: 'unsupported_payment' };
    if (/이제됐|다골랐|주문끝|그만/.test(t)) return { intent: 'finish_selection' };
    if (/담아|이걸로/.test(t)) return { intent: 'confirm_item' };
    if (/추천/.test(t)) return { intent: 'navigate_category', category: 'rec' };
    if (/신메뉴|새로나온/.test(t)) return { intent: 'navigate_category', category: 'new' };

    const temperature = /아이스(?!티)|차갑|시원/.test(t) ? 'ICE' : /따뜻|뜨겁|핫/.test(t) ? 'HOT' : null;
    const m = t.match(/(\d+|한|하나|두|둘|세|셋|네|넷)잔/);
    const quantity = m ? Math.min(20, NUM[m[1]] || Number(m[1])) || 1 : null;
    // longest product name wins, so "디카페인 아메리카노" beats "아메리카노"
    const product = [...menus].sort((a, b) => b.name.length - a.name.length).find((x) => t.includes(squash(x.name)));
    if (product) return { intent: 'select_product', menuId: product.id, temperature, quantity };

    const cat = [['디카페인', 'decaf'], ['커피', 'coffee'], ['음료', 'drink'], ['티', 'tea'], ['푸드', 'food'], ['먹을', 'food'], ['상품', 'goods']].find(([k]) => t.includes(k));
    if (cat) return { intent: 'navigate_category', category: cat[1] };
    if (temperature) return { intent: 'set_temperature', temperature };
    if (quantity) return { intent: 'set_quantity', quantity };
    return { intent: 'unknown' };
  }

  globalThis.parseIntent = parseIntent;
})();
