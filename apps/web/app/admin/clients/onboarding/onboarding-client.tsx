'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Step = 1 | 2 | 3;

interface FormData {
  businessName: string;
  domain: string;
  vertical: string;
  locationCity: string;
  locationState: string;
  googlePlaceId: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  engagementType: string;
  notes: string;
}

const INITIAL: FormData = {
  businessName: '',
  domain: '',
  vertical: 'general',
  locationCity: '',
  locationState: '',
  googlePlaceId: '',
  primaryContactName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  engagementType: 'prospect',
  notes: '',
};

const VERTICALS = [
  'general', 'dental', 'legal', 'hvac', 'accounting',
  'restaurant', 'real_estate', 'healthcare', 'ecommerce',
  'plumbing', 'roofing', 'auto_repair', 'financial',
];

export function OnboardingClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const update = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const canProceed = (): boolean => {
    if (step === 1) return Boolean(form.businessName && form.domain && form.vertical);
    if (step === 2) return true; // Location is optional
    return true;
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');
    try {
      // 1. Create client record
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create client');

      // 2. Trigger initial audit
      await fetch('/api/audit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            domain: form.domain,
            businessName: form.businessName,
            vertical: form.vertical,
            contactEmail: form.primaryContactEmail,
          }],
        }),
      });

      // 3. Redirect to clients list
      router.push('/admin/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [form, router]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                s === step
                  ? 'bg-teal text-white'
                  : s < step
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s < step ? '\u2713' : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium text-gray-900' : 'text-gray-400'}`}>
              {s === 1 ? 'Business Info' : s === 2 ? 'Location & GBP' : 'Contact & Submit'}
            </span>
            {s < 3 && <span className="mx-2 text-gray-300">&rarr;</span>}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {/* Step 1: Business Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name *</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Domain *</label>
              <input
                type="text"
                value={form.domain}
                onChange={(e) => update('domain', e.target.value)}
                placeholder="example.com"
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vertical *</label>
              <select
                value={form.vertical}
                onChange={(e) => update('vertical', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>
                    {v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Engagement Type</label>
              <select
                value={form.engagementType}
                onChange={(e) => update('engagementType', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              >
                <option value="prospect">Prospect</option>
                <option value="sprint_client">Sprint Client</option>
                <option value="retainer">Retainer</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Location &amp; Google Business Profile</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={form.locationCity}
                  onChange={(e) => update('locationCity', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={form.locationState}
                  onChange={(e) => update('locationState', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Google Place ID</label>
              <input
                type="text"
                value={form.googlePlaceId}
                onChange={(e) => update('googlePlaceId', e.target.value)}
                placeholder="ChIJ..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <p className="mt-1 text-xs text-gray-400">
                Optional. Used for Google Business Profile analysis.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Primary Contact</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Name</label>
              <input
                type="text"
                value={form.primaryContactName}
                onChange={(e) => update('primaryContactName', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Email</label>
              <input
                type="email"
                value={form.primaryContactEmail}
                onChange={(e) => update('primaryContactEmail', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
              <input
                type="tel"
                value={form.primaryContactPhone}
                onChange={(e) => update('primaryContactPhone', e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Summary</p>
              <p className="mt-1 text-sm text-gray-900">
                <strong>{form.businessName}</strong> ({form.domain}) &mdash; {form.vertical}
              </p>
              {form.locationCity && (
                <p className="text-sm text-gray-600">
                  {form.locationCity}, {form.locationState}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                An initial audit will be triggered automatically after submission.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={!canProceed()}
              className="rounded-lg bg-[#1B2A4A] px-6 py-2 text-sm font-medium text-white hover:bg-navy-800 disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-[#00D4AA] px-6 py-2 text-sm font-medium text-white hover:bg-[#00c49d] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Client & Run Audit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
