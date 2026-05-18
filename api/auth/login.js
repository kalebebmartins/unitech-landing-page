import { getUser } from '../../lib/kv.js';
import { verifyPassword, createSessionToken, buildSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { username = '', password = '' } = req.body || {};
  if (!username || !password) {
    res.status(400).json({ error: 'missing_credentials' });
    return;
  }

  // Constant-time-ish: always do bcrypt work even for unknown users to slow
  // username enumeration.
  const user = await getUser(username);
  const hash = user?.hash || '$2a$12$invalidhashplaceholderxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
  const ok = await verifyPassword(password, hash);

  if (!user || !ok) {
    // Small fixed delay
    await new Promise(r => setTimeout(r, 250));
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  const token = await createSessionToken({ username, role: user.role || 'admin' });
  res.setHeader('Set-Cookie', buildSessionCookie(token));
  res.status(200).json({ ok: true, user: { username, role: user.role || 'admin' } });
}
