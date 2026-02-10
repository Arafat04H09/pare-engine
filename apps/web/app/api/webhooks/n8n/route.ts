// Owner: S17 (Notion Sync + Monitoring Setup).
// Next.js 15 App Router API route: POST /api/webhooks/n8n
//
// n8n fires this webhook on a cron schedule. It validates a shared secret
// header and then sends a 'monitoring/weekly' Inngest event. n8n never runs
// monitoring logic itself (avoids 5-min timeout) -- all heavy work happens
// in Inngest durable steps.

import { NextResponse } from 'next/server';
import { Inngest } from 'inngest';

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class WebhookError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'WebhookError';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Inngest client (web app instance)
// ---------------------------------------------------------------------------

const inngest = new Inngest({ id: 'pare-engine-web' });

// ---------------------------------------------------------------------------
// Security helper
// ---------------------------------------------------------------------------

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[S17] n8n webhook: N8N_WEBHOOK_SECRET environment variable not set');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get('X-N8N-Secret') ?? '';
  if (!providedSecret || !timingSafeEqual(providedSecret, webhookSecret)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  let clientIds: string[] = [];
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await request.json() as { clientIds?: string[] };
      if (Array.isArray(body.clientIds)) {
        clientIds = body.clientIds.filter(
          (id): id is string => typeof id === 'string' && id.length > 0,
        );
      }
    }
  } catch {
    console.warn('[S17] n8n webhook: Failed to parse request body, proceeding with empty clientIds');
  }

  try {
    await inngest.send({
      name: 'monitoring/weekly',
      data: {
        clientIds,
        triggeredBy: 'n8n-webhook',
        triggeredAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      event: 'monitoring/weekly',
      clientCount: clientIds.length || 'all',
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[S17] n8n webhook: Failed to send Inngest event: ${errorMessage}`);

    return NextResponse.json(
      { error: 'Failed to trigger monitoring' },
      { status: 500 },
    );
  }
}
