// Owner: S13 (Email Delivery). Consumers: S12 (Inngest Pipeline).
// Resend API wrapper for sending audit PDF reports as email attachments.
// Uses React Email templates for branded HTML content.

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { AuditReportEmail } from '../email-templates/audit-report.js';
import { AuditReceiptEmail } from '../email-templates/audit-receipt.js';
import type { DeliverStep } from '../contracts/pipeline.contract.js';
import type { CompositeScore } from '../contracts/scoring.contract.js';
import type { PdfOutput } from '../contracts/report.contract.js';
import type { AuditRequest } from '../contracts/pipeline.contract.js';

// --- Custom Error ---

export class EmailDeliveryError extends Error {
  public readonly code: string;

  constructor(message: string, code: string, cause?: unknown) {
    super(message);
    this.name = 'EmailDeliveryError';
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// --- Types ---

export interface SendReportInput {
  auditRequest: AuditRequest;
  pdf: PdfOutput;
  score: CompositeScore;
}

export interface SendReportOutput {
  emailSent: boolean;
  emailId: string;
  deliveredAt: Date;
}

export interface SendReceiptInput {
  auditRequest: AuditRequest;
  estimatedMinutes?: number;
}

export interface SendReceiptOutput {
  emailSent: boolean;
  emailId: string;
  sentAt: Date;
}

// --- Constants ---

const FROM_ADDRESS = 'Pare Consulting <reports@pareconsulting.com>';
const REPLY_TO_ADDRESS = 'hello@pareconsulting.com';

// --- Helper: Build pillar scores for the email template ---

function buildPillarScoresForEmail(score: CompositeScore): {
  aiVisibility: { score: number; maxScore: number };
  contentQuality: { score: number; maxScore: number };
  schemaStructuredData: { score: number; maxScore: number };
  technicalReadiness: { score: number; maxScore: number };
  localGbp: { score: number; maxScore: number };
} {
  return {
    aiVisibility: {
      score: score.pillars.aiVisibility.score,
      maxScore: score.pillars.aiVisibility.maxScore,
    },
    contentQuality: {
      score: score.pillars.contentQuality.score,
      maxScore: score.pillars.contentQuality.maxScore,
    },
    schemaStructuredData: {
      score: score.pillars.schemaStructuredData.score,
      maxScore: score.pillars.schemaStructuredData.maxScore,
    },
    technicalReadiness: {
      score: score.pillars.technicalReadiness.score,
      maxScore: score.pillars.technicalReadiness.maxScore,
    },
    localGbp: {
      score: score.pillars.localGbp.score,
      maxScore: score.pillars.localGbp.maxScore,
    },
  };
}

// --- Helper: Format date for display ---

function formatAuditDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// --- Main: Send Audit Report Email ---

/**
 * Sends the completed audit report email with the PDF attached.
 * Implements the DeliverStep output contract from pipeline.contract.ts.
 *
 * @param input - The audit request, generated PDF, and composite score
 * @param resendApiKey - Resend API key (from validated config)
 * @returns SendReportOutput with emailSent, emailId, deliveredAt
 */
export async function sendReport(
  input: SendReportInput,
  resendApiKey: string,
): Promise<SendReportOutput> {
  const { auditRequest, pdf, score } = input;

  if (!resendApiKey) {
    throw new EmailDeliveryError(
      'Resend API key is required to send emails',
      'MISSING_API_KEY',
    );
  }

  const resend = new Resend(resendApiKey);

  // Build top findings (up to 3) from the score notes
  const topFindings = extractTopFindings(score);

  // Render the React Email template to HTML
  const emailHtml = await render(
    AuditReportEmail({
      businessName: auditRequest.businessName,
      domain: auditRequest.domain,
      overallScore: score.overallScore,
      letterGrade: score.letterGrade,
      pillarScores: buildPillarScoresForEmail(score),
      topFindings,
      auditDate: formatAuditDate(score.scoredAt),
    }),
  );

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [auditRequest.contactEmail],
      replyTo: REPLY_TO_ADDRESS,
      subject: `Your AI Readiness Audit: ${auditRequest.businessName} scored ${score.overallScore}/100 (${score.letterGrade})`,
      html: emailHtml,
      attachments: [
        {
          filename: pdf.filename,
          content: pdf.buffer,
        },
      ],
    });

    if (result.error) {
      throw new EmailDeliveryError(
        `Resend API error: ${result.error.message}`,
        'RESEND_API_ERROR',
        result.error,
      );
    }

    if (!result.data?.id) {
      throw new EmailDeliveryError(
        'Resend returned success but no email ID',
        'MISSING_EMAIL_ID',
      );
    }

    return {
      emailSent: true,
      emailId: result.data.id,
      deliveredAt: new Date(),
    };
  } catch (error: unknown) {
    if (error instanceof EmailDeliveryError) {
      throw error;
    }

    throw new EmailDeliveryError(
      `Failed to send audit report email: ${error instanceof Error ? error.message : String(error)}`,
      'SEND_FAILED',
      error,
    );
  }
}

// --- Send Audit Receipt (Confirmation) Email ---

/**
 * Sends a confirmation email when an audit is first requested.
 * Lets the client know their audit is being processed.
 *
 * @param input - The audit request details
 * @param resendApiKey - Resend API key (from validated config)
 * @returns SendReceiptOutput with emailSent, emailId, sentAt
 */
export async function sendReceipt(
  input: SendReceiptInput,
  resendApiKey: string,
): Promise<SendReceiptOutput> {
  const { auditRequest, estimatedMinutes = 5 } = input;

  if (!resendApiKey) {
    throw new EmailDeliveryError(
      'Resend API key is required to send emails',
      'MISSING_API_KEY',
    );
  }

  const resend = new Resend(resendApiKey);

  // Render the React Email template to HTML
  const emailHtml = await render(
    AuditReceiptEmail({
      businessName: auditRequest.businessName,
      domain: auditRequest.domain,
      auditType: auditRequest.auditType,
      contactEmail: auditRequest.contactEmail,
      estimatedMinutes,
    }),
  );

  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: [auditRequest.contactEmail],
      replyTo: REPLY_TO_ADDRESS,
      subject: `Audit confirmed: We're analyzing ${auditRequest.businessName}`,
      html: emailHtml,
    });

    if (result.error) {
      throw new EmailDeliveryError(
        `Resend API error: ${result.error.message}`,
        'RESEND_API_ERROR',
        result.error,
      );
    }

    if (!result.data?.id) {
      throw new EmailDeliveryError(
        'Resend returned success but no email ID',
        'MISSING_EMAIL_ID',
      );
    }

    return {
      emailSent: true,
      emailId: result.data.id,
      sentAt: new Date(),
    };
  } catch (error: unknown) {
    if (error instanceof EmailDeliveryError) {
      throw error;
    }

    throw new EmailDeliveryError(
      `Failed to send audit receipt email: ${error instanceof Error ? error.message : String(error)}`,
      'SEND_FAILED',
      error,
    );
  }
}

// --- Helper: Extract top findings from composite score ---

function extractTopFindings(
  score: CompositeScore,
): Array<{ severity: 'critical' | 'warning' | 'info' | 'success'; title: string }> {
  const findings: Array<{
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    priority: number;
  }> = [];

  // Check each pillar for notable results
  const pillars = score.pillars;

  // AI Visibility
  const aiPct = pillars.aiVisibility.score / pillars.aiVisibility.maxScore;
  if (aiPct < 0.3) {
    findings.push({
      severity: 'critical',
      title: `Low AI visibility: ${Math.round(pillars.aiVisibility.score)}/${pillars.aiVisibility.maxScore} across AI engines`,
      priority: 1,
    });
  } else if (aiPct >= 0.8) {
    findings.push({
      severity: 'success',
      title: `Strong AI visibility: mentioned across multiple AI platforms`,
      priority: 5,
    });
  }

  // Content Quality
  const contentPct = pillars.contentQuality.score / pillars.contentQuality.maxScore;
  if (contentPct < 0.3) {
    findings.push({
      severity: 'critical',
      title: `Content needs restructuring for AI engines`,
      priority: 2,
    });
  } else if (contentPct < 0.6) {
    findings.push({
      severity: 'warning',
      title: `Content partially optimized for AI consumption`,
      priority: 3,
    });
  }

  // Schema/Structured Data
  const schemaPct = pillars.schemaStructuredData.score / pillars.schemaStructuredData.maxScore;
  if (schemaPct < 0.3) {
    findings.push({
      severity: 'critical',
      title: `Missing critical structured data (JSON-LD)`,
      priority: 2,
    });
  } else if (schemaPct < 0.6) {
    findings.push({
      severity: 'warning',
      title: `Incomplete structured data markup`,
      priority: 4,
    });
  }

  // Technical Readiness
  const techPct = pillars.technicalReadiness.score / pillars.technicalReadiness.maxScore;
  if (!pillars.technicalReadiness.llmsTxtPresent) {
    findings.push({
      severity: 'warning',
      title: `No llms.txt file found — AI crawlers lack guidance`,
      priority: 3,
    });
  }
  if (techPct >= 0.8) {
    findings.push({
      severity: 'success',
      title: `Technical foundation is solid for AI engines`,
      priority: 6,
    });
  }

  // GBP/Local
  const gbpPct = pillars.localGbp.score / pillars.localGbp.maxScore;
  if (!pillars.localGbp.gbpComplete) {
    findings.push({
      severity: 'warning',
      title: `Google Business Profile is incomplete`,
      priority: 3,
    });
  } else if (gbpPct >= 0.8) {
    findings.push({
      severity: 'success',
      title: `Strong local presence and third-party signals`,
      priority: 6,
    });
  }

  // Also include any notes from the pillar scores
  for (const [, pillar] of Object.entries(pillars)) {
    if (pillar.notes && pillar.notes.length > 0) {
      for (const note of pillar.notes.slice(0, 1)) {
        findings.push({
          severity: 'info',
          title: note,
          priority: 4,
        });
      }
    }
  }

  // Sort by priority (lower = more important) and return top 3
  findings.sort((a, b) => a.priority - b.priority);
  return findings.slice(0, 3).map(({ severity, title }) => ({ severity, title }));
}
