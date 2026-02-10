import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'pare_session';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

async function hmacSign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return redirectToLogin(request, true);
  }

  const [id, timestamp, signature] = parts;
  if (!id || !timestamp || !signature) {
    return redirectToLogin(request, true);
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return redirectToLogin(request, true);
  }

  const payload = id + '.' + timestamp;
  const expectedSignature = await hmacSign(payload, secret);

  if (signature !== expectedSignature) {
    return redirectToLogin(request, true);
  }

  const created = parseInt(timestamp, 10);
  if (isNaN(created)) {
    return redirectToLogin(request, true);
  }

  const age = (Date.now() - created) / 1000;
  if (age > SESSION_MAX_AGE) {
    return redirectToLogin(request, true);
  }

  return NextResponse.next();
}

function redirectToLogin(
  request: NextRequest,
  clearCookie = false,
): NextResponse {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', request.nextUrl.pathname);

  const response = NextResponse.redirect(loginUrl);

  if (clearCookie) {
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
