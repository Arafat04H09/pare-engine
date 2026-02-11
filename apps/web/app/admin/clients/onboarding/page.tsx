// C5: Client Onboarding — Multi-step form for new client intake.
export const dynamic = 'force-dynamic';

import { OnboardingClient } from './onboarding-client';

export default function OnboardingPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Client Onboarding</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a new client and automatically trigger their first audit.
        </p>
      </div>
      <OnboardingClient />
    </div>
  );
}
