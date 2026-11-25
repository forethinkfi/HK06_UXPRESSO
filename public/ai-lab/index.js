// AI Lab shell: builds the tabs, mounts every feature, and bridges to the kiosk when embedded in its overlay.
//
// Feature contract (see features/order.js): export default { id, label, title, soon?, mount({ kiosk, dev }) }
//   kiosk — element for the customer-facing part (shown inside the 540×960 kiosk preview)
//   dev   — element for the developer part (shown in the right-hand panel / "개발자" tab)
// To add a feature: create features/<name>.js and list it in FEATURES below. Nothing else needs to change.
import { $, el, ctx, api, log, showCounter } from './core.js';
import { mountConnection } from './connection.js';
import order from './features/order.js';
import voice from './features/voice.js';
import recommend from './features/recommend.js';

const FEATURES = [order, voice, recommend];

// ---- bridge to the kiosk (public/app.js) — the ONLY coupling between the AI Lab and the kiosk ----
// AI Lab → kiosk: { source:'ai-lab', type:'add-items'|'view-cart'|'close'|'activity', ... }
// kiosk → AI Lab: { source:'kiosk', type:'ack', id, ok, cartCount, cartTotal, needMode, error }
function makeHost() {
  const embedded = new URLSearchParams(location.search).get('embed') === '1' && window.parent !== window;
  if (!embedded) return { embedded: false };
  const pending = new Map();
  const post = (m) => window.parent.postMessage({ source: 'ai-lab', ...m }, location.origin);
  addEventListener('message', (e) => {
    if (e.origin !== location.origin || e.source !== window.parent) return;
    const d = e.data;
    if (d && d.source === 'kiosk' && d.type === 'ack' && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  });
  addEventListener('pointerdown', () => post({ type: 'activity' }), { passive: true }); // keeps the kiosk idle timer quiet while testing
  return {
    embedded: true,
    addItems: (items) => new Promise((resolve) => {
      const id = crypto.randomUUID();
      pending.set(id, resolve);
      post({ type: 'add-items', id, items });
      setTimeout(() => { if (pending.delete(id)) resolve({ ok: false, error: '키오스크에서 응답이 없어요.' }); }, 5000);
    }),
    viewCart: () => post({ type: 'view-cart' }),
    close: () => post({ type: 'close' }),
  };
}

ctx.host = makeHost();
if (ctx.host.embedded) document.documentElement.classList.add('embed');

const lab = $('lab');
const tabs = $('tabs');
const kBody = $('kBody');
const devFeature = $('devFeature');
const sections = new Map();   // feature id -> { kiosk, dev }

ctx.logEl = $('log');
ctx.counterEl = $('counter');
$('btnClear').onclick = () => { ctx.logEl.replaceChildren(); ctx.calls = 0; showCounter(); };

const conn = mountConnection($('devConn'));
for (const f of FEATURES) {
  const kiosk = el('section', { className: 'k-feature', hidden: true });
  const dev = el('div', { className: 'd-feature', hidden: true });
  kBody.append(kiosk); devFeature.append(dev);
  sections.set(f.id, { kiosk, dev });
  f.mount({ kiosk, dev });
}

function select(id) {
  lab.dataset.tab = id;
  for (const f of FEATURES) {
    const s = sections.get(f.id);
    s.kiosk.hidden = f.id !== id; s.dev.hidden = f.id !== id;
  }
  tabs.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === id)));
  const f = FEATURES.find((x) => x.id === id);
  $('kHead').textContent = f ? f.title : '개발자 패널';
}
for (const f of FEATURES) {
  tabs.append(el('button', { className: 'tab', role: 'tab', type: 'button', 'data-tab': f.id, onclick: () => select(f.id) }, f.label, f.soon ? el('small', {}, ' 준비 중') : null));
}
if (ctx.host.embedded) tabs.append(el('button', { className: 'tab', role: 'tab', type: 'button', 'data-tab': 'dev', onclick: () => select('dev') }, '개발자')); // standalone page shows the dev panel beside the preview
select(FEATURES[0].id);

(async () => {
  conn.showConfig();
  const r = await api('/api/ai/config');
  ctx.calls = 0; showCounter();
  if (r.http === 200) { ctx.config = r.json; conn.showConfig(); } else log('err', '서버 설정 확인', r.json.message || `HTTP ${r.http}`);
})();
