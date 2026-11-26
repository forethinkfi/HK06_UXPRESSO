// FAKE Supabase REST (PostgREST) for tests only: implements POST /rest/v1/rpc/create_order with the same rules as the SQL
// function (idempotency_key, sequential order_number, total check). It proves the server/kiosk logic. It does NOT prove the SQL:
// that is checked by supabase/tests/rpc_checks.sql on a real PostgreSQL, and against the real project by scripts/supabase-smoke.mjs.
//   control:  POST /__fail?n=2  -> next n calls answer 500 · POST /__hang?n=1 -> next n calls never answer · GET /__state · POST /__reset
import { createServer } from 'node:http';

export function startFakeSupabase(port, expectKey) {
  const orders = new Map(); // idempotency_key -> { id, order_number, record }
  let seq = 0, fail = 0, hang = 0, calls = 0;
  const seen = []; // request headers of the calls (to prove which key/headers the server sent)
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const json = (c, b) => { res.writeHead(c, { 'content-type': 'application/json' }); res.end(JSON.stringify(b)); };
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      if (u.pathname === '/__fail') { fail = Number(u.searchParams.get('n') || 1); return json(200, { fail }); }
      if (u.pathname === '/__hang') { hang = Number(u.searchParams.get('n') || 1); return json(200, { hang }); }
      if (u.pathname === '/__reset') { orders.clear(); seq = 0; fail = 0; hang = 0; calls = 0; seen.length = 0; return json(200, {}); }
      if (u.pathname === '/__state') return json(200, { calls, seen, orders: [...orders.values()] });
      if (u.pathname !== '/rest/v1/rpc/create_order' || req.method !== 'POST') return json(404, { message: 'not found' });
      calls++; seen.push({ apikey: req.headers.apikey, authorization: req.headers.authorization || null });
      if (req.headers.apikey !== expectKey) return json(401, { message: 'Invalid API key' });
      if (hang > 0) { hang--; return; }
      if (fail > 0) { fail--; return json(500, { message: 'simulated outage' }); }
      const o = JSON.parse(body || '{}').p_order || {};
      const hit = orders.get(o.idempotency_key);
      if (hit) return json(200, { order_id: hit.id, order_number: hit.order_number, duplicate: true });
      const sum = (o.items || []).reduce((s, i) => s + i.unit_price * i.quantity, 0);
      if (!o.items?.length || sum !== o.subtotal_price || o.total_price !== Math.max(0, o.subtotal_price - o.discount_amount)) return json(400, { code: '22023', message: 'order_total_mismatch' });
      const rec = { id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`, order_number: seq, record: o };
      orders.set(o.idempotency_key, rec);
      json(200, { order_id: rec.id, order_number: rec.order_number, duplicate: false });
    });
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}
