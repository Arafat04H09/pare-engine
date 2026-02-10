'use client';
import { useState } from 'react';
interface RerunButtonProps { clientId: string; businessName: string; domain: string; vertical: string; contactEmail: string; googlePlaceId?: string; }
export function RerunButton({ clientId, businessName, domain, vertical, contactEmail, googlePlaceId }: RerunButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  async function handleRerun() {
    if (!window.confirm(`Re-run audit for ${businessName}?`)) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`/api/admin/audits/${clientId}/rerun`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId, businessName, domain, vertical, contactEmail, googlePlaceId, auditType: 'full' }) });
      const data = await res.json();
      setResult(res.ok ? { success: true, message: data.message ?? 'Triggered.' } : { success: false, message: data.error ?? 'Failed.' });
    } catch (err) { setResult({ success: false, message: err instanceof Error ? err.message : 'Error' }); }
    finally { setLoading(false); }
  }
  return (<div className="flex flex-col items-end gap-2"><button onClick={handleRerun} disabled={loading} className="rounded-md bg-[#1B2A4A] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a3d66] disabled:opacity-50 transition-colors">{loading ? 'Triggering...' : 'Re-run Audit'}</button>{result && <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>{result.message}</p>}</div>);
}
