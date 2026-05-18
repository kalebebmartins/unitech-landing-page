import { requireAuth } from '../lib/auth.js';
import { getContent, setContent } from '../lib/kv.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const c = await getContent();
    res.status(200).json(c);
    return;
  }

  if (req.method === 'POST') {
    try { await requireAuth(req); }
    catch (e) { res.status(e.status || 401).json({ error: e.message }); return; }

    const map = req.body || {};
    if (typeof map !== 'object' || Array.isArray(map)) {
      res.status(400).json({ error: 'invalid_payload' });
      return;
    }
    // Sanitize: keep only string keys with string values, bounded length.
    const clean = {};
    for (const [k, v] of Object.entries(map)) {
      if (typeof k === 'string' && /^[a-z0-9_-]{1,80}$/i.test(k) &&
          typeof v === 'string' && v.length <= 5000) {
        clean[k] = v;
      }
    }
    await setContent(clean);
    res.status(200).json({ ok: true, saved: Object.keys(clean) });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
