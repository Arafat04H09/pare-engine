// GET /api/admin/pipeline — Return recent audit pipeline runs with status and duration.
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { desc, sql } from 'drizzle-orm';

interface PipelineRun {
  id: string;
  clientId: string | null;
  businessName: string | null;
  domain: string | null;
  auditType: string;
  overallScore: number;
  letterGrade: string;
  auditDate: string;
  status: string;
  durationMs: number | null;
  failedSteps: string[];
}

export async function GET(): Promise<NextResponse> {
  try {
    const raw = await db
      .select()
      .from(auditResults)
      .orderBy(desc(auditResults.auditDate))
      .limit(50);

    const enrichResults = await Promise.allSettled(
      raw.map(async (a): Promise<PipelineRun> => {
        let businessName: string | null = null;
        let domain: string | null = null;

        if (a.clientId) {
          const c = await db
            .select({ businessName: clients.businessName, domain: clients.domain })
            .from(clients)
            .where(sql`${clients.id} = ${a.clientId}`)
            .limit(1);
          if (c[0]) {
            businessName = c[0].businessName;
            domain = c[0].domain;
          }
        }

        const details = (a.detailedResults as Record<string, unknown>) ?? {};
        const durationMs = (details.durationMs as number) ?? null;
        const failedPlatforms = Array.isArray(details.failedPlatforms)
          ? (details.failedPlatforms as string[])
          : [];

        // Derive status from audit data
        const status = a.reportPdfUrl
          ? 'completed'
          : failedPlatforms.length > 0
            ? 'partial'
            : 'pending';

        return {
          id: a.id,
          clientId: a.clientId,
          businessName,
          domain,
          auditType: a.auditType,
          overallScore: a.overallScore,
          letterGrade: a.letterGrade,
          auditDate: a.auditDate.toISOString(),
          status,
          durationMs,
          failedSteps: failedPlatforms,
        };
      }),
    );

    const runs = enrichResults
      .filter((r): r is PromiseFulfilledResult<PipelineRun> => r.status === 'fulfilled')
      .map((r) => r.value);

    return NextResponse.json({ runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch pipeline data', details: message }, { status: 500 });
  }
}
