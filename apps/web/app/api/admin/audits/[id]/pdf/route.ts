// GET /api/admin/audits/[id]/pdf
import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { auditResults } from '@pare-engine/core';
import { sql } from 'drizzle-orm';
import { validateSession } from '@/lib/session';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse | Response> {
  try {
    if (!(await validateSession())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
    const { id } = await params;
    const rows = await db.select({ detailedResults: auditResults.detailedResults, reportPdfUrl: auditResults.reportPdfUrl }).from(auditResults).where(sql`${auditResults.id} = ${id}`).limit(1);
    const audit = rows[0]; if (!audit) { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
    const details = (audit.detailedResults as Record<string, unknown> | null) ?? {};
    const pdfBuffer = details.pdfBuffer;
    if (typeof pdfBuffer === 'string' && pdfBuffer.length > 0) { const buf = Buffer.from(pdfBuffer, 'base64'); return new Response(buf, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="audit-${id}.pdf"`, 'Content-Length': String(buf.length) } }); }
    if (audit.reportPdfUrl) { return NextResponse.redirect(audit.reportPdfUrl); }
    return NextResponse.json({ error: 'No PDF available' }, { status: 404 });
  } catch (error) { const m = error instanceof Error ? error.message : 'Unknown'; return NextResponse.json({ error: 'Failed', details: m }, { status: 500 }); }
}
