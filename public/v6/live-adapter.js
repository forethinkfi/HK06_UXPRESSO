// Gemini Live voice ordering for the v6 kiosk — the ONLY place where the AI engine (../live-client.js) touches v6 state.
// app.js passes in its own state and helpers (`app`); this file never renders screens itself: it changes S.items / S.cat
// exactly like a touch would and lets app.js redraw. Voice and touch therefore share one cart (S.items).
// Replace the helpers behind `app` and the AI keeps working after a design change; the engine and the server are untouched.
const CAT_OF = { new: 0, rec: 1, coffee: 2, decaf: 3, drink: 4, tea: 5, food: 6, goods: 7 };
const ERR = {
  AUTH: ['지금은 음성 주문을 쓸 수 없어요.', '화면에서 눌러 주문해 주세요. 담은 메뉴는 그대로예요.'],
  QUOTA: ['음성 주문이 많이 몰려 있어요.', '잠시 후 다시 말하거나 화면에서 선택해 주세요.'],
  SOCKET: ['음성 연결이 끊겼어요.', '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.'],
  BILLING: ['음성 주문을 지금은 이용할 수 없어요.', '화면에서 눌러 주문해 주세요. 담은 메뉴는 그대로예요. 계속 안 되면 직원에게 알려 주세요.'],
  OTHER: ['음성 연결에 문제가 있어요.', '다시 말하거나 화면에서 선택해 주세요. 담은 메뉴는 그대로예요.'],
};
const NO_RETRY = ['BILLING']; // out of credit: trying again cannot help, so only 화면에서 선택하기 is offered (other connection failures keep 다시 말하기)
const errCopy = (code) => (code === 'BILLING' ? ERR.BILLING : ['MISSING_API_KEY', 'AUTH', 'MODEL'].includes(code) ? ERR.AUTH : ['QUOTA', 'MODEL_BUSY'].includes(code) ? ERR.QUOTA : code === 'SOCKET' ? ERR.SOCKET : ERR.OTHER);
const NO_MIC = { reply: '마이크를 쓸 수 없어요.', next: '아래에 입력하거나 화면에서 선택해 주세요.' };
// shown under the AI's reply: without a microphone the customer must be told typing is the way
const nextHint = () => (S0()?.voice?.mic === 'denied' ? '마이크를 쓸 수 없어요. 아래에 입력하거나 화면에서 선택해 주세요.' : null);
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');

let S0 = () => null;
export function createLive(app) {
  const { P, products, CATS, REC, SUBS } = app;
  const S = () => app.S();
  S0 = S;
  const live = () => window.UXLive;

  const cart = () => ({
    count: app.count(), total: app.total(), hasUnpriced: false,
    lines: S().items.map((i) => ({ menuId: i.pid, name: P[i.pid].name, temp: i.temp, options: app.optLabels(i), qty: i.qty, unitPrice: i.unit, lineTotal: i.unit * i.qty })),
  });
  const ok = (extra = {}) => ({ ok: true, ...extra, cart: cart(), screen: S().screen });
  const err = (error, extra = {}) => ({ ok: false, error, ...extra, cart: cart() });
  const sameOpts = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

  // AI option ids are strings ("1"); v6 keeps the chosen choice's number. "0" (default) is never stored.
  function toOpts(p, temp, o) {
    const out = {};
    for (const [g, c] of Object.entries(o && typeof o === 'object' ? o : {})) {
      const grp = p.options.find((x) => x.id === g), ch = grp && grp.choices.find((x) => x.id === String(c));
      if (!ch || (grp.onlyTemp && grp.onlyTemp !== temp)) return null;
      if (+ch.id) out[g] = +ch.id;
    }
    return out;
  }
  function gridList() { // the list the menu grid shows right now (same rule as syncMenu)
    const s = S(), sub = SUBS[s.cat][s.sub];
    return (s.cat === 1 ? REC : products.filter((p) => p.categories.includes(s.cat))).filter(sub.f || (() => true));
  }
  const basePrice = (p) => app.unit(p.id, p.temps.length ? (p.temps.includes('HOT') ? 'HOT' : p.temps[0]) : null);
  const target = (a) => {
    const hits = S().items.filter((i) => i.pid === a.menuId && (!a.temp || i.temp === a.temp));
    if (!hits.length) return { error: err('not_in_cart') };
    if (hits.length > 1) return { error: err('ambiguous', { choices: hits.map((i) => ({ temp: i.temp, options: app.optLabels(i), qty: i.qty })) }) };
    return { item: hits[0] };
  };

  // One AI request -> kiosk result. Called for every tool the model uses; never throws.
  function apply(name, a) {
    const s = S();
    if (name === 'set_language') return ok({ uiLanguage: 'ko', message: 'This kiosk screen is Korean only. Keep speaking in the customer\'s language; names and prices on screen stay Korean.' });
    if (name === 'set_order_mode') return ok({ message: 'Dine-in or takeout is chosen by the customer on the order check screen by touch. Do not promise it was set.' });
    if (name === 'show_menu_list') {
      const query = norm(a.query), max = Number(a.maxPrice) || 0;
      const catWanted = a.category in CAT_OF ? CAT_OF[a.category] : null;
      let matches = null;
      if (query || max) {
        matches = products.filter((p) => (catWanted == null || (catWanted === 1 ? REC.includes(p) : p.categories.includes(catWanted)))
          && (!query || [p.name, p.english_name, p.description].some((t) => norm(t).includes(query)))
          && (!max || basePrice(p) <= max));
      }
      const cat = catWanted != null ? catWanted : matches && matches.length ? matches[0].categories[0] : s.cat;
      app.selCat(cat);
      const out = { shownCategory: CATS[cat], screenCount: gridList().length };
      if (matches) Object.assign(out, { matchCount: matches.length, matches: matches.slice(0, 10).map((p) => ({ id: p.id, name: p.name, price: basePrice(p), temperatures: p.temps })), note: 'The screen shows the whole category grid. Matches are listed here only: name them aloud, then offer open_menu_detail or add_to_cart.' });
      if ((a.tags && a.tags.length) || (a.sub && a.sub !== 'all')) out.unsupportedFilters = 'taste tags and HOT/ICE sub-filters are not shown on this screen';
      return ok(out);
    }
    if (name === 'open_menu_detail') {
      const p = P[a.menuId];
      if (!p) return err('menu_not_found');
      const temp = a.temp && p.temps.includes(a.temp) ? a.temp : p.temps.length === 1 ? p.temps[0] : null;
      app.openOpt(p.id, { temp, qty: Math.max(1, Math.min(9, Number(a.qty) || 1)) });
      return ok({ menuId: p.id });
    }
    if (name === 'add_to_cart') {
      const p = P[a.menuId];
      if (!p) return err('menu_not_found');
      let temp = null;
      if (p.temps.length === 1) temp = p.temps[0];
      else if (p.temps.length > 1) { if (!p.temps.includes(a.temp)) return err('temperature_required', { supported: p.temps }); temp = a.temp; }
      const qty = Number(a.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 9) return err('invalid_quantity', { max: 9 });
      const opts = toOpts(p, temp, a.opts);
      if (!opts) return err('invalid_option');
      const same = s.items.find((i) => i.pid === p.id && i.temp === temp && sameOpts(i.opts, opts));
      if ((same ? same.qty : 0) + qty > 9) return err('quantity_limit', { max: 9, inCart: same ? same.qty : 0 });
      app.add({ pid: p.id, temp, qty, opts });
      s.key = ''; s.attempt = 0;
      const line = s.items.find((i) => i.pid === p.id && i.temp === temp && sameOpts(i.opts, opts));
      return ok({ added: { menuId: p.id, name: p.name, temp, options: app.optLabels(line), qty, unitPrice: line.unit, lineTotal: line.unit * qty }, priceConfirmed: true });
    }
    if (name === 'update_cart_quantity') {
      const t = target(a);
      if (t.error) return t.error;
      const qty = Math.round(Number(a.qty));
      if (!Number.isInteger(qty) || qty < 0 || qty > 9) return err('invalid_quantity', { max: 9 });
      if (qty === 0) s.items = s.items.filter((i) => i !== t.item); else t.item.qty = qty;
      app.afterCartChange();
      return ok({ updated: { menuId: a.menuId, qty } });
    }
    if (name === 'remove_from_cart') {
      const t = target(a);
      if (t.error) return t.error;
      s.items = s.items.filter((i) => i !== t.item);
      app.afterCartChange();
      return ok({ removed: { menuId: a.menuId } });
    }
    if (name === 'get_cart') return ok();
    if (name === 'request_cancel_order') {
      if (!s.items.length) return err('cart_empty');
      app.askClear(); // the kiosk's own confirmation dialog: the customer has to press it on the screen
      return ok({ awaitingTouchConfirmation: true });
    }
    if (name === 'finish_ordering_to_confirm') {
      if (!s.items.length) return err('cart_empty');
      setTimeout(() => { if (S().items.length && ['menu', 'opt'].includes(S().screen)) app.nav('review'); }, 900); // lets the spoken reply finish first
      return ok({ goingTo: 'order check screen' });
    }
    return err('unknown_action');
  }

  const failVoice = (code) => {
    live().stop();
    const [reply, next] = errCopy(code);
    app.V({ status: 'error', live: 'off', said: '', reply, next, pending: null, noRetry: NO_RETRY.includes(code) });
  };

  const handlers = {
    path: '/api/live?catalog=v6',
    context: (init) => ({ init: !!init, lang: 'ko', screen: S().screen, mode: null, cartCount: app.count(), hasUnpriced: false }), // init=true only once, when the engine reports 'ready' → the AI greets first
    onReady: () => app.V(S().voice?.mic === 'denied' ? { live: 'ready', status: 'listening', said: '', ...NO_MIC } : { live: 'ready', status: 'listening', said: '', reply: '', next: '' }),
    onMic: (st) => { app.V(st === 'denied' ? { mic: 'denied', ...(S().voice?.live === 'ready' ? { status: 'listening', ...NO_MIC } : {}) } : { mic: 'ready' }); },
    onInput: (text, newTurn) => app.V({ status: 'processing', said: newTurn ? text : (S().voice?.said || '') + text, reply: '', next: '', pending: null }),
    onOutput: (text, newTurn) => app.V({ status: 'speaking', reply: newTurn ? text : (S().voice?.reply || '') + text, next: nextHint() || '' }),
    onSpeaking: () => { if (S().voice && S().voice.status !== 'speaking') app.V({ status: 'speaking' }); },
    onSpeakEnd: () => { if (S().voice?.status === 'speaking') app.V({ status: 'listening', next: nextHint() || '더 말하거나 화면에서 눌러 주세요.' }); },
    onInterrupted: () => { if (S().voice) app.V({ status: 'listening' }); },
    onTurnComplete: (silent) => { if (S().voice && silent && S().voice.status !== 'error') app.V({ status: 'listening', next: nextHint() || '더 말하거나 화면에서 눌러 주세요.' }); },
    onAction: ({ id, name, args }) => { let r; try { r = apply(name, args); } catch (e) { console.error('[live] action', name, e); r = err('kiosk_error'); } live().reply(id, r); },
    onError: failVoice,
    onClosed: (reason) => {
      const v = S().voice;
      if (!v || v.live === 'off' || v.status === 'error') return;
      if (reason === 'model' || reason === 'socket') failVoice('SOCKET'); // dropped: say so; cart stays, touch continues
      else { live().stop(); app.endVoice(); } // idle / time limit: close quietly
    },
  };

  return {
    start() {
      if (!window.UXLive) return failVoice('UNKNOWN');
      app.V({ live: 'connecting', mic: 'init', noRetry: false, status: 'processing', said: '', reply: '연결하고 있어요.', next: '잠시만 기다려 주세요.', pending: null });
      live().start(handlers);
    },
    stop() { if (window.UXLive) live().stop(); },
    sendText(text) {
      const t = String(text || '').trim().slice(0, 200);
      if (!t) return;
      if (!window.UXLive || !live().isReady()) return app.V({ status: 'error', live: 'off', reply: errCopy('SOCKET')[0], next: errCopy('SOCKET')[1] });
      app.V({ status: 'processing', said: t, reply: '', next: '', pending: null });
      live().sendText(t);
    },
    sendContext() { if (window.UXLive && live().isReady()) live().sendContext(handlers.context(false)); },
  };
}
