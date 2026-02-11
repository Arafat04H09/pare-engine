// Owner: S15 (Audit Form + Stripe)
// Stripe client setup for server-side usage.

import Stripe from 'stripe';
import { loadWebConfig } from '@pare-engine/core/config';

class StripeConfigError extends Error {
  code = 'STRIPE_CONFIG_ERROR' as const;
  constructor(message: string) {
    super(message);
    this.name = 'StripeConfigError';
  }
}

function getStripeSecretKey(): string {
  const config = loadWebConfig();
  const key = config.stripeSecretKey;
  if (!key) {
    throw new StripeConfigError(
      'STRIPE_SECRET_KEY is not set. Add it to your environment variables.'
    );
  }
  return key;
}

function getStripeWebhookSecret(): string {
  const config = loadWebConfig();
  const secret = config.stripeWebhookSecret;
  if (!secret) {
    throw new StripeConfigError(
      'STRIPE_WEBHOOK_SECRET is not set. Add it to your environment variables.'
    );
  }
  return secret;
}

/** Lazy-initialized Stripe client singleton. Avoids throwing during Next.js build. */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2025-12-18.acacia',
      typescript: true,
    });
  }
  return _stripe;
}

/**
 * Convenience re-export. Use `stripe` in route handlers where the env is available.
 * This getter defers initialization until first access.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as Record<string | symbol, unknown>)[prop];
  },
});

/** Webhook secret accessor (lazy -- only called when webhook route runs). */
export { getStripeWebhookSecret };

/** Audit price in cents ($750.00). */
export const AUDIT_PRICE_CENTS = 75000;

/** Audit product name shown in Stripe Checkout. */
export const AUDIT_PRODUCT_NAME = 'Pare GEO Audit -- Full AI Readiness Report';

/** Audit product description shown in Stripe Checkout. */
export const AUDIT_PRODUCT_DESCRIPTION =
  'Comprehensive AI readiness audit: 5-pillar scoring (0-100), branded PDF report, and actionable recommendations for AI engine visibility.';
