import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(): Promise<NextResponse> {
  await destroySession();
  return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'));
}
