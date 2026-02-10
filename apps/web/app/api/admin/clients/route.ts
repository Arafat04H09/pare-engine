// GET /api/admin/clients
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { clients } from '@pare-engine/core';
import { asc, desc, sql } from 'drizzle-orm';
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const sortKey = url.searchParams.get('sort') ?? 'businessName';
    const sortDir = url.searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
    const orderFn = sortDir === 'desc' ? desc : asc;
    const columnMap: Record<string, typeof clients.businessName> = { businessName: clients.businessName, domain: clients.domain, vertical: clients.vertical, currentScore: clients.currentScore, engagementType: clients.engagementType };
    const orderCol = columnMap[sortKey] ?? clients.businessName;
    const result = await db.select().from(clients).orderBy(orderFn(orderCol));
    return NextResponse.json({ clients: result });
  } catch (error) { const m = error instanceof Error ? error.message : 'Unknown'; return NextResponse.json({ error: 'Failed', details: m }, { status: 500 }); }
}
