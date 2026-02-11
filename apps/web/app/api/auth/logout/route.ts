import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';
import { loadWebConfig } from '@pare-engine/core/config';

export async function POST(): Promise<NextResponse> {
  await destroySession();
  const config = loadWebConfig();
  const baseUrl = config.nextPublicUrl || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/admin/login', baseUrl));
}
