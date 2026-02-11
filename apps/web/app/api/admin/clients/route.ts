// GET/POST /api/admin/clients — List clients or create a new one.
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { clients } from '@pare-engine/core';
import { asc, desc, sql } from 'drizzle-orm';
import { validateSession } from '@/lib/session';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    const body = await request.json();
    const { businessName, domain, vertical } = body;

    if (!businessName || !domain || !vertical) {
      return NextResponse.json(
        { error: 'Missing required fields: businessName, domain, vertical' },
        { status: 400 },
      );
    }

    // Normalize domain
    const normalizedDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    const inserted = await db
      .insert(clients)
      .values({
        businessName,
        domain: normalizedDomain,
        vertical,
        locationCity: body.locationCity ?? null,
        locationState: body.locationState ?? null,
        googlePlaceId: body.googlePlaceId ?? null,
        primaryContactName: body.primaryContactName ?? null,
        primaryContactEmail: body.primaryContactEmail ?? null,
        primaryContactPhone: body.primaryContactPhone ?? null,
        engagementType: body.engagementType ?? 'prospect',
        notes: body.notes ?? null,
      })
      .returning();

    return NextResponse.json({ client: inserted[0] }, { status: 201 });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: 'Failed to create client', details: m }, { status: 500 });
  }
}
