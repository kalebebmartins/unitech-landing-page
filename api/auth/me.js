import { readCookie, verifySessionToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  const token = readCookie(req);
  const session = await verifySessionToken(token);
  if (!session) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  res.status(200).json({ user: session });
}
