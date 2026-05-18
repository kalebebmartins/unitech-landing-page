import { requireAuth } from '../lib/auth.js';
import { getScripts, setScripts } from '../lib/kv.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Public endpoint (used by middleware/CDN). Returns current scripts.
    const s = await getScripts();
    res.status(200).json(s);
    return;
  }

  if (req.method === 'POST') {
    try { await requireAuth(req); }
    catch (e) { res.status(e.status || 401).json({ error: e.message }); return; }

    const { head = '', footer = '' } = req.body || {};
    if (typeof head !== 'string' || typeof footer !== 'string') {
      res.status(400).json({ error: 'invalid_payload' });
      return;
    }
    if (head.length > 50000 || footer.length > 50000) {
      res.status(400).json({ error: 'payload_too_large' });
      return;
    }
    await setScripts({ head, footer });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
