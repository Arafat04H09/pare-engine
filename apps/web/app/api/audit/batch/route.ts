// POST /api/audit/batch — Queue multiple audit requests via Inngest events.
import { NextResponse } from 'next/server';
import { Inngest } from 'inngest';

const inngest = new Inngest({ id: 'pare-engine' });

interface BatchItem {
  domain: string;
  businessName?: string;
  vertical?: string;
  contactEmail?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const items: BatchItem[] = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing or empty items array' },
        { status: 400 },
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 domains per batch' },
        { status: 400 },
      );
    }

    // Validate each item has a domain
    for (const item of items) {
      if (!item.domain || typeof item.domain !== 'string') {
        return NextResponse.json(
          { error: `Invalid domain in batch: ${JSON.stringify(item)}` },
          { status: 400 },
        );
      }
    }

    // Normalize domains and fire Inngest events
    const results = await Promise.allSettled(
      items.map(async (item) => {
        const domain = item.domain
          .replace(/^https?:\/\//, '')
          .replace(/\/+$/, '')
          .toLowerCase();

        await inngest.send({
          name: 'audit/requested',
          data: {
            domain,
            businessName: item.businessName ?? domain,
            vertical: item.vertical ?? 'general',
            contactEmail: item.contactEmail ?? '',
            auditType: 'mini',
            triggeredBy: 'batch-api',
          },
        });

        return { domain, status: 'queued' as const };
      }),
    );

    const queued = results
      .filter((r): r is PromiseFulfilledResult<{ domain: string; status: 'queued' }> => r.status === 'fulfilled')
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map((r, i) => ({ domain: items[i]?.domain ?? 'unknown', error: String(r.reason) }));

    return NextResponse.json({
      queued: queued.length,
      failed: failed.length,
      results: [...queued, ...failed.map((f) => ({ domain: f.domain, status: 'failed' as const, error: f.error }))],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Batch audit failed', details: message }, { status: 500 });
  }
}
