'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

type Tab = 'single' | 'batch';

interface BatchResult {
  domain: string;
  status: 'queued' | 'failed';
  error?: string;
}

export function QuickAuditClient() {
  const [tab, setTab] = useState<Tab>('single');

  // Single mode
  const [domain, setDomain] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vertical, setVertical] = useState('general');
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<string>('');

  // Batch mode
  const [batchInput, setBatchInput] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);

  const handleSingleAudit = useCallback(async () => {
    if (!domain.trim()) return;
    setSingleLoading(true);
    setSingleResult('');
    try {
      const res = await fetch('/api/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            domain: domain.trim(),
            businessName: businessName.trim() || domain.trim(),
            vertical,
          }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSingleResult(`Audit queued for ${domain.trim()}`);
      setDomain('');
      setBusinessName('');
    } catch (err) {
      setSingleResult(err instanceof Error ? err.message : 'Failed to queue audit');
    } finally {
      setSingleLoading(false);
    }
  }, [domain, businessName, vertical]);

  const handleBatchAudit = useCallback(async () => {
    const lines = batchInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setBatchLoading(true);
    setBatchResults([]);
    try {
      const items = lines.map((line) => {
        const parts = line.split(',').map((p) => p.trim());
        return {
          domain: parts[0] ?? line,
          businessName: parts[1] ?? parts[0] ?? line,
          vertical: parts[2] ?? 'general',
        };
      });

      const res = await fetch('/api/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch failed');
      setBatchResults(data.results ?? []);
    } catch (err) {
      setBatchResults([{ domain: 'Error', status: 'failed', error: err instanceof Error ? err.message : 'Unknown' }]);
    } finally {
      setBatchLoading(false);
    }
  }, [batchInput]);

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab('single')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'single'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Single Audit
        </button>
        <button
          onClick={() => setTab('batch')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'batch'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Batch Mode
        </button>
      </div>

      {/* Single Audit */}
      {tab === 'single' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Mini Audit</h2>
          <p className="mb-4 text-sm text-gray-500">
            Enter a domain and business name to trigger a mini audit (&lt; 90 seconds).
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Example Inc."
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vertical</label>
              <select
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="general">General</option>
                <option value="dental">Dental</option>
                <option value="legal">Legal</option>
                <option value="hvac">HVAC</option>
                <option value="accounting">Accounting</option>
                <option value="restaurant">Restaurant</option>
                <option value="real_estate">Real Estate</option>
                <option value="healthcare">Healthcare</option>
                <option value="ecommerce">E-Commerce</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleSingleAudit}
              disabled={singleLoading || !domain.trim()}
              className="rounded-lg bg-[#00D4AA] px-6 py-2 text-sm font-medium text-white hover:bg-[#00c49d] disabled:opacity-50"
            >
              {singleLoading ? 'Queuing...' : 'Run Quick Audit'}
            </button>
            {singleResult && (
              <span className={`text-sm ${singleResult.includes('queued') ? 'text-green-600' : 'text-red-600'}`}>
                {singleResult}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Batch Mode */}
      {tab === 'batch' && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Batch Audit</h2>
          <p className="mb-4 text-sm text-gray-500">
            Paste one domain per line (optionally: domain, business name, vertical). Max 50.
          </p>
          <textarea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            rows={10}
            placeholder={`example.com, Example Inc, dental\nanother.com, Another Biz, legal\nthird.com`}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleBatchAudit}
              disabled={batchLoading || !batchInput.trim()}
              className="rounded-lg bg-[#1B2A4A] px-6 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
            >
              {batchLoading ? 'Queuing...' : 'Queue Batch'}
            </button>
            <span className="text-xs text-gray-400">
              {batchInput.split('\n').filter((l) => l.trim()).length} domain(s)
            </span>
          </div>

          {/* Batch Results */}
          {batchResults.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">Results</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Domain
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {batchResults.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-sm text-gray-900">{r.domain}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              r.status === 'queued'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {r.status}
                          </span>
                          {r.error && (
                            <span className="ml-2 text-xs text-red-500">{r.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
