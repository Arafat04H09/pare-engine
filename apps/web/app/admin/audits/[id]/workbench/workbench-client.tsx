'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RemediationItem {
  id: string;
  auditId: string | null;
  type: string;
  status: string | null;
  originalContent: string | null;
  currentContent: string | null;
  presentationMarkdown: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

interface WorkbenchClientProps {
  auditId: string;
  initialRemediations: RemediationItem[];
}

// ---------------------------------------------------------------------------
// Status + Type Badge Colors
// ---------------------------------------------------------------------------

function statusBadgeClasses(status: string | null): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'applied':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

function typeBadgeClasses(type: string): string {
  switch (type) {
    case 'jsonld':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'faq':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'llmstxt':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case 'jsonld': return 'JSON-LD';
    case 'faq': return 'FAQ Page';
    case 'llmstxt': return 'llms.txt';
    default: return type;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkbenchClient({ auditId, initialRemediations }: WorkbenchClientProps) {
  const [remediations, setRemediations] = useState<RemediationItem[]>(initialRemediations);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Generate content for a remediation item
  const handleGenerate = useCallback(async (remediationId: string) => {
    setLoading((prev) => ({ ...prev, [remediationId]: true }));
    setErrors((prev) => ({ ...prev, [remediationId]: '' }));

    try {
      const res = await fetch('/api/remediation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remediationId, auditId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      // Update local state with generated content
      setRemediations((prev) =>
        prev.map((r) =>
          r.id === remediationId
            ? { ...r, currentContent: data.content, presentationMarkdown: data.content }
            : r,
        ),
      );

      // Auto-expand after generation
      setExpandedId(remediationId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrors((prev) => ({ ...prev, [remediationId]: message }));
    } finally {
      setLoading((prev) => ({ ...prev, [remediationId]: false }));
    }
  }, [auditId]);

  // Update remediation status (approve/reject)
  const handleStatusUpdate = useCallback(async (remediationId: string, newStatus: 'approved' | 'rejected') => {
    setLoading((prev) => ({ ...prev, [`${remediationId}-status`]: true }));
    setErrors((prev) => ({ ...prev, [remediationId]: '' }));

    try {
      const res = await fetch('/api/remediation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remediationId, status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      // Update local state
      setRemediations((prev) =>
        prev.map((r) =>
          r.id === remediationId ? { ...r, status: newStatus } : r,
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrors((prev) => ({ ...prev, [remediationId]: message }));
    } finally {
      setLoading((prev) => ({ ...prev, [`${remediationId}-status`]: false }));
    }
  }, []);

  // Toggle expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  if (remediations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-700">No remediations needed</p>
        <p className="mt-2 text-sm text-gray-500">
          This audit did not detect any gaps that require remediation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {remediations.map((item) => {
        const isExpanded = expandedId === item.id;
        const isGenerating = loading[item.id] ?? false;
        const isUpdatingStatus = loading[`${item.id}-status`] ?? false;
        const errorMsg = errors[item.id] ?? '';
        const hasContent = Boolean(item.currentContent);
        const isDraft = item.status === 'draft';

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div className="flex items-center gap-3">
                {/* Type badge */}
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${typeBadgeClasses(item.type)}`}
                >
                  {typeLabel(item.type)}
                </span>

                {/* Status badge */}
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusBadgeClasses(item.status)}`}
                >
                  {item.status ?? 'unknown'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Generate button: only show when draft and no content yet */}
                {isDraft && !hasContent && (
                  <button
                    onClick={() => handleGenerate(item.id)}
                    disabled={isGenerating}
                    className="inline-flex items-center rounded-md bg-[#00D4AA] px-4 py-2 text-sm font-medium text-white hover:bg-[#00c49d] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Fix'
                    )}
                  </button>
                )}

                {/* Expand/collapse button when content exists */}
                {hasContent && (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {isExpanded ? 'Collapse' : 'View Content'}
                  </button>
                )}

                {/* Approve / Reject buttons */}
                {hasContent && isDraft && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'approved')}
                      disabled={isUpdatingStatus}
                      className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(item.id, 'rejected')}
                      disabled={isUpdatingStatus}
                      className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Gap description (always visible) */}
            {item.presentationMarkdown && !hasContent && (
              <div className="px-6 py-3 text-sm text-gray-600">
                {item.presentationMarkdown}
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="border-t border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Expanded content preview */}
            {isExpanded && hasContent && (
              <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap break-words rounded-md border border-gray-200 bg-white p-4 font-mono text-xs text-gray-800">
                  {item.currentContent}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
