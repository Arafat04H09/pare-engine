// Owner: S15 (Audit Form + Stripe)
// POST /api/webhooks/stripe -- Handles Stripe webhook events.
// On checkout.session.completed:
//   1. Verifies webhook signature
//   2. Extracts form data from session metadata
//   3. Creates client record in Postgres via Drizzle (idempotent)
//   4. Triggers 'audit/requested' Inngest event

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getStripeWebhookSecret } from '@/lib/stripe';
import { Inngest } from 'inngest';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { clients, auditResults } from '@pare-engine/core';

const inngest = new Inngest({ id: 'pare-web' });

class WebhookError extends Error {
  code = 'WEBHOOK_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'WebhookError';
  }
}

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new WebhookError('DATABASE_URL is not set');
  }
  const pool = new pg.Pool({ connectionString: databaseUrl });
  return drizzle(pool);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let event: Stripe.Event;

  // Step 1: Verify webhook signature
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    console.error('[S15] Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Step 2: Handle the event
  if (event.type === 'checkout.session.completed') {
    try {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } catch (error) {
      console.error('[S15] Failed to handle checkout.session.completed:', error);
      return NextResponse.json(
        { error: 'Internal error processing payment' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const metadata = session.metadata;

  if (!metadata) {
    throw new WebhookError('Checkout session has no metadata');
  }

  const {
    businessName,
    domain,
    vertical,
    contactEmail,
    city,
    state,
    competitors: competitorsJson,
  } = metadata;

  if (!businessName || !domain || !vertical || !contactEmail) {
    throw new WebhookError(
      `Missing required metadata fields. Got: ${JSON.stringify(metadata)}`
    );
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  if (!paymentIntentId) {
    throw new WebhookError('No payment_intent on checkout session');
  }

  const db = getDb();

  // Idempotency check: look for existing audit with this payment intent
  const existingAudits = await db
    .select()
    .from(auditResults)
    .where(eq(auditResults.auditType, `stripe:${paymentIntentId}`))
    .limit(1);

  if (existingAudits.length > 0) {
    console.log(
      `[S15] Duplicate webhook for payment ${paymentIntentId}, skipping.`
    );
    return;
  }

  // Parse competitors from metadata
  let competitors: string[] = [];
  try {
    if (competitorsJson) {
      competitors = JSON.parse(competitorsJson);
    }
  } catch {
    console.warn('[S15] Failed to parse competitors JSON from metadata');
  }

  // Step 3: Create client record
  const [newClient] = await db
    .insert(clients)
    .values({
      businessName,
      domain,
      vertical,
      locationCity: city || null,
      locationState: state || null,
      primaryContactEmail: contactEmail,
      engagementType: 'audit',
      notes: `Stripe payment: ${paymentIntentId}`,
    })
    .returning();

  if (!newClient) {
    throw new WebhookError('Failed to insert client record');
  }

  // Create placeholder audit_results record (idempotency key).
  // The actual audit data is updated by the Inngest pipeline (S12) when it completes.
  await db.insert(auditResults).values({
    clientId: newClient.id,
    auditDate: new Date(),
    auditType: `stripe:${paymentIntentId}`,
    overallScore: 0,
    letterGrade: 'F',
    detailedResults: {
      status: 'pending',
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      submittedAt: new Date().toISOString(),
    },
  });

  // Step 4: Trigger the Inngest audit pipeline
  await inngest.send({
    name: 'audit/requested',
    data: {
      clientId: newClient.id,
      businessName,
      domain,
      vertical,
      city: city || undefined,
      state: state || undefined,
      competitors,
      contactEmail,
      auditType: 'full' as const,
      stripePaymentIntentId: paymentIntentId,
    },
  });

  console.log(
    `[S15] Audit triggered for ${businessName} (${domain}), client ${newClient.id}, payment ${paymentIntentId}`
  );
}
