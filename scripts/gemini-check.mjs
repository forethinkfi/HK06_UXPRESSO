// PHASE 2 — verify that the Gemini API is really callable with the server-side key.
// Usage: GEMINI_API_KEY=... node scripts/gemini-check.mjs   (optional: GEMINI_MODEL, CHECK_RUNS)
// Shares lib/gemini.mjs with the server's GET /api/ai/status. The key is never printed.
import { checkGemini } from '../lib/gemini.mjs';

const runs = Math.max(1, Number(process.env.CHECK_RUNS) || 3);
const r = await checkGemini({ runs });

if (!r.configured) { console.log(`FAIL  ${r.error}`); process.exit(2); }
if (r.list) console.log(`1. models.list  HTTP ${r.list.status}  ${r.list.ms}ms`);
if (r.models) console.log(`   ${r.models.total} models, ${r.models.generateContent} support generateContent\n   gemini: ${r.models.gemini.join(', ') || '(none)'}`);
if (r.model) console.log(`2. model        ${r.model} (${r.modelSource === 'auto' ? 'auto-selected' : 'from GEMINI_MODEL'})`);
r.calls.forEach((c, i) => {
  console.log(`3.${i + 1} generateContent  HTTP ${c.status}  ${c.ms}ms${c.error ? `  FAIL  ${c.error}` : `  finish=${c.finishReason}  tokens(in/out)=${c.tokensIn}/${c.tokensOut}  json=${c.jsonOk ? 'ok' : 'INVALID'}`}`);
  if (c.parsed) console.log(`     response: ${JSON.stringify(c.parsed)}`); else if (c.raw) console.log(`     response: ${c.raw}`);
});
const ok = r.calls.filter((c) => c.status === 200);
if (ok.length) { const t = ok.map((c) => c.ms); console.log(`4. latency      min ${Math.min(...t)}ms / avg ${Math.round(t.reduce((a, b) => a + b, 0) / t.length)}ms / max ${Math.max(...t)}ms (${ok.length}/${r.calls.length} ok)`); }
console.log(r.ok ? 'RESULT  OK — real Gemini API call succeeded (not a mock)' : `RESULT  FAIL — ${r.error}`);
process.exit(r.ok ? 0 : 1);
