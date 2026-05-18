#!/usr/bin/env node
/**
 * Seed script — creates the first admin user.
 *
 * Usage:
 *   1) Make sure you ran `vercel env pull .env.development.local`
 *   2) Run with Node's native --env-file flag:
 *        node --env-file=.env.development.local scripts/seed.js <username> <password>
 */
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';

const [, , usernameArg, passwordArg] = process.argv;

if (!usernameArg || !passwordArg) {
  console.error('Usage: node --env-file=.env.development.local scripts/seed.js <username> <password>');
  process.exit(1);
}

const username = usernameArg.toLowerCase().trim();
const password = passwordArg;

if (!/^[a-z0-9._-]{3,40}$/.test(username)) {
  console.error('Username must be 3-40 chars (a-z 0-9 . _ -).');
  process.exit(1);
}
if (password.length < 8) {
  console.error('Password must be at least 8 characters.');
  process.exit(1);
}

if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
  console.error('Missing Vercel KV env vars. Did you run `vercel env pull .env.development.local` and pass --env-file=?');
  process.exit(1);
}

(async () => {
  try {
    const existing = await kv.get(`user:${username}`);
    if (existing) {
      console.error(`User "${username}" already exists. Aborting.`);
      process.exit(2);
    }
    const hash = await bcrypt.hash(password, 12);
    await kv.set(`user:${username}`, {
      hash,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    await kv.sadd('users:list', username);
    console.log(`✓ Admin user "${username}" created.`);
    console.log(`  Login at: https://unitech-landing-page-eta.vercel.app/admin/`);
  } catch (e) {
    console.error('Seed failed:', e.message);
    process.exit(3);
  }
})();
