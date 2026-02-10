# S13: Email Delivery

## Mission
Build React Email templates with Pare branding and wire Resend API for sending audit PDF reports as email attachments.

## Agent
GEMINI — React Email template generation is volume HTML/CSS work that benefits from large context for brand guidelines.

## Input Contracts (read from `@pare-engine/core/contracts`)
- `DeliverStep` from `pipeline.contract.ts`
- `PdfOutput` from `report.contract.ts`
- `ValidatedConfig` from `config.contract.ts` (for Resend API key)

## Output Contracts (this session implements)
- `DeliverStep` output from `pipeline.contract.ts`

## Files OWNED (exclusive write access)
- `packages/core/src/email-templates/audit-report.tsx`
- `packages/core/src/email-templates/audit-receipt.tsx`
- `packages/core/src/tools/send-report.ts`

## Files READ-ONLY (import, do not modify)
- All contract files
- `packages/report-generator/src/styles.ts` (brand colors)

## Scaffold Salvage
- `packages/report-generator/src/styles.ts` → Brand color values for email template styling

## Dependencies
- S1 must complete first because it provides the config for the Resend API key.

## Exit Criteria
- `audit-report.tsx` React Email template: branded header, score summary, "Your full report is attached" body, CTA button
- `audit-receipt.tsx` React Email template: branded "Audit received, processing" confirmation
- `sendReport(input: DeliverStep['input']): Promise<DeliverStep['output']>` sends email via Resend with PDF attachment
- Email renders correctly in Gmail, Outlook, Apple Mail (test via React Email preview)
- Uses Resend SDK, not raw SMTP
- Returns `{ emailSent: boolean, emailId: string, deliveredAt: Date }`

## Known Bugs to Fix
None — greenfield code
