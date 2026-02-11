'use client';

import { useState, useCallback } from 'react';

// --- Types ---

interface ReviewNGram {
  phrase: string;
  clientFrequency: number;
  competitorFrequency: number;
  gap: number;
}

interface SemanticAnalysis {
  topClientPhrases: ReviewNGram[];
  topCompetitorPhrases: ReviewNGram[];
  gapPhrases: ReviewNGram[];
  clientSentimentAvg: number;
  competitorSentimentAvg: number;
  recommendedClusters: string[];
  analyzedAt: string;
}

interface ScrapeStats {
  clientReviewCount: number;
  competitorReviewCount: number;
  clientPlaceSuccess: boolean;
  competitorPlaceSuccess: boolean;
  failedPlaces: Array<{ placeId: string; error: string }>;
}

interface QASeed {
  question: string;
  answer: string;
}

interface CampaignArtifacts {
  emailTemplate: string;
  smsTemplate: string;
  qaSeed: QASeed[];
  talkingPoints: string[];
  disclaimer: string;
  generatedAt: string;
}

interface ReviewsClientProps {
  auditId: string;
  businessName: string;
  vertical: string;
  clientGooglePlaceId?: string;
}

// --- Helper: Spinner SVG ---

function Spinner(): JSX.Element {
  return (
    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// --- Helper: Sentiment Bar ---

function SentimentBar({
  label,
  value,
}: {
  label: string;
  value: number;
}): JSX.Element {
  const pct = Math.round(value * 100);
  const barColor =
    pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{pct}%</span>
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

// --- Helper: Copy Button ---

function CopyButton({ text }: { text: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select textarea content
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// --- Main Component ---

export function ReviewsClient({
  auditId,
  businessName,
  vertical,
  clientGooglePlaceId,
}: ReviewsClientProps): JSX.Element {
  // Analysis state
  const [clientPlaceId, setClientPlaceId] = useState(clientGooglePlaceId ?? '');
  const [competitorPlaceIds, setCompetitorPlaceIds] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SemanticAnalysis | null>(null);
  const [scrapeStats, setScrapeStats] = useState<ScrapeStats | null>(null);

  // Campaign state
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<CampaignArtifacts | null>(null);

  // --- Analyze Handler ---

  const handleRunAnalysis = useCallback(async () => {
    if (!clientPlaceId.trim()) {
      setAnalysisError('Client Google Place ID is required');
      return;
    }
    if (!competitorPlaceIds.trim()) {
      setAnalysisError('At least one competitor Place ID is required');
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysis(null);
    setScrapeStats(null);
    setCampaign(null);

    try {
      const response = await fetch(`/api/admin/audits/${auditId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          clientPlaceId: clientPlaceId.trim(),
          competitorPlaceIds: competitorPlaceIds.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? data.details ?? `HTTP ${response.status}`);
      }

      setAnalysis(data.analysis);
      setScrapeStats(data.scrapeStats);
    } catch (err: unknown) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  }, [auditId, clientPlaceId, competitorPlaceIds]);

  // --- Campaign Handler ---

  const handleGenerateCampaign = useCallback(async () => {
    if (!analysis) return;

    setCampaignLoading(true);
    setCampaignError(null);

    try {
      const response = await fetch(`/api/admin/audits/${auditId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'campaign',
          gapPhrases: analysis.gapPhrases,
          recommendedClusters: analysis.recommendedClusters,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? data.details ?? `HTTP ${response.status}`);
      }

      setCampaign(data.campaign);
    } catch (err: unknown) {
      setCampaignError(
        err instanceof Error ? err.message : 'Campaign generation failed',
      );
    } finally {
      setCampaignLoading(false);
    }
  }, [auditId, analysis]);

  return (
    <div className="space-y-8">
      {/* ===== ANALYZE REVIEWS SECTION ===== */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#1B2A4A]">
          Analyze Reviews
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Compare {businessName}&apos;s Google reviews against competitors to
          find semantic gaps. Enter Google Maps Place IDs below.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="clientPlaceId"
              className="block text-sm font-medium text-gray-700"
            >
              Client Google Place ID
            </label>
            <input
              id="clientPlaceId"
              type="text"
              value={clientPlaceId}
              onChange={(e) => setClientPlaceId(e.target.value)}
              placeholder="ChIJ..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#00D4AA] focus:outline-none focus:ring-1 focus:ring-[#00D4AA]"
            />
          </div>
          <div>
            <label
              htmlFor="competitorPlaceIds"
              className="block text-sm font-medium text-gray-700"
            >
              Competitor Place IDs (comma-separated)
            </label>
            <input
              id="competitorPlaceIds"
              type="text"
              value={competitorPlaceIds}
              onChange={(e) => setCompetitorPlaceIds(e.target.value)}
              placeholder="ChIJ..., ChIJ..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-[#00D4AA] focus:outline-none focus:ring-1 focus:ring-[#00D4AA]"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleRunAnalysis}
            disabled={analysisLoading}
            className="inline-flex items-center rounded-md bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2a3d66] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {analysisLoading ? (
              <>
                <Spinner />
                Scraping &amp; Analyzing...
              </>
            ) : (
              'Run Analysis'
            )}
          </button>
        </div>

        {analysisError && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {analysisError}
          </div>
        )}
      </div>

      {/* ===== ANALYSIS RESULTS ===== */}
      {analysis && (
        <div className="space-y-6">
          {/* Scrape Stats */}
          {scrapeStats && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Client Reviews
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {scrapeStats.clientReviewCount}
                </p>
                <p
                  className={`mt-1 text-xs ${scrapeStats.clientPlaceSuccess ? 'text-green-600' : 'text-red-600'}`}
                >
                  {scrapeStats.clientPlaceSuccess ? 'Scraped successfully' : 'Scraping failed'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Competitor Reviews
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {scrapeStats.competitorReviewCount}
                </p>
                <p
                  className={`mt-1 text-xs ${scrapeStats.competitorPlaceSuccess ? 'text-green-600' : 'text-red-600'}`}
                >
                  {scrapeStats.competitorPlaceSuccess ? 'Scraped successfully' : 'Scraping failed'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Failed Places
                </p>
                <p className="mt-1 text-3xl font-bold text-gray-900">
                  {scrapeStats.failedPlaces.length}
                </p>
                {scrapeStats.failedPlaces.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    {scrapeStats.failedPlaces.map((f) => f.placeId).join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Sentiment Comparison */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Sentiment Comparison
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SentimentBar
                label={`${businessName} (Client)`}
                value={analysis.clientSentimentAvg}
              />
              <SentimentBar
                label="Competitors (Average)"
                value={analysis.competitorSentimentAvg}
              />
            </div>
          </div>

          {/* Recommended Clusters */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
              Recommended Topic Clusters
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.recommendedClusters.map((cluster, i) => (
                <span
                  key={i}
                  className="inline-flex rounded-full bg-[#00D4AA]/15 px-4 py-1.5 text-sm font-medium text-[#1B2A4A]"
                >
                  {cluster}
                </span>
              ))}
            </div>
          </div>

          {/* Gap Phrases Table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#1B2A4A]">
                Top Gap Phrases
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Topics competitors are mentioned for more than {businessName}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Phrase
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Client Freq
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Competitor Freq
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Gap
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {analysis.gapPhrases.map((ngram, i) => (
                    <tr key={i} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        {ngram.phrase}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-gray-600">
                        {ngram.clientFrequency.toFixed(3)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm text-gray-600">
                        {ngram.competitorFrequency.toFixed(3)}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-sm font-semibold text-red-600">
                        +{ngram.gap.toFixed(3)}
                      </td>
                    </tr>
                  ))}
                  {analysis.gapPhrases.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-sm text-gray-500"
                      >
                        No significant gap phrases found. The client matches or
                        exceeds competitor review topics.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Client Phrases */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Top Client Phrases
              </h3>
              {analysis.topClientPhrases.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No significant phrases detected in client reviews.
                </p>
              ) : (
                <ul className="space-y-2">
                  {analysis.topClientPhrases.map((ngram, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{ngram.phrase}</span>
                      <span className="font-mono text-xs text-gray-500">
                        {ngram.clientFrequency.toFixed(3)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                Top Competitor Phrases
              </h3>
              {analysis.topCompetitorPhrases.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No significant phrases detected in competitor reviews.
                </p>
              ) : (
                <ul className="space-y-2">
                  {analysis.topCompetitorPhrases.map((ngram, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{ngram.phrase}</span>
                      <span className="font-mono text-xs text-gray-500">
                        {ngram.competitorFrequency.toFixed(3)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Generate Campaign Section */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold text-[#1B2A4A]">
              Generate Review Campaign
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              Create email templates, SMS messages, Q&amp;A seeds, and staff
              talking points based on the gap analysis above.
            </p>
            <button
              onClick={handleGenerateCampaign}
              disabled={campaignLoading}
              className="inline-flex items-center rounded-md bg-[#00D4AA] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#00c49d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {campaignLoading ? (
                <>
                  <Spinner />
                  Generating Campaign...
                </>
              ) : (
                'Generate Campaign'
              )}
            </button>
            {campaignError && (
              <p className="mt-4 text-sm text-red-600">{campaignError}</p>
            )}
          </div>
        </div>
      )}

      {/* ===== CAMPAIGN ARTIFACTS ===== */}
      {campaign && (
        <div className="space-y-6">
          {/* Email Template */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#1B2A4A]">
                Email Template
              </h3>
              <CopyButton text={campaign.emailTemplate} />
            </div>
            <div className="px-6 py-4">
              <textarea
                readOnly
                value={campaign.emailTemplate}
                rows={12}
                className="w-full rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-800 focus:outline-none"
              />
            </div>
          </div>

          {/* SMS Template */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#1B2A4A]">
                SMS Template
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {campaign.smsTemplate.length}/160 chars
                </span>
                <CopyButton text={campaign.smsTemplate} />
              </div>
            </div>
            <div className="px-6 py-4">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
                {campaign.smsTemplate}
              </div>
            </div>
          </div>

          {/* Q&A Seeds */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#1B2A4A]">
                Google Q&amp;A Seeds
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Post these as questions on the Google Business listing, then
                answer them as the business owner.
              </p>
            </div>
            <div className="divide-y divide-gray-100">
              {campaign.qaSeed.map((qa, i) => (
                <div key={i} className="px-6 py-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Q: {qa.question}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">A: {qa.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Talking Points */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#1B2A4A]">
                Staff Talking Points
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Brief instructions for front-line staff to naturally prime
                customers to mention gap topics in reviews.
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {campaign.talkingPoints.map((point, i) => (
                <li key={i} className="flex gap-3 px-6 py-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer Banner */}
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-6 py-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-amber-600">
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Ethical Disclaimer
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {campaign.disclaimer}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <p className="text-xs text-gray-400">
            Campaign generated at{' '}
            {new Date(campaign.generatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
