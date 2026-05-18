import { kv } from '@vercel/kv';

// Wrappers that fail gracefully when KV isn't configured (e.g. during local
// preview without env vars set). Returns null when KV is unreachable.

async function safe(op) {
  try { return await op(); } catch (e) {
    console.error('[kv] error:', e.message);
    return null;
  }
}

export const KEYS = Object.freeze({
  scripts: 'scripts',
  content: 'content',
  leadsZset: 'leads:index',
  lead: (ts) => `lead:${ts}`,
  user: (username) => `user:${username.toLowerCase()}`,
  usersList: 'users:list'
});

// ----- USERS -----
export async function getUser(username) {
  return safe(() => kv.get(KEYS.user(username)));
}
export async function setUser(username, data) {
  await kv.set(KEYS.user(username), data);
  await kv.sadd(KEYS.usersList, username.toLowerCase());
}
export async function deleteUser(username) {
  await kv.del(KEYS.user(username));
  await kv.srem(KEYS.usersList, username.toLowerCase());
}
export async function listUsers() {
  const set = await safe(() => kv.smembers(KEYS.usersList));
  return set || [];
}

// ----- SCRIPTS (head/footer) -----
export async function getScripts() {
  const v = await safe(() => kv.get(KEYS.scripts));
  return v || { head: '', footer: '' };
}
export async function setScripts({ head = '', footer = '' }) {
  await kv.set(KEYS.scripts, { head, footer });
}

// ----- LP CONTENT -----
export async function getContent() {
  const v = await safe(() => kv.get(KEYS.content));
  return v || {};
}
export async function setContent(map) {
  const current = await getContent();
  await kv.set(KEYS.content, { ...current, ...map });
}

// ----- LEADS -----
export async function pushLead(lead) {
  const ts = Date.now();
  const id = String(ts);
  const data = { id, ts, ...lead };
  await kv.set(KEYS.lead(id), data);
  await kv.zadd(KEYS.leadsZset, { score: ts, member: id });
  return data;
}
export async function listLeads({ limit = 100 } = {}) {
  const ids = await safe(() => kv.zrange(KEYS.leadsZset, 0, limit - 1, { rev: true }));
  if (!ids || !ids.length) return [];
  const items = await Promise.all(ids.map(id => kv.get(KEYS.lead(id))));
  return items.filter(Boolean);
}
export async function deleteLead(id) {
  await kv.del(KEYS.lead(id));
  await kv.zrem(KEYS.leadsZset, id);
}
