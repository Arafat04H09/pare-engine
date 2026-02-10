// Owner: S15 (Audit Form + Stripe)
// POST /api/audit/create -- Creates a Stripe Checkout session for a $750 audit.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  stripe,
  AUDIT_PRICE_CENTS,
  AUDIT_PRODUCT_NAME,
  AUDIT_PRODUCT_DESCRIPTION,
} from '@/lib/stripe';

const AuditFormSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  domain: z.string().min(1, 'Domain is required'),
  vertical: z.string().min(1, 'Vertical/industry is required'),
  city: z.string().optional(),
  state: z.string().optional(),
  contactEmail: z.string().email('Valid email is required'),
  competitors: z.array(z.string()).default([]),
});

export type AuditFormData = z.infer<typeof AuditFormSchema>;

class AuditCreateError extends Error {
  code = 'AUDIT_CREATE_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'AuditCreateError';
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = AuditFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const formData = parsed.data;

    const normalizedDomain = formData.domain
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .toLowerCase();

    const metadata: Record<string, string> = {
      businessName: formData.businessName,
      domain: normalizedDomain,
      vertical: formData.vertical,
      contactEmail: formData.contactEmail,
      competitors: JSON.stringify(formData.competitors.slice(0, 5)),
    };

    if (formData.city) metadata.city = formData.city;
    if (formData.state) metadata.state = formData.state;

    const origin = request.headers.get('origin') || request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: formData.contactEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: AUDIT_PRODUCT_NAME,
              description: AUDIT_PRODUCT_DESCRIPTION,
            },
            unit_amount: AUDIT_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      metadata,
      success_url: `${origin}/audit/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/audit?cancelled=true`,
    });

    if (!session.url) {
      throw new AuditCreateError('Stripe did not return a checkout URL');
    }

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('[S15] Failed to create Stripe Checkout session:', error);

    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
