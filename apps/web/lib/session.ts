import { cookies } from 'next/headers';
import { createHmac, randomBytes } from 'crypto';

const SESSION_COOKIE = 'pare_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET must be set and at least 32 characters');
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function createSession(): Promise<void> {
  const secret = getSecret();
  const id = randomBytes(32).toString('hex');
  const timestamp = Date.now().toString();
  const payload = id + '.' + timestamp;
  const signature = sign(payload, secret);
  const token = payload + '.' + signature;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function validateSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [id, timestamp, signature] = parts;
    if (!id || !timestamp || !signature) return false;

    const secret = getSecret();
    const payload = id + '.' + timestamp;
    const expectedSignature = sign(payload, secret);

    if (signature !== expectedSignature) return false;

    const created = parseInt(timestamp, 10);
    if (isNaN(created)) return false;

    const age = (Date.now() - created) / 1000;
    if (age > SESSION_MAX_AGE) return false;

    return true;
  } catch {
    return false;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
