// Task 2.3: Competitor Gap Analysis page.
// On-demand only — operator clicks to run competitive analysis for a specific audit.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { clients, auditResults, competitors, competitorSnapshots } from '@pare-engine/core';
import { sql, eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps { params: Promise<{ id: string }>; }

export default async function CompetitorPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit
  const rows = await db.select().from(auditResults).where(sql`${auditResults.id} = ${id}`).limit(1);
  const audit = rows[0];
  if (!audit) { notFound(); }

  // Fetch client
  let clientName = '--';
  if (audit.clientId) {
    const cr = await db.select({ businessName: clients.businessName })
      .from(clients)
      .where(sql`${clients.id} = ${audit.clientId}`)
      .limit(1);
    if (cr[0]) { clientName = cr[0].businessName; }
  }

  // Fetch competitor snapshots for this audit
  const snapshots = await db.select({
    domain: competitors.domain,
    businessName: competitors.businessName,
    rankPosition: competitorSnapshots.rankPosition,
    shareOfVoice: competitorSnapshots.shareOfVoice,
    sourceEngine: competitorSnapshots.sourceEngine,
    snapshotDate: competitorSnapshots.snapshotDate,
  })
    .from(competitorSnapshots)
    .innerJoin(competitors, eq(competitorSnapshots.competitorId, competitors.id))
    .where(eq(competitorSnapshots.auditId, id));

  // Group by domain
  const competitorMap = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const existing = competitorMap.get(snap.domain) ?? [];
    existing.push(snap);
    competitorMap.set(snap.domain, existing);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={'/admin/audits/' + id} className="text-sm text-gray-500 hover:text-gray-700">
          Back to Audit
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Competitor Intelligence</h1>
        <p className="text-sm text-gray-500">{clientName} — Audit {id.slice(0, 8)}</p>
      </div>

      {snapshots.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-500">
            No competitor data available for this audit yet.
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Competitor data is populated automatically when the audit pipeline runs with competitors specified.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Share of Voice Overview */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Share of Voice</h2>
            <div className="space-y-3">
              {Array.from(competitorMap.entries()).map(([domain, snaps]) => {
                const avgSov = snaps.reduce((sum, s) => sum + Number(s.shareOfVoice ?? 0), 0) / snaps.length;
                const avgPos = snaps.reduce((sum, s) => sum + (s.rankPosition ?? 0), 0) / snaps.filter(s => s.rankPosition !== null).length;
                const barWidth = Math.min(100, Math.round(avgSov * 100));

                return (
                  <div key={domain} className="flex items-center gap-4">
                    <span className="w-40 truncate text-sm font-medium text-gray-700">{domain}</span>
                    <div className="flex flex-1 items-center gap-2">
                      <div className="h-4 rounded" style={{ width: `${barWidth}%`, backgroundColor: '#1B2A4A', minWidth: '4px' }} />
                      <span className="text-sm text-gray-600">{(avgSov * 100).toFixed(1)}%</span>
                    </div>
                    <span className="text-sm text-gray-500">Pos: {isNaN(avgPos) ? '—' : avgPos.toFixed(1)}</span>
                    <span className="text-xs text-gray-400">{snaps.length} snapshot(s)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-Engine Breakdown */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Per-Engine Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Competitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Engine</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Share of Voice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {snapshots.map((snap, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 text-sm">{snap.domain}</td>
                      <td className="px-6 py-4 text-sm">{snap.sourceEngine ?? '—'}</td>
                      <td className="px-6 py-4 text-sm">{snap.rankPosition ?? '—'}</td>
                      <td className="px-6 py-4 text-sm">{snap.shareOfVoice ? (Number(snap.shareOfVoice) * 100).toFixed(1) + '%' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
