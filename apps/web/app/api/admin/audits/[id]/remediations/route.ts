// GET/POST /api/admin/audits/[id]/remediations — CRUD for remediation items.
import { NextResponse } from 'next/server';
import { db } from '../../../../../../lib/db';
import { remediationItems } from '@pare-engine/core';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    const items = await db
      .select()
      .from(remediationItems)
      .where(eq(remediationItems.auditId, id));

    return NextResponse.json({ remediations: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch remediations', details: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json();

    const { type, originalContent, presentationMarkdown } = body;

    if (!type || typeof type !== 'string') {
      return NextResponse.json({ error: 'Missing required field: type' }, { status: 400 });
    }

    const inserted = await db
      .insert(remediationItems)
      .values({
        auditId: id,
        type,
        status: 'draft',
        originalContent: originalContent ?? null,
        presentationMarkdown: presentationMarkdown ?? null,
      })
      .returning();

    return NextResponse.json({ remediation: inserted[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create remediation', details: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: _auditId } = await params;
    const body = await request.json();
    const { remediationId, status, currentContent } = body;

    if (!remediationId) {
      return NextResponse.json({ error: 'Missing remediationId' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (currentContent !== undefined) updates.currentContent = currentContent;

    await db
      .update(remediationItems)
      .set(updates)
      .where(sql`${remediationItems.id} = ${remediationId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update remediation', details: message }, { status: 500 });
  }
}
