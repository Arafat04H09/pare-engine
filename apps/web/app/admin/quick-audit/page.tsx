// C3-C4: Quick Audit + Batch Mode — Run single or batch audits from the admin panel.
export const dynamic = 'force-dynamic';

import { QuickAuditClient } from './quick-audit-client';

export default function QuickAuditPage(): JSX.Element {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quick Audit</h1>
        <p className="mt-1 text-sm text-gray-500">
          Run a single mini audit or queue a batch of domains for parallel processing.
        </p>
      </div>
      <QuickAuditClient />
    </div>
  );
}
