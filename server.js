// UXPRESSO kiosk prototype server: zero-dependency static host + self-made menu API (test data, not an official API).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 3000;
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml' };
const load = async () => JSON.parse(await readFile(join(ROOT, 'data/menus.json'), 'utf8'));
const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

async function api(req, res, url) {
  const data = await load();
  const p = url.pathname;
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (p === '/api/categories') return send(res, 200, data.categories);
  if (p === '/api/menus') {
    const tags = (url.searchParams.get('tags') || '').split(',').filter(Boolean); // all tags must match
    return send(res, 200, data.menus.filter((m) => tags.every((t) => m.tags.includes(t))));
  }
  const one = p.match(/^\/api\/menus\/([\w-]+)$/);
  if (one) {
    const m = data.menus.find((x) => x.id === one[1]);
    return m ? send(res, 200, m) : send(res, 404, { error: 'not_found' });
  }
  send(res, 404, { error: 'not_found' });
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    const f = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^(\.\.[/\\])+/, '');
    const base = f.startsWith('/data/') ? ROOT : join(ROOT, 'public');
    const buf = await readFile(join(base, f));
    res.writeHead(200, { 'content-type': (MIME[extname(f)] || 'application/octet-stream') + '; charset=utf-8' });
    res.end(buf);
  } catch { send(res, 404, { error: 'not_found' }); }
}).listen(PORT, () => console.log(`UXPRESSO kiosk → http://localhost:${PORT}`));
