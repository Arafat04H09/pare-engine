// Implementation Workbench — human-in-the-loop fix review cockpit.
// Shows audit gaps, lets the operator generate fixes, review, and approve them.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { auditResults, clients, remediationItems } from '@pare-engine/core';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WorkbenchClient } from './workbench-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkbenchPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit result
  const auditRows = await db
    .select()
    .from(auditResults)
    .where(eq(auditResults.id, id))
    .limit(1);

  const audit = auditRows[0];
  if (!audit) {
    notFound();
  }

  // Fetch client info
  let clientName = '--';
  let clientDomain = '';
  let clientVertical = '';

  if (audit.clientId) {
    const clientRows = await db
      .select({
        businessName: clients.businessName,
        domain: clients.domain,
        vertical: clients.vertical,
      })
      .from(clients)
      .where(eq(clients.id, audit.clientId))
      .limit(1);

    if (clientRows[0]) {
      clientName = clientRows[0].businessName;
      clientDomain = clientRows[0].domain;
      clientVertical = clientRows[0].vertical;
    }
  }

  // Fetch remediation items for this audit
  const remediations = await db
    .select()
    .from(remediationItems)
    .where(eq(remediationItems.auditId, id));

  // Extract summary data from detailed results
  const details = (audit.detailedResults as Record<string, unknown> | null) ?? {};
  const analysisData = (details.analysisData ?? {}) as Record<string, unknown>;
  const technicalSummary = (analysisData.technicalSummary ?? {}) as Record<string, unknown>;

  // Counts for summary card
  const schemaTypesFound = Array.isArray(analysisData.schemaTypesFound)
    ? (analysisData.schemaTypesFound as string[])
    : [];
  const schemaMissing = Array.isArray(analysisData.schemaMissing)
    ? (analysisData.schemaMissing as string[])
    : [];
  const hasLlmsTxt = Boolean(technicalSummary.llmsTxt);
  const contentPageCount = (analysisData.contentPageCount as number) ?? 0;

  const draftCount = remediations.filter((r) => r.status === 'draft').length;
  const approvedCount = remediations.filter((r) => r.status === 'approved').length;
  const rejectedCount = remediations.filter((r) => r.status === 'rejected').length;

  // Grade color
  function gradeColor(grade: string | null): string {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Title */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/audits" className="hover:text-gray-700">
            Audits
          </Link>
          <span>/</span>
          <Link href={`/admin/audits/${id}`} className="hover:text-gray-700">
            Detail
          </Link>
          <span>/</span>
          <span className="text-gray-900">Workbench</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[#1B2A4A]">
          Implementation Workbench
        </h1>
        <p className="text-sm text-gray-500">
          {clientName} ({clientDomain}) &mdash; {clientVertical}
        </p>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Overall Score */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Overall Score
          </p>
          <p className={`mt-1 text-3xl font-bold ${gradeColor(audit.letterGrade)}`}>
            {audit.overallScore}
            <span className="ml-1 text-lg">{audit.letterGrade}</span>
          </p>
        </div>

        {/* Schema Gaps */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Schema Types
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {schemaTypesFound.length}
            <span className="ml-1 text-sm font-normal text-gray-500">
              found
            </span>
          </p>
          {schemaMissing.length > 0 && (
            <p className="mt-1 text-sm text-red-600">
              {schemaMissing.length} missing
            </p>
          )}
        </div>

        {/* Key Gaps */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Key Gaps
          </p>
          <div className="mt-2 space-y-1 text-sm">
            {schemaMissing.length > 0 && (
              <p className="text-red-600">Missing JSON-LD types</p>
            )}
            {contentPageCount > 0 && (
              <p className="text-amber-600">
                {contentPageCount} page(s) analyzed
              </p>
            )}
            {!hasLlmsTxt && (
              <p className="text-red-600">No llms.txt</p>
            )}
            {schemaMissing.length === 0 && hasLlmsTxt && (
              <p className="text-green-600">No critical gaps</p>
            )}
          </div>
        </div>

        {/* Remediation Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Remediations
          </p>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {remediations.length}
          </p>
          <div className="mt-1 flex items-center gap-3 text-xs">
            {draftCount > 0 && (
              <span className="text-gray-600">{draftCount} draft</span>
            )}
            {approvedCount > 0 && (
              <span className="text-green-600">{approvedCount} approved</span>
            )}
            {rejectedCount > 0 && (
              <span className="text-red-600">{rejectedCount} rejected</span>
            )}
          </div>
        </div>
      </div>

      {/* Pillar Scores Mini Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Pillar Scores
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <PillarMini label="AI Visibility" score={audit.aiVisibilityScore} max={30} />
          <PillarMini label="Content" score={audit.contentScore} max={30} />
          <PillarMini label="Schema" score={audit.schemaScore} max={15} />
          <PillarMini label="Technical" score={audit.technicalScore} max={10} />
          <PillarMini label="Local/GBP" score={audit.gbpScore} max={15} />
        </div>
      </div>

      {/* Remediation Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#1B2A4A]">
          Remediation Items
        </h2>
        <WorkbenchClient auditId={id} initialRemediations={remediations} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini pillar score component (server component, no 'use client' needed)
// ---------------------------------------------------------------------------

function PillarMini({
  label,
  score,
  max,
}: {
  label: string;
  score: number | null;
  max: number;
}) {
  const pct = score != null ? Math.round((score / max) * 100) : 0;
  const barColor =
    pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          {score ?? '--'}/{max}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
