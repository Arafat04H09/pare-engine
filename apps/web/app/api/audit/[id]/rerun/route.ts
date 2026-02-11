// POST /api/audit/[id]/rerun — Trigger a rerun of an existing audit, linking as child via parentAuditId.
import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { sql } from 'drizzle-orm';
import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'pare-engine' });

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Fetch original audit
    const rows = await db
      .select()
      .from(auditResults)
      .where(sql`${auditResults.id} = ${id}`)
      .limit(1);

    const audit = rows[0];
    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    // Fetch client info if available
    let businessName = 'Unknown';
    let domain = '';
    let vertical = 'general';
    let contactEmail = '';
    let googlePlaceId = '';

    if (audit.clientId) {
      const clientRows = await db
        .select()
        .from(clients)
        .where(sql`${clients.id} = ${audit.clientId}`)
        .limit(1);

      if (clientRows[0]) {
        businessName = clientRows[0].businessName;
        domain = clientRows[0].domain;
        vertical = clientRows[0].vertical;
        contactEmail = clientRows[0].primaryContactEmail ?? '';
        googlePlaceId = clientRows[0].googlePlaceId ?? '';
      }
    }

    // Send audit/requested event with parentAuditId
    await inngest.send({
      name: 'audit/requested',
      data: {
        domain,
        businessName,
        vertical,
        contactEmail,
        auditType: audit.auditType,
        clientId: audit.clientId ?? undefined,
        parentAuditId: id,
        googlePlaceId: googlePlaceId || undefined,
        triggeredBy: 'rerun-api',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Rerun queued for ${businessName} (${domain})`,
      parentAuditId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to trigger rerun', details: message }, { status: 500 });
  }
}
