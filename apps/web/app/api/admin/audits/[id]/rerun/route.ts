// POST /api/admin/audits/[id]/rerun
import { NextResponse } from 'next/server';
import { Inngest } from 'inngest';
const inngest = new Inngest({ id: 'pare-engine-web' });
interface Body { clientId: string; businessName: string; domain: string; vertical: string; contactEmail: string; googlePlaceId?: string; auditType?: 'full' | 'mini'; }
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as Body;
    if (!body.clientId || !body.businessName || !body.domain || !body.vertical) { return NextResponse.json({ error: 'Missing fields' }, { status: 400 }); }
    await inngest.send({ name: 'audit/requested', data: { clientId: body.clientId, businessName: body.businessName, domain: body.domain, vertical: body.vertical, contactEmail: body.contactEmail || '', googlePlaceId: body.googlePlaceId, auditType: body.auditType ?? 'full', triggeredFrom: 'admin-dashboard', triggeredAt: new Date().toISOString() } });
    return NextResponse.json({ success: true, message: `Audit re-run triggered for ${body.businessName}`, clientId: id });
  } catch (error) { const m = error instanceof Error ? error.message : 'Unknown'; return NextResponse.json({ error: 'Failed', details: m }, { status: 500 }); }
}
