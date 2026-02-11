// C2: Pipeline Status Dashboard — Real-time visualization of audit pipeline runs.
export const dynamic = 'force-dynamic';

import { db } from '../../../lib/db';
import { auditResults, clients } from '@pare-engine/core';
import { desc, sql } from 'drizzle-orm';
import { StatCard } from '../components/stat-card';
import { ScoreBadge } from '../components/score-badge';
import Link from 'next/link';

const STEP_ORDER = ['crawl', 'query', 'analyze', 'score', 'report', 'deliver'] as const;

function stepBadge(step: string, isCurrent: boolean): string {
  if (isCurrent) return 'bg-teal text-white';
  return 'bg-gray-100 text-gray-500';
}

async function getPipelineData() {
  const raw = await db
    .select()
    .from(auditResults)
    .orderBy(desc(auditResults.auditDate))
    .limit(30);

  const enrichResults = await Promise.allSettled(
    raw.map(async (a) => {
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

      return {
        ...a,
        businessName,
        domain,
        durationMs,
        failedPlatforms,
      };
    }),
  );

  return enrichResults
    .filter(
      (
        r,
      ): r is PromiseFulfilledResult<
        (typeof raw)[0] & {
          businessName: string | null;
          domain: string | null;
          durationMs: number | null;
          failedPlatforms: string[];
        }
      > => r.status === 'fulfilled',
    )
    .map((r) => r.value);
}

export default async function PipelinePage(): Promise<JSX.Element> {
  const runs = await getPipelineData();

  const totalRuns = runs.length;
  const completedRuns = runs.filter((r) => r.reportPdfUrl).length;
  const failedRuns = runs.filter((r) => r.failedPlatforms.length > 0).length;
  const avgDuration = runs.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / (totalRuns || 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor audit pipeline progress and performance.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Runs" value={totalRuns} description="Last 30 audits" />
        <StatCard label="Completed" value={completedRuns} description="With PDF report" />
        <StatCard
          label="With Failures"
          value={failedRuns}
          description="Partial platform failures"
        />
        <StatCard
          label="Avg Duration"
          value={avgDuration > 0 ? `${Math.round(avgDuration / 1000)}s` : '--'}
          description="Average pipeline time"
        />
      </div>

      {/* Pipeline Runs Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Pipeline Runs</h2>
        {runs.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">No pipeline runs yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {runs.map((run) => {
                  const durationStr = run.durationMs
                    ? `${Math.round(run.durationMs / 1000)}s`
                    : '--';
                  const hasFailures = run.failedPlatforms.length > 0;

                  return (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {run.businessName ?? '--'}
                        </div>
                        <div className="text-xs text-gray-400">{run.domain ?? ''}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <ScoreBadge
                          score={run.overallScore}
                          letterGrade={run.letterGrade}
                          size="sm"
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {run.auditType}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {durationStr}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {hasFailures ? (
                          <span
                            className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
                            title={`Failed: ${run.failedPlatforms.join(', ')}`}
                          >
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            Complete
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {new Date(run.auditDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <Link
                          href={`/admin/audits/${run.id}`}
                          className="font-medium text-[#1B2A4A]"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pipeline Steps Legend */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Pipeline Steps
        </h2>
        <div className="flex flex-wrap gap-2">
          {STEP_ORDER.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm capitalize text-gray-700">{step}</span>
              {i < STEP_ORDER.length - 1 && (
                <span className="text-gray-300">&rarr;</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
