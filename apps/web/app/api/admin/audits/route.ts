// GET /api/admin/audits
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { clients, auditResults } from '@pare-engine/core';
import { desc, sql } from 'drizzle-orm';
export async function GET(): Promise<NextResponse> {
  try {
    const raw = await db.select().from(auditResults).orderBy(desc(auditResults.auditDate));
    const enriched = await Promise.allSettled(raw.map(async (a) => { if (!a.clientId) return { ...a, businessName: null as string | null, domain: null as string | null }; const c = await db.select({ businessName: clients.businessName, domain: clients.domain }).from(clients).where(sql`${clients.id} = ${a.clientId}`).limit(1); return { ...a, businessName: c[0]?.businessName ?? null, domain: c[0]?.domain ?? null }; }));
    const audits = enriched.filter((r): r is PromiseFulfilledResult<(typeof raw)[0] & { businessName: string | null; domain: string | null }> => r.status === 'fulfilled').map((r) => r.value);
    return NextResponse.json({ audits });
  } catch (error) { const m = error instanceof Error ? error.message : 'Unknown'; return NextResponse.json({ error: 'Failed', details: m }, { status: 500 }); }
}
