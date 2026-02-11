// Owner: S12 (Inngest Pipeline). Consumers: S15 (Audit Form + Stripe).
// Inngest client setup for the audit-runner app.
// The Inngest client is shared across all pipeline functions.
//
// Event types are defined here so that event senders (e.g. S15's webhook)
// and consumers (pipeline.ts) share a single typed contract.

import { Inngest } from 'inngest';
import type { AuditRequest } from '@pare-engine/core/contracts';

// ---------------------------------------------------------------------------
// Event Definitions
// ---------------------------------------------------------------------------

/**
 * All Inngest events used by the Pare Engine audit pipeline.
 *
 * The key is the event name. The value defines the `data` payload.
 * Inngest SDK uses this for type-safe event sending and consuming.
 */
export interface PareEvents {
  'audit/requested': {
    data: AuditRequest;
  };
  'audit/completed': {
    data: {
      clientId: string;
      auditResultId: string;
      overallScore: number;
      letterGrade: string;
      durationMs: number;
    };
  };
  'monitoring/weekly': {
    data: {
      clientIds: string[];
      triggeredBy: string;
      triggeredAt: string;
    };
  };
}

// ---------------------------------------------------------------------------
// Inngest Client
// ---------------------------------------------------------------------------

/**
 * Shared Inngest client for the Pare Engine.
 *
 * Configuration:
 * - `id`: Unique app identifier for Inngest dashboard.
 * - Signing key and event key are read from env by the Inngest SDK automatically
 *   (`INNGEST_SIGNING_KEY`, `INNGEST_EVENT_KEY`). These are validated by S1's config
 *   but not passed explicitly here — Inngest SDK reads them from process.env.
 */
export const inngest = new Inngest({
  id: 'pare-engine',
});
