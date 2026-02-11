// C12: Sentiment Dashboard — Visualize review themes and brand sentiment for an audit.
export const dynamic = 'force-dynamic';

import { db } from '../../../../../lib/db';
import { auditResults, clients, monitoringResults } from '@pare-engine/core';
import { eq, sql, and } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

function sentimentColor(sentiment: string | null): string {
  switch (sentiment) {
    case 'positive': return 'text-green-600 bg-green-50';
    case 'negative': return 'text-red-600 bg-red-50';
    case 'neutral': return 'text-gray-600 bg-gray-50';
    default: return 'text-gray-500 bg-gray-50';
  }
}

export default async function SentimentPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;

  // Fetch audit
  const rows = await db.select().from(auditResults).where(eq(auditResults.id, id)).limit(1);
  const audit = rows[0];
  if (!audit) notFound();

  // Fetch client
  let clientName = '--';
  if (audit.clientId) {
    const cr = await db
      .select({ businessName: clients.businessName })
      .from(clients)
      .where(eq(clients.id, audit.clientId))
      .limit(1);
    if (cr[0]) clientName = cr[0].businessName;
  }

  // Fetch monitoring data for this client to build sentiment analysis
  let monitoringData: Array<{
    platform: string;
    queryText: string;
    brandMentioned: boolean | null;
    brandSentiment: string | null;
    brandPosition: number | null;
    executionDate: Date;
  }> = [];

  if (audit.clientId) {
    monitoringData = await db
      .select({
        platform: monitoringResults.platform,
        queryText: monitoringResults.queryText,
        brandMentioned: monitoringResults.brandMentioned,
        brandSentiment: monitoringResults.brandSentiment,
        brandPosition: monitoringResults.brandPosition,
        executionDate: monitoringResults.executionDate,
      })
      .from(monitoringResults)
      .where(eq(monitoringResults.clientId, audit.clientId));
  }

  // Aggregate sentiment data
  const sentimentCounts = { positive: 0, negative: 0, neutral: 0, unknown: 0 };
  const platformSentiment: Record<string, typeof sentimentCounts> = {};
  const mentionedQueries: typeof monitoringData = [];

  for (const m of monitoringData) {
    const s = m.brandSentiment ?? 'unknown';
    sentimentCounts[s as keyof typeof sentimentCounts] =
      (sentimentCounts[s as keyof typeof sentimentCounts] ?? 0) + 1;

    if (!platformSentiment[m.platform]) {
      platformSentiment[m.platform] = { positive: 0, negative: 0, neutral: 0, unknown: 0 };
    }
    platformSentiment[m.platform][s as keyof typeof sentimentCounts] =
      (platformSentiment[m.platform][s as keyof typeof sentimentCounts] ?? 0) + 1;

    if (m.brandMentioned) {
      mentionedQueries.push(m);
    }
  }

  const totalMentions = monitoringData.length;
  const positiveRate = totalMentions > 0 ? Math.round((sentimentCounts.positive / totalMentions) * 100) : 0;
  const negativeRate = totalMentions > 0 ? Math.round((sentimentCounts.negative / totalMentions) * 100) : 0;

  // Extract sentiment drivers from detailed results
  const details = (audit.detailedResults as Record<string, unknown>) ?? {};
  const analysisData = (details.analysisData ?? {}) as Record<string, unknown>;
  const gbpData = (analysisData.gbpSummary ?? {}) as Record<string, unknown>;
  const reviewThemes = Array.isArray(gbpData.reviewThemes) ? (gbpData.reviewThemes as string[]) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin/audits" className="hover:text-gray-700">Audits</Link>
          <span>/</span>
          <Link href={`/admin/audits/${id}`} className="hover:text-gray-700">Detail</Link>
          <span>/</span>
          <span className="text-gray-900">Sentiment</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-[#1B2A4A]">Sentiment Dashboard</h1>
        <p className="text-sm text-gray-500">{clientName} &mdash; Audit {id.slice(0, 8)}</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Total Queries</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{totalMentions}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Positive Rate</p>
          <p className="mt-1 text-3xl font-bold text-green-600">{positiveRate}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Negative Rate</p>
          <p className="mt-1 text-3xl font-bold text-red-600">{negativeRate}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Mentions</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{mentionedQueries.length}</p>
          <p className="text-xs text-gray-400">brand mentioned</p>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Sentiment Distribution</h2>
        {totalMentions === 0 ? (
          <p className="text-sm text-gray-500">No monitoring data available yet.</p>
        ) : (
          <div className="space-y-3">
            {/* Stacked bar */}
            <div className="flex h-8 w-full overflow-hidden rounded-full">
              {sentimentCounts.positive > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${(sentimentCounts.positive / totalMentions) * 100}%` }}
                  title={`Positive: ${sentimentCounts.positive}`}
                />
              )}
              {sentimentCounts.neutral > 0 && (
                <div
                  className="bg-gray-300"
                  style={{ width: `${(sentimentCounts.neutral / totalMentions) * 100}%` }}
                  title={`Neutral: ${sentimentCounts.neutral}`}
                />
              )}
              {sentimentCounts.negative > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${(sentimentCounts.negative / totalMentions) * 100}%` }}
                  title={`Negative: ${sentimentCounts.negative}`}
                />
              )}
              {sentimentCounts.unknown > 0 && (
                <div
                  className="bg-gray-100"
                  style={{ width: `${(sentimentCounts.unknown / totalMentions) * 100}%` }}
                  title={`Unknown: ${sentimentCounts.unknown}`}
                />
              )}
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-500" /> Positive ({sentimentCounts.positive})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-gray-300" /> Neutral ({sentimentCounts.neutral})
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-500" /> Negative ({sentimentCounts.negative})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Per-Platform Breakdown */}
      {Object.keys(platformSentiment).length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">By Platform</h2>
          <div className="space-y-4">
            {Object.entries(platformSentiment).map(([platform, counts]) => {
              const total = counts.positive + counts.negative + counts.neutral + counts.unknown;
              return (
                <div key={platform}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium capitalize text-gray-700">{platform}</span>
                    <span className="text-xs text-gray-400">{total} queries</span>
                  </div>
                  <div className="flex h-4 w-full overflow-hidden rounded-full">
                    {counts.positive > 0 && (
                      <div className="bg-green-500" style={{ width: `${(counts.positive / total) * 100}%` }} />
                    )}
                    {counts.neutral > 0 && (
                      <div className="bg-gray-300" style={{ width: `${(counts.neutral / total) * 100}%` }} />
                    )}
                    {counts.negative > 0 && (
                      <div className="bg-red-500" style={{ width: `${(counts.negative / total) * 100}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Themes */}
      {reviewThemes.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Review Themes</h2>
          <div className="flex flex-wrap gap-2">
            {reviewThemes.map((theme, i) => (
              <span
                key={i}
                className="inline-flex rounded-full bg-navy-50 px-3 py-1 text-sm text-navy-700"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Mentions */}
      {mentionedQueries.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Brand Mentions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Query</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Sentiment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mentionedQueries.slice(0, 20).map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-gray-900">{m.queryText}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-500">{m.platform}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.brandPosition ?? '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${sentimentColor(m.brandSentiment)}`}>
                        {m.brandSentiment ?? 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalMentions === 0 && reviewThemes.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-lg font-medium text-gray-700">No sentiment data available</p>
          <p className="mt-2 text-sm text-gray-500">
            Sentiment data is populated after monitoring runs. Run a weekly monitoring cycle to see data here.
          </p>
        </div>
      )}
    </div>
  );
}
