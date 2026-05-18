import { requireAuth } from '../lib/auth.js';
import { pushLead, listLeads, deleteLead } from '../lib/kv.js';

export default async function handler(req, res) {
  // PUBLIC: form submits land here
  if (req.method === 'POST') {
    const body = req.body || {};
    const lead = {
      name:    String(body.name    || '').slice(0, 200),
      company: String(body.company || '').slice(0, 200),
      email:   String(body.email   || '').slice(0, 200),
      phone:   String(body.phone   || '').slice(0, 50),
      qty:     String(body.qty     || '').slice(0, 20),
      brands:  String(body.brands  || '').slice(0, 200),
      help:    String(body.help    || '').slice(0, 1000),
      source:  String(body.source  || 'unknown').slice(0, 40),
      utms:    body.utms && typeof body.utms === 'object' ? body.utms : {},
      ua:      String(req.headers['user-agent'] || '').slice(0, 300),
      ip:      (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim()
    };
    if (!lead.name || !lead.email || !lead.phone) {
      res.status(400).json({ error: 'missing_required_fields' });
      return;
    }
    const saved = await pushLead(lead);
    res.status(200).json({ ok: true, id: saved.id });
    return;
  }

  // PROTECTED: list/delete leads
  try { await requireAuth(req); }
  catch (e) { res.status(e.status || 401).json({ error: e.message }); return; }

  if (req.method === 'GET') {
    const leads = await listLeads({ limit: 200 });
    res.status(200).json({ leads });
    return;
  }

  if (req.method === 'DELETE') {
    const id = (req.query?.id || '').toString();
    if (!id) { res.status(400).json({ error: 'missing_id' }); return; }
    await deleteLead(id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
