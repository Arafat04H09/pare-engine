// Owner: Task 1.3 (Proposal Engine / Auto-SOW).
// Consumers: generate-proposal tool, proposal PDF template, admin proposal page.
// Defines the data shape for auto-generated Statements of Work (proposals).
// All proposals are DRAFTS — the operator must review before sending.

import { z } from 'zod';

// --- Effort Levels ---

export const ProposalEffortSchema = z.enum(['quick-win', 'sprint', 'ongoing']);
export type ProposalEffort = z.infer<typeof ProposalEffortSchema>;

// --- Line Item ---

export const ProposalLineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  pillar: z.string().min(1), // which scoring pillar this addresses
  price: z.number().int().min(0), // in cents
  effort: ProposalEffortSchema,
  priority: z.number().int().min(1),
});

export type ProposalLineItem = z.infer<typeof ProposalLineItemSchema>;

// --- Full Proposal Data ---

export const ProposalDataSchema = z.object({
  clientName: z.string().min(1),
  domain: z.string().min(1),
  vertical: z.string().min(1),
  auditDate: z.date(),
  overallScore: z.number().int().min(0).max(100),
  letterGrade: z.string().min(1),
  lineItems: z.array(ProposalLineItemSchema).min(1),
  subtotal: z.number().int().min(0), // sum of line items in cents
  executiveSummary: z.string().min(1), // LLM-generated
  estimatedTimeline: z.string().min(1), // e.g., "2-3 weeks"
  generatedAt: z.date(),
  isDraft: z.boolean().default(true), // always true on generation
});

export type ProposalData = z.infer<typeof ProposalDataSchema>;
