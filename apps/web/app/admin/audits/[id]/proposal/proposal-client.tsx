'use client';

import { useState } from 'react';

// Matches ProposalData from the contract (client-side version, dates as strings from JSON)
interface ProposalLineItem {
  name: string;
  description: string;
  pillar: string;
  price: number; // cents
  effort: 'quick-win' | 'sprint' | 'ongoing';
  priority: number;
}

interface ProposalData {
  clientName: string;
  domain: string;
  vertical: string;
  auditDate: string;
  overallScore: number;
  letterGrade: string;
  lineItems: ProposalLineItem[];
  subtotal: number;
  executiveSummary: string;
  estimatedTimeline: string;
  generatedAt: string;
  isDraft: boolean;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function effortBadge(effort: string): JSX.Element {
  const styles: Record<string, string> = {
    'quick-win': 'bg-green-100 text-green-800',
    sprint: 'bg-indigo-100 text-indigo-800',
    ongoing: 'bg-purple-100 text-purple-800',
  };
  const label = effort === 'quick-win' ? 'Quick Win' : effort.charAt(0).toUpperCase() + effort.slice(1);
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${styles[effort] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {label}
    </span>
  );
}

export function ProposalClient({ auditId }: { auditId: string }): JSX.Element {
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/audits/${auditId}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${response.status}`,
        );
      }

      const data = (await response.json()) as ProposalData;
      setProposal(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Generate button */}
      {!proposal && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="mb-4 text-gray-600">
            Generate a draft Statement of Work based on this audit&apos;s findings.
            The proposal maps pillar scores to recommended services with pricing.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2a3d66] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
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
                Generating Proposal...
              </>
            ) : (
              'Generate Proposal'
            )}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {/* Proposal display */}
      {proposal && (
        <div className="space-y-6">
          {/* Draft banner */}
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-center text-sm font-semibold text-yellow-800">
            DRAFT PROPOSAL &mdash; Review before sharing with client
          </div>

          {/* Executive summary */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Executive Summary
            </h2>
            <p className="text-sm leading-relaxed text-gray-700">
              {proposal.executiveSummary}
            </p>
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>
                Score: <strong>{proposal.overallScore}/100</strong> ({proposal.letterGrade})
              </span>
              <span>
                Timeline: <strong>{proposal.estimatedTimeline}</strong>
              </span>
              <span>
                Vertical: <strong>{proposal.vertical}</strong>
              </span>
            </div>
          </div>

          {/* Line items table */}
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Proposed Services
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Pillar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Effort
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {proposal.lineItems.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : ''}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-bold text-gray-500">
                        {item.priority}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {item.description}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-600">
                        {item.pillar}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {effortBadge(item.effort)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right font-mono text-sm font-bold text-gray-900">
                        {formatCents(item.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal */}
            <div className="flex items-center justify-end border-t border-gray-200 bg-[#1B2A4A] px-6 py-4 rounded-b-lg">
              <span className="mr-6 text-sm font-semibold uppercase tracking-wide text-white">
                Estimated Total
              </span>
              <span className="font-mono text-xl font-bold text-[#00D4AA]">
                {formatCents(proposal.subtotal)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={`/api/admin/audits/${auditId}/pdf`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              Download Audit PDF
            </a>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-[#00D4AA] bg-white px-4 py-2 text-sm font-medium text-[#1B2A4A] shadow-sm transition-colors hover:bg-[#00D4AA]/10 disabled:opacity-50"
            >
              {loading ? 'Regenerating...' : 'Regenerate Proposal'}
            </button>
          </div>

          {/* Metadata footer */}
          <p className="text-xs text-gray-400">
            Generated at {new Date(proposal.generatedAt).toLocaleString()} &mdash;{' '}
            This is a draft proposal valid for 30 days.
          </p>
        </div>
      )}
    </div>
  );
}
