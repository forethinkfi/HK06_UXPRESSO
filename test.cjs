// node test.cjs — checks the voice intent guard rails.
const assert = require('node:assert');
require('./public/intent.js');
const { menus } = require('./data/menus.json');
const p = (s) => parseIntent(s, menus);

assert.deepStrictEqual(p('아이스 아메리카노 두 잔 주세요'), { intent: 'select_product', menuId: 'americano', temperature: 'ICE', quantity: 2 });
assert.strictEqual(p('디카페인 아메리카노 주세요').menuId, 'decaf');
assert.strictEqual(p('복숭아 아이스티').temperature, null); // "아이스티" is a product name, not a temperature
assert.strictEqual(p('디카페인 보여줘').category, 'decaf');
assert.strictEqual(p('메뉴 추천해 줘').category, 'rec');
assert.strictEqual(p('카드로 결제해 줘').intent, 'unsupported_payment'); // voice never pays
assert.strictEqual(p('쿠폰 써줘').intent, 'unsupported_payment');
assert.strictEqual(p('이제 됐어').intent, 'finish_selection');
assert.strictEqual(p('음 그러니까').intent, 'unknown');
assert.strictEqual(p('차가운 걸로 바꿔줘').temperature, 'ICE');
assert.strictEqual(p('따뜻한 카페라떼 주세요').temperature, 'HOT');
assert.strictEqual(p('따뜻한 카페라떼 주세요').menuId, 'latte');
console.log('ok');
