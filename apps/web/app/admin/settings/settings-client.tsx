'use client';

import { useState, useEffect, useCallback } from 'react';

interface ApiKeyStatus {
  [key: string]: boolean;
}

interface BrandSettings {
  brandPrimaryColor: string;
  brandAccentColor: string;
  companyName: string;
  logoUrl: string;
  replyToEmail: string;
}

const KEY_LABELS: Record<string, string> = {
  OPENAI_API_KEY: 'OpenAI',
  ANTHROPIC_API_KEY: 'Anthropic (Claude)',
  GOOGLE_GENERATIVE_AI_API_KEY: 'Google Gemini',
  PERPLEXITY_API_KEY: 'Perplexity',
  FIRECRAWL_API_KEY: 'Firecrawl',
  RESEND_API_KEY: 'Resend (Email)',
  STRIPE_SECRET_KEY: 'Stripe',
  DATABASE_URL: 'Database',
};

export function SettingsClient() {
  const [apiKeys, setApiKeys] = useState<ApiKeyStatus>({});
  const [settings, setSettings] = useState<BrandSettings>({
    brandPrimaryColor: '#1B2A4A',
    brandAccentColor: '#00D4AA',
    companyName: 'Pare Consulting',
    logoUrl: '',
    replyToEmail: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.apiKeys) setApiKeys(data.apiKeys);
        if (data.settings) setSettings(data.settings);
      } catch {
        setMessage('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Save failed');
      setMessage('Settings saved successfully');
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [settings]);

  if (loading) {
    return <div className="text-sm text-gray-500">Loading settings...</div>;
  }

  const configuredCount = Object.values(apiKeys).filter(Boolean).length;
  const totalKeys = Object.keys(apiKeys).length;

  return (
    <div className="space-y-8">
      {/* API Key Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">API Keys</h2>
        <p className="mb-4 text-sm text-gray-500">
          {configuredCount}/{totalKeys} configured. Keys are set via environment variables.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(KEY_LABELS).map(([key, label]) => {
            const configured = apiKeys[key] ?? false;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{key}</p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                    configured
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {configured ? 'Configured' : 'Missing'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Branding Settings */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Branding</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company Name</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reply-To Email</label>
            <input
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => setSettings({ ...settings, replyToEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={settings.brandPrimaryColor}
                onChange={(e) => setSettings({ ...settings, brandPrimaryColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border border-gray-200"
              />
              <input
                type="text"
                value={settings.brandPrimaryColor}
                onChange={(e) => setSettings({ ...settings, brandPrimaryColor: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Accent Color</label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={settings.brandAccentColor}
                onChange={(e) => setSettings({ ...settings, brandAccentColor: e.target.value })}
                className="h-10 w-10 cursor-pointer rounded border border-gray-200"
              />
              <input
                type="text"
                value={settings.brandAccentColor}
                onChange={(e) => setSettings({ ...settings, brandAccentColor: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
            <input
              type="url"
              value={settings.logoUrl}
              onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 rounded-lg border border-gray-100 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">Preview</p>
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded"
              style={{ backgroundColor: settings.brandPrimaryColor }}
            />
            <div
              className="h-8 w-8 rounded"
              style={{ backgroundColor: settings.brandAccentColor }}
            />
            <span className="text-sm font-semibold" style={{ color: settings.brandPrimaryColor }}>
              {settings.companyName}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#00D4AA] px-6 py-2 text-sm font-medium text-white hover:bg-[#00c49d] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {message && (
            <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
