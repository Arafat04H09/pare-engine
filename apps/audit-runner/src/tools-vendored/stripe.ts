// Owner: S22 (Production Deployment)
//
// Static vendored replacement for the Stripe MCP server.
// In development, the Stripe MCP server (@stripe/agent-toolkit) provides
// interactive tools for managing customers, invoices, and subscriptions.
// In production, Stripe is accessed via the Stripe Node.js SDK directly
// through the webhook handlers in apps/web/app/api/.
//
// MCP server replaced: stripe (from .claude/settings.json)
// Underlying library: stripe (Node.js SDK)
//
// Note: Stripe webhooks and API calls in production live in:
//   - apps/web/app/api/stripe/webhook/route.ts (webhook handler)
//   - apps/web/app/api/audit/route.ts (payment verification)
// These files import Stripe directly. This vendored stub provides
// typed tool definitions for any AI SDK tool usage.

import { z } from 'zod';

/**
 * Tool definition: Create a Stripe customer.
 */
export const stripeCreateCustomerInputSchema = z.object({
  email: z.string().email().describe('Customer email address'),
  name: z.string().min(1).describe('Customer name or business name'),
  metadata: z.record(z.string()).optional().describe('Key-value metadata to attach'),
});

export type StripeCreateCustomerInput = z.infer<typeof stripeCreateCustomerInputSchema>;

/**
 * Tool definition: Create a Stripe checkout session.
 */
export const stripeCreateCheckoutInputSchema = z.object({
  priceId: z.string().min(1).describe('Stripe Price ID for the product'),
  customerEmail: z.string().email().describe('Pre-fill customer email on checkout'),
  successUrl: z.string().url().describe('URL to redirect to after successful payment'),
  cancelUrl: z.string().url().describe('URL to redirect to on cancellation'),
  metadata: z.record(z.string()).optional().describe('Metadata passed through to the session'),
});

export type StripeCreateCheckoutInput = z.infer<typeof stripeCreateCheckoutInputSchema>;

/**
 * Tool definition: Retrieve a Stripe payment intent.
 */
export const stripeGetPaymentInputSchema = z.object({
  paymentIntentId: z.string().min(1).describe('Stripe Payment Intent ID (pi_...)'),
});

export type StripeGetPaymentInput = z.infer<typeof stripeGetPaymentInputSchema>;

/**
 * Aggregated tool definitions for the Stripe MCP replacement.
 *
 * In production, these are not invoked via AI SDK tools — Stripe is
 * called directly from the webhook route and API handlers. These
 * definitions exist for type safety and documentation of the
 * Stripe integration surface area.
 */
export const stripeTools = {
  createCustomer: {
    name: 'stripe_create_customer' as const,
    description: 'Create a new Stripe customer',
    inputSchema: stripeCreateCustomerInputSchema,
  },
  createCheckout: {
    name: 'stripe_create_checkout' as const,
    description: 'Create a Stripe Checkout Session for payment',
    inputSchema: stripeCreateCheckoutInputSchema,
  },
  getPayment: {
    name: 'stripe_get_payment' as const,
    description: 'Retrieve a Stripe Payment Intent by ID',
    inputSchema: stripeGetPaymentInputSchema,
  },
} as const;
