// Proposal generation page for a specific audit.
// Fetches audit data server-side, then uses client-side state for proposal generation.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { clients, auditResults } from '@pare-engine/core';
import { sql } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProposalClient } from './proposal-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProposalPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit
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

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/audits/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Audit Detail
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Generate Proposal</h1>
        <p className="text-sm text-gray-500">
          {clientName} ({clientDomain}) &mdash;{' '}
          {new Date(audit.auditDate).toLocaleDateString()} &mdash; Score:{' '}
          {audit.overallScore}/100 ({audit.letterGrade})
        </p>
      </div>

      {/* Score summary card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <ScoreCard label="AI Visibility" score={audit.aiVisibilityScore} max={30} />
        <ScoreCard label="Content" score={audit.contentScore} max={30} />
        <ScoreCard label="Schema" score={audit.schemaScore} max={15} />
        <ScoreCard label="Technical" score={audit.technicalScore} max={10} />
        <ScoreCard label="Local/GBP" score={audit.gbpScore} max={15} />
      </div>

      {/* Client-side proposal generation */}
      <ProposalClient auditId={id} />
    </div>
  );
}

function ScoreCard({
  label,
  score,
  max,
}: {
  label: string;
  score: number | null;
  max: number;
}): JSX.Element {
  const value = score ?? 0;
  const pct = max > 0 ? value / max : 0;
  const colorClass =
    pct >= 0.8
      ? 'text-green-600'
      : pct >= 0.6
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold font-mono ${colorClass}`}>
        {value}
        <span className="text-sm text-gray-400">/{max}</span>
      </p>
    </div>
  );
}
