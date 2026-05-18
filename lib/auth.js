import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'unitech_session';
const SESSION_TTL = 60 * 60 * 8; // 8 hours

function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET env var missing or too short (min 32 chars).');
  }
  return new TextEncoder().encode(s);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken({ username, role }) {
  return new SignJWT({ username, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .setIssuer('unitech-admin')
    .sign(getSecret());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { issuer: 'unitech-admin' });
    return { username: payload.username, role: payload.role };
  } catch {
    return null;
  }
}

export function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers?.cookie || req.headers?.get?.('cookie') || '';
  const match = header.split(/;\s*/).find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function buildSessionCookie(token, { maxAge = SESSION_TTL } = {}) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${maxAge}`
  ].join('; ');
}

export function buildClearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function requireAuth(req) {
  const token = readCookie(req);
  const session = await verifySessionToken(token);
  if (!session) {
    const err = new Error('unauthorized');
    err.status = 401;
    throw err;
  }
  return session;
}

export const COOKIE_KEY = COOKIE_NAME;
