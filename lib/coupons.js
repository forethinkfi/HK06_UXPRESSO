// Coupon rules for the mock coupon API and for order saving (moved out of server.js unchanged so lib/orders.js can reuse it).
const won = (n) => n.toLocaleString('ko-KR') + '원';

// ---- coupons ----
export function applyCoupon(code, items, menus, data) {
  const c = data.coupons.find((x) => x.code === String(code).trim().toUpperCase());
  if (!c) return { status: 'unknown' }; // can't verify -> staff
  const base = { coupon: { code: c.code, name: c.name, type: c.type } };
  const no = (reason, alternative, hint) => ({ status: 'unusable', ...base, reason, alternative, hint });
  if (!c.kioskUsable) return no(c.reason, c.alternative);
  if (c.expires && new Date(c.expires) < new Date()) return no('사용 기간이 지났어요.', '다른 쿠폰을 입력하거나, 쿠폰 없이 결제해 주세요.');
  if (!items) return { status: 'ok', ...base, discount: null }; // pre-check: availability only
  const lines = items.map((it) => {
    const m = menus.find((x) => x.id === it.menuId);
    const basePrice = m ? (m.tempPrices && it.temp && m.tempPrices[it.temp] != null ? m.tempPrices[it.temp] : m.price) : null;
    if (!m || basePrice == null) return { m, qty: it.qty, unit: null };
    const u = basePrice + m.options.reduce((s, g) => s + (g.choices.find((ch) => ch.id === it.opts?.[g.id])?.price || 0), 0);
    return { m, qty: it.qty, unit: u };
  });
  if (lines.some((l) => l.unit == null)) {
    return no('가격이 확인되지 않은 메뉴가 담겨 있어 쿠폰 금액을 계산할 수 없어요.', '가격 미확인 메뉴를 빼거나 직원에게 문의해 주세요.');
  }
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  let discount = 0;
  if (c.type === 'discount') {
    if (subtotal < c.minOrder) return no(`${won(c.minOrder)} 이상 주문할 때 쓸 수 있어요. 지금은 ${won(subtotal)}이에요.`, `${won(c.minOrder - subtotal)} 더 담으면 쓸 수 있어요. 아니면 쿠폰 없이 결제할 수 있어요.`, 'addMore');
    discount = c.kind === 'percent' ? Math.min(Math.floor((subtotal * c.value) / 100), c.maxDiscount ?? Infinity) : Math.min(c.value, subtotal);
  } else if (c.type === 'voucher') {
    const l = lines.find((x) => x.m.id === c.menuId);
    const target = menus.find((x) => x.id === c.menuId);
    if (!l) return no(`장바구니에 ${target.name}가 없어요.`, `${target.name}를 담으면 쓸 수 있어요. 아니면 쿠폰 없이 결제할 수 있어요.`, 'addMore');
    const targetPrice = target.tempPrices && l && items.find((x) => x.menuId === c.menuId)?.temp ? (target.tempPrices[items.find((x) => x.menuId === c.menuId).temp] ?? target.price) : target.price;
    discount = targetPrice ?? 0; // 1 cup, base price only (option cost stays)
  } else if (c.type === 'giftcard') discount = Math.min(c.balance, subtotal);
  return { status: 'ok', ...base, discount, subtotal };
}
