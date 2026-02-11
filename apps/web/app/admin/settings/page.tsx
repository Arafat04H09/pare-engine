// C1: Admin Settings — API key status, branding, and email configuration.
export const dynamic = 'force-dynamic';

import { SettingsClient } from './settings-client';

export default function SettingsPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage API keys, branding, and email configuration.
        </p>
      </div>
      <SettingsClient />
    </div>
  );
}
