// GET /api/admin/export — Export clients + audit history as CSV.
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { clients, auditResults } from '@pare-engine/core';
import { desc, sql } from 'drizzle-orm';

function escapeCsv(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') ?? 'clients';

    if (type === 'audits') {
      return exportAudits();
    }
    return exportClients();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Export failed', details: message }, { status: 500 });
  }
}

async function exportClients(): Promise<Response> {
  const rows = await db.select().from(clients);

  const headers = [
    'ID', 'Business Name', 'Domain', 'Vertical', 'City', 'State',
    'Contact Name', 'Contact Email', 'Engagement Type', 'Sprint Status',
    'Retainer Tier', 'Initial Score', 'Current Score', 'Created At',
  ];

  const csvRows = rows.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.businessName),
    escapeCsv(r.domain),
    escapeCsv(r.vertical),
    escapeCsv(r.locationCity),
    escapeCsv(r.locationState),
    escapeCsv(r.primaryContactName),
    escapeCsv(r.primaryContactEmail),
    escapeCsv(r.engagementType),
    escapeCsv(r.sprintStatus),
    escapeCsv(r.retainerTier),
    escapeCsv(r.initialAuditScore),
    escapeCsv(r.currentScore),
    escapeCsv(r.createdAt),
  ].join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pare-clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

async function exportAudits(): Promise<Response> {
  const raw = await db
    .select()
    .from(auditResults)
    .orderBy(desc(auditResults.auditDate));

  // Enrich with client names
  const enrichResults = await Promise.allSettled(
    raw.map(async (a) => {
      let businessName = '';
      let domain = '';
      if (a.clientId) {
        const c = await db
          .select({ businessName: clients.businessName, domain: clients.domain })
          .from(clients)
          .where(sql`${clients.id} = ${a.clientId}`)
          .limit(1);
        if (c[0]) {
          businessName = c[0].businessName;
          domain = c[0].domain;
        }
      }
      return { ...a, businessName, domain };
    }),
  );

  const rows = enrichResults
    .filter((r): r is PromiseFulfilledResult<(typeof raw)[0] & { businessName: string; domain: string }> => r.status === 'fulfilled')
    .map((r) => r.value);

  const headers = [
    'ID', 'Business Name', 'Domain', 'Audit Date', 'Audit Type',
    'Overall Score', 'Letter Grade', 'AI Visibility', 'Content',
    'Schema', 'Technical', 'GBP', 'Report URL',
  ];

  const csvRows = rows.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.businessName),
    escapeCsv(r.domain),
    escapeCsv(r.auditDate),
    escapeCsv(r.auditType),
    escapeCsv(r.overallScore),
    escapeCsv(r.letterGrade),
    escapeCsv(r.aiVisibilityScore),
    escapeCsv(r.contentScore),
    escapeCsv(r.schemaScore),
    escapeCsv(r.technicalScore),
    escapeCsv(r.gbpScore),
    escapeCsv(r.reportPdfUrl),
  ].join(','));

  const csv = [headers.join(','), ...csvRows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pare-audits-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
