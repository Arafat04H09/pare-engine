// Verification results page — shows delta between current and previous audit.
// Owner: Task 1.1 (Verification Engine + Delta Tool)

export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { clients, auditResults } from '@pare-engine/core';
import { sql } from 'drizzle-orm';
import { ScoreCircle } from '../../../components/score-badge';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ---------------------------------------------------------------------------
// Types for the delta summary stored in JSONB
// ---------------------------------------------------------------------------

interface PillarDeltaRow {
  pillar: string;
  before: number;
  after: number;
  delta: number;
  maxScore: number;
  percentageChange: number;
  direction: 'improved' | 'declined' | 'unchanged';
}

interface DeltaSummary {
  isFirstAudit: boolean;
  currentScore?: number;
  currentGrade?: string;
  pillarDeltas?: PillarDeltaRow[] | null;
  overallDelta?: {
    before: number;
    after: number;
    delta: number;
    percentageChange: number;
    direction: 'improved' | 'declined' | 'unchanged';
  } | null;
  gradeChange?: {
    before: string;
    after: string;
    changed: boolean;
    improved: boolean;
  } | null;
  biggestImprovement?: PillarDeltaRow | null;
  biggestDecline?: PillarDeltaRow | null;
  pillarsImproved?: number;
  pillarsDeclined?: number;
  pillarsUnchanged?: number;
  calculatedAt?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function directionColor(direction: string): string {
  switch (direction) {
    case 'improved': return 'text-green-600';
    case 'declined': return 'text-red-600';
    default: return 'text-gray-400';
  }
}

function directionArrow(direction: string): string {
  switch (direction) {
    case 'improved': return '\u25B2'; // up triangle
    case 'declined': return '\u25BC'; // down triangle
    default: return '\u2014'; // em dash
  }
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  if (delta < 0) return `${delta}`;
  return '0';
}

// ---------------------------------------------------------------------------
// Page Props
// ---------------------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function VerifyPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch the audit
  const rows = await db
    .select()
    .from(auditResults)
    .where(sql`${auditResults.id} = ${id}`)
    .limit(1);

  const audit = rows[0];
  if (!audit) {
    notFound();
  }

  // Fetch client info
  let clientName = '--';
  let clientDomain = '';
  if (audit.clientId) {
    const cr = await db
      .select({ businessName: clients.businessName, domain: clients.domain })
      .from(clients)
      .where(sql`${clients.id} = ${audit.clientId}`)
      .limit(1);
    if (cr[0]) {
      clientName = cr[0].businessName;
      clientDomain = cr[0].domain;
    }
  }

  // Parse the delta summary from JSONB
  const deltaSummary = audit.deltaSummary as DeltaSummary | null;

  // --- No delta data available ---
  if (!deltaSummary) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/admin/audits/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Audit
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Verification Results</h1>
          <p className="text-sm text-gray-500">
            {clientName} ({clientDomain}) &mdash;{' '}
            {new Date(audit.auditDate).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-white p-12 shadow-sm">
          <div className="mb-4 text-4xl text-gray-300">&mdash;</div>
          <h2 className="text-lg font-semibold text-gray-700">No Verification Data Available</h2>
          <p className="mt-2 max-w-md text-center text-sm text-gray-500">
            This audit does not have verification data yet. Run a re-audit to compare
            the current score against this baseline.
          </p>
          <Link
            href={`/admin/clients/${audit.clientId ?? ''}`}
            className="mt-6 inline-flex items-center rounded-md bg-[#1B2A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D4A7A] transition-colors"
          >
            Go to Client &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // --- First audit (baseline, no previous data) ---
  if (deltaSummary.isFirstAudit) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/admin/audits/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
            &larr; Back to Audit
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Verification Results</h1>
          <p className="text-sm text-gray-500">
            {clientName} ({clientDomain}) &mdash;{' '}
            {new Date(audit.auditDate).toLocaleDateString()}
          </p>
        </div>

        <div className="rounded-lg border border-[#00D4AA] bg-gradient-to-br from-[#1B2A4A] to-[#2D4A7A] p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-white">Baseline Audit Established</h2>
          <p className="mt-2 text-sm text-[#00D4AA]">
            This is the first audit for {clientName}. No previous data to compare against.
          </p>
          <div className="mt-6 flex items-center justify-center gap-4">
            <ScoreCircle score={deltaSummary.currentScore ?? audit.overallScore} letterGrade={deltaSummary.currentGrade ?? audit.letterGrade} size={120} />
          </div>
          <p className="mt-4 text-xs text-gray-300">
            Future audits will use this as the baseline for comparison.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href={`/admin/audits/${id}`}
            className="inline-flex items-center rounded-md bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white hover:bg-[#00B894] transition-colors"
          >
            &larr; Back to Audit Detail
          </Link>
        </div>
      </div>
    );
  }

  // --- Full comparison delta ---
  const overallDelta = deltaSummary.overallDelta;
  const gradeChange = deltaSummary.gradeChange;
  const pillarDeltas = deltaSummary.pillarDeltas ?? [];
  const biggestImprovement = deltaSummary.biggestImprovement;
  const biggestDecline = deltaSummary.biggestDecline;
  const pillarsImproved = deltaSummary.pillarsImproved ?? 0;
  const pillarsDeclined = deltaSummary.pillarsDeclined ?? 0;
  const pillarsUnchanged = deltaSummary.pillarsUnchanged ?? 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div>
        <Link href={`/admin/audits/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Back to Audit
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Verification Results</h1>
        <p className="text-sm text-gray-500">
          {clientName} ({clientDomain}) &mdash;{' '}
          {new Date(audit.auditDate).toLocaleDateString()}
        </p>
      </div>

      {/* Overall Score Comparison */}
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">Overall Score</h2>
        {overallDelta ? (
          <div className="flex items-center justify-center gap-10">
            {/* Before */}
            <div className="flex flex-col items-center">
              <span className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Previous
              </span>
              <ScoreCircle
                score={overallDelta.before}
                letterGrade={gradeChange?.before ?? null}
                size={120}
              />
            </div>

            {/* Arrow + Delta */}
            <div className="flex flex-col items-center gap-1">
              <span className={`text-3xl ${directionColor(overallDelta.direction)}`}>
                {directionArrow(overallDelta.direction)}
              </span>
              <span className={`font-mono text-2xl font-bold ${directionColor(overallDelta.direction)}`}>
                {formatDelta(overallDelta.delta)}
              </span>
            </div>

            {/* After */}
            <div className="flex flex-col items-center">
              <span className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Current
              </span>
              <ScoreCircle
                score={overallDelta.after}
                letterGrade={gradeChange?.after ?? null}
                size={120}
              />
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-gray-500">No overall delta data available.</p>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="font-mono text-3xl font-bold text-green-600">{pillarsImproved}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Improved
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="font-mono text-3xl font-bold text-red-600">{pillarsDeclined}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Declined
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="font-mono text-3xl font-bold text-gray-400">{pillarsUnchanged}</div>
          <div className="mt-1 text-xs font-medium uppercase tracking-wider text-gray-400">
            Unchanged
          </div>
        </div>
      </div>

      {/* Per-Pillar Breakdown Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <h3 className="border-b border-gray-200 px-6 py-4 text-base font-semibold text-gray-900">
          Pillar-by-Pillar Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pillar
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Before
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  After
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Delta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pillarDeltas.map((p) => {
                const beforePct = p.maxScore > 0 ? Math.round((p.before / p.maxScore) * 100) : 0;
                const afterPct = p.maxScore > 0 ? Math.round((p.after / p.maxScore) * 100) : 0;

                return (
                  <tr key={p.pillar}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {p.pillar}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-mono text-sm text-gray-600">
                      {p.before}/{p.maxScore}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center font-mono text-sm text-gray-600">
                      {p.after}/{p.maxScore}
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-center font-mono text-sm font-bold ${directionColor(p.direction)}`}>
                      <span className="mr-1">{directionArrow(p.direction)}</span>
                      {formatDelta(p.delta)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full">
                        {/* Before bar */}
                        <div className="mb-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gray-400"
                            style={{ width: `${beforePct}%` }}
                          />
                        </div>
                        {/* After bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${afterPct}%`,
                              backgroundColor: p.direction === 'improved'
                                ? '#22C55E'
                                : p.direction === 'declined'
                                  ? '#EF4444'
                                  : '#94A3B8',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biggest Improvement & Biggest Decline */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Biggest Improvement */}
        <div className={`rounded-lg border p-5 shadow-sm ${biggestImprovement ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Biggest Improvement
          </div>
          {biggestImprovement ? (
            <>
              <div className="text-base font-semibold text-gray-900">{biggestImprovement.pillar}</div>
              <div className="font-mono text-2xl font-bold text-green-600">
                {formatDelta(biggestImprovement.delta)}
              </div>
              <div className="text-xs text-gray-500">
                {biggestImprovement.before} &rarr; {biggestImprovement.after} / {biggestImprovement.maxScore}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No pillars improved</div>
          )}
        </div>

        {/* Biggest Decline */}
        <div className={`rounded-lg border p-5 shadow-sm ${biggestDecline ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Biggest Decline
          </div>
          {biggestDecline ? (
            <>
              <div className="text-base font-semibold text-gray-900">{biggestDecline.pillar}</div>
              <div className="font-mono text-2xl font-bold text-red-600">
                {formatDelta(biggestDecline.delta)}
              </div>
              <div className="text-xs text-gray-500">
                {biggestDecline.before} &rarr; {biggestDecline.after} / {biggestDecline.maxScore}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-400">No pillars declined</div>
          )}
        </div>
      </div>

      {/* Grade Change */}
      {gradeChange?.changed && (
        <div className="rounded-lg bg-gradient-to-br from-[#1B2A4A] to-[#2D4A7A] p-6 shadow-sm">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[#00D4AA]">
                Previous Grade
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full font-mono text-xl font-bold text-white ${gradeChange.before === 'A' ? 'bg-green-500' : gradeChange.before === 'B' ? 'bg-lime-500' : gradeChange.before === 'C' ? 'bg-yellow-500' : gradeChange.before === 'D' ? 'bg-orange-500' : 'bg-red-500'}`}>
                {gradeChange.before}
              </span>
            </div>
            <div className="text-2xl text-[#00D4AA]">&rarr;</div>
            <div className="text-center">
              <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[#00D4AA]">
                Current Grade
              </div>
              <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full font-mono text-xl font-bold text-white ${gradeChange.after === 'A' ? 'bg-green-500' : gradeChange.after === 'B' ? 'bg-lime-500' : gradeChange.after === 'C' ? 'bg-yellow-500' : gradeChange.after === 'D' ? 'bg-orange-500' : 'bg-red-500'}`}>
                {gradeChange.after}
              </span>
            </div>
          </div>
          <div className="mt-3 text-center text-sm text-white">
            {gradeChange.improved ? 'Grade Improved' : 'Grade Changed'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/admin/audits/${id}`}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          &larr; Back to Audit Detail
        </Link>
        {audit.parentAuditId && (
          <Link
            href={`/admin/audits/${audit.parentAuditId}`}
            className="inline-flex items-center rounded-md bg-[#1B2A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D4A7A] transition-colors"
          >
            View Previous Audit &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
