import { requireAuth, hashPassword } from '../lib/auth.js';
import { getUser, setUser, deleteUser, listUsers } from '../lib/kv.js';

export default async function handler(req, res) {
  let session;
  try { session = await requireAuth(req); }
  catch (e) { res.status(e.status || 401).json({ error: e.message }); return; }

  if (req.method === 'GET') {
    const usernames = await listUsers();
    const users = await Promise.all(usernames.map(async (u) => {
      const data = await getUser(u);
      return { username: u, role: data?.role || 'admin', createdAt: data?.createdAt || null };
    }));
    res.status(200).json({ users, me: session.username });
    return;
  }

  if (req.method === 'POST') {
    const { username = '', password = '', role = 'admin' } = req.body || {};
    if (!/^[a-z0-9._-]{3,40}$/i.test(username) || password.length < 8) {
      res.status(400).json({ error: 'invalid_input' });
      return;
    }
    const existing = await getUser(username);
    if (existing) { res.status(409).json({ error: 'user_exists' }); return; }
    const hash = await hashPassword(password);
    await setUser(username, { hash, role, createdAt: new Date().toISOString() });
    res.status(201).json({ ok: true });
    return;
  }

  if (req.method === 'DELETE') {
    const username = (req.query?.username || '').toString();
    if (!username) { res.status(400).json({ error: 'missing_username' }); return; }
    if (username.toLowerCase() === session.username.toLowerCase()) {
      res.status(400).json({ error: 'cannot_delete_self' });
      return;
    }
    const remaining = (await listUsers()).filter(u => u !== username.toLowerCase());
    if (remaining.length < 1) { res.status(400).json({ error: 'need_at_least_one_admin' }); return; }
    await deleteUser(username);
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === 'PATCH') {
    // Allow a user to change their own password
    const { password = '' } = req.body || {};
    if (password.length < 8) { res.status(400).json({ error: 'password_too_short' }); return; }
    const user = await getUser(session.username);
    if (!user) { res.status(404).json({ error: 'user_not_found' }); return; }
    user.hash = await hashPassword(password);
    user.updatedAt = new Date().toISOString();
    await setUser(session.username, user);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
