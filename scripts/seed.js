#!/usr/bin/env node
/**
 * Seed script — creates the first admin user.
 * Usage:
 *   1) Make sure .env has SESSION_SECRET + Vercel KV creds (run `vercel env pull`)
 *   2) Run: node scripts/seed.js <username> <password>
 */
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
loadEnv({ path: resolve(__dirname, '../.env.development.local') });
loadEnv({ path: resolve(__dirname, '../.env') });

const [, , usernameArg, passwordArg] = process.argv;

if (!usernameArg || !passwordArg) {
  console.error('Usage: node scripts/seed.js <username> <password>');
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
    console.log(`  Login at: https://your-domain.vercel.app/admin/`);
  } catch (e) {
    console.error('Seed failed:', e.message);
    console.error('Make sure Vercel KV env vars and SESSION_SECRET are set.');
    process.exit(3);
  }
})();
