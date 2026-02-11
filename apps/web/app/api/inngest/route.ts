// Inngest serve endpoint — registers all pipeline functions with the Inngest server.
// Functions live in @pare-engine/audit-runner, served via this Next.js API route.
// See: apps/audit-runner/src/inngest.ts for event definitions.

import { serve } from 'inngest/next';
import { inngest } from '@pare-engine/audit-runner/inngest';
import { auditPipeline } from '@pare-engine/audit-runner/pipeline';
import { weeklyMonitor } from '@pare-engine/audit-runner/scheduled/weekly-monitor';
import { monthlyReport } from '@pare-engine/audit-runner/scheduled/monthly-report';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [auditPipeline, weeklyMonitor, monthlyReport],
});
