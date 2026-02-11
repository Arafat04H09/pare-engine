// C13: Competitive Intelligence Dashboard — Compare client scores against competitors.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { auditResults, clients, competitors, competitorSnapshots, monitoringResults } from '@pare-engine/core';
import { eq, sql, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompetitorsDashboardPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit
  const rows = await db.select().from(auditResults).where(eq(auditResults.id, id)).limit(1);
  const audit = rows[0];
  if (!audit) notFound();

  // Fetch client
  let clientName = '--';
  let clientDomain = '';
  if (audit.clientId) {
    const cr = await db
      .select({ businessName: clients.businessName, domain: clients.domain })
      .from(clients)
      .where(eq(clients.id, audit.clientId))
      .limit(1);
    if (cr[0]) {
      clientName = cr[0].businessName;
      clientDomain = cr[0].domain;
    }
  }

  // Fetch competitor snapshots
  const snapshots = await db
    .select({
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

  // Aggregate competitor mentions from monitoring results
  let competitorMentionData: Array<{
    competitorMentions: unknown;
    platform: string;
  }> = [];

  if (audit.clientId) {
    competitorMentionData = await db
      .select({
        competitorMentions: monitoringResults.competitorMentions,
        platform: monitoringResults.platform,
      })
      .from(monitoringResults)
      .where(eq(monitoringResults.clientId, audit.clientId));
  }

  // Aggregate competitor mentions by name
  const competitorMentionCounts: Record<string, number> = {};
  for (const m of competitorMentionData) {
    const mentions = m.competitorMentions as Record<string, unknown> | null;
    if (mentions) {
      for (const [name, val] of Object.entries(mentions)) {
        competitorMentionCounts[name] = (competitorMentionCounts[name] ?? 0) + (typeof val === 'number' ? val : 1);
      }
    }
  }

  // Group snapshots by domain
  const competitorMap = new Map<string, typeof snapshots>();
  for (const snap of snapshots) {
    const existing = competitorMap.get(snap.domain) ?? [];
    existing.push(snap);
    competitorMap.set(snap.domain, existing);
  }

  // Calculate share of voice
  const sovData = Array.from(competitorMap.entries()).map(([domain, snaps]) => {
    const avgSov = snaps.reduce((sum, s) => sum + Number(s.shareOfVoice ?? 0), 0) / snaps.length;
    const avgPos = snaps.reduce((sum, s) => sum + (s.rankPosition ?? 0), 0) /
      snaps.filter((s) => s.rankPosition !== null).length;
    return { domain, businessName: snaps[0]?.businessName ?? domain, avgSov, avgPos, count: snaps.length };
  }).sort((a, b) => b.avgSov - a.avgSov);

  const hasData = snapshots.length > 0 || Object.keys(competitorMentionCounts).length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/audits" className="hover:text-gray-700">Audits</Link>
          <span>/</span>
          <Link href={`/admin/audits/${id}`} className="hover:text-gray-700">Detail</Link>
          <span>/</span>
          <span className="text-gray-900">Competitors</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[#1B2A4A]">Competitive Intelligence</h1>
        <p className="text-sm text-gray-500">{clientName} ({clientDomain}) &mdash; Audit {id.slice(0, 8)}</p>
      </div>

      {!hasData ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-medium text-gray-700">No competitive data available</p>
          <p className="mt-2 text-sm text-gray-500">
            Competitor data is populated automatically when the audit pipeline includes competitor analysis.
          </p>
        </div>
      ) : (
        <>
          {/* Share of Voice Chart */}
          {sovData.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Share of Voice</h2>
              <div className="space-y-3">
                {/* Client bar */}
                <div className="flex items-center gap-4">
                  <span className="w-40 truncate text-sm font-bold text-teal">{clientName}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className="h-6 rounded"
                      style={{
                        width: `${Math.min(100, Math.max(5, (1 - sovData.reduce((s, d) => s + d.avgSov, 0)) * 100))}%`,
                        backgroundColor: '#00D4AA',
                      }}
                    />
                    <span className="text-sm font-medium text-teal">
                      {((1 - sovData.reduce((s, d) => s + d.avgSov, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Competitor bars */}
                {sovData.map((c) => (
                  <div key={c.domain} className="flex items-center gap-4">
                    <span className="w-40 truncate text-sm font-medium text-gray-700">
                      {c.businessName || c.domain}
                    </span>
                    <div className="flex flex-1 items-center gap-2">
                      <div
                        className="h-6 rounded"
                        style={{
                          width: `${Math.min(100, Math.max(2, c.avgSov * 100))}%`,
                          backgroundColor: '#1B2A4A',
                        }}
                      />
                      <span className="text-sm text-gray-600">{(c.avgSov * 100).toFixed(1)}%</span>
                    </div>
                    <span className="text-xs text-gray-400">Pos: {isNaN(c.avgPos) ? '--' : c.avgPos.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Mention Frequency */}
          {Object.keys(competitorMentionCounts).length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Competitor Mention Frequency</h2>
              <div className="space-y-2">
                {Object.entries(competitorMentionCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, count]) => {
                    const maxCount = Math.max(...Object.values(competitorMentionCounts));
                    const barWidth = Math.max(5, (count / maxCount) * 100);
                    return (
                      <div key={name} className="flex items-center gap-4">
                        <span className="w-40 truncate text-sm font-medium text-gray-700">{name}</span>
                        <div className="flex flex-1 items-center gap-2">
                          <div
                            className="h-4 rounded bg-navy-200"
                            style={{ width: `${barWidth}%` }}
                          />
                          <span className="text-sm text-gray-600">{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Per-Engine Table */}
          {snapshots.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Per-Engine Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Competitor</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Engine</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Share of Voice</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {snapshots.map((snap, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{snap.domain}</td>
                        <td className="px-4 py-3 text-sm capitalize text-gray-500">{snap.sourceEngine ?? '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{snap.rankPosition ?? '--'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {snap.shareOfVoice ? `${(Number(snap.shareOfVoice) * 100).toFixed(1)}%` : '--'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(snap.snapshotDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
