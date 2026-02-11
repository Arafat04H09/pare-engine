// POST /api/admin/audits/[id]/rerun
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Inngest } from 'inngest';
import { validateSession } from '@/lib/session';

const inngest = new Inngest({ id: 'pare-engine-web' });

const RerunBodySchema = z.object({
  clientId: z.string().min(1),
  businessName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
  contactEmail: z.string().email().optional().default(''),
  googlePlaceId: z.string().optional(),
  auditType: z.enum(['full', 'mini']).optional().default('full'),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    if (!(await validateSession())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const raw = await request.json();
    const parsed = RerunBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    await inngest.send({
      name: 'audit/requested',
      data: {
        clientId: body.clientId,
        businessName: body.businessName,
        domain: body.domain,
        vertical: body.vertical,
        contactEmail: body.contactEmail,
        googlePlaceId: body.googlePlaceId,
        auditType: body.auditType,
        triggeredFrom: 'admin-dashboard',
        triggeredAt: new Date().toISOString(),
      },
    });
    return NextResponse.json({ success: true, message: `Audit re-run triggered for ${body.businessName}`, clientId: id });
  } catch (error) {
    const m = error instanceof Error ? error.message : 'Unknown';
    return NextResponse.json({ error: 'Failed to trigger audit re-run', details: m }, { status: 500 });
  }
}
