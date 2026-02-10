import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
};

export function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-navy-100">
          <p className="text-sm text-navy-400 mb-1">Active Clients</p>
          <p className="text-3xl font-bold text-navy font-mono">--</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-navy-100">
          <p className="text-sm text-navy-400 mb-1">Audits This Month</p>
          <p className="text-3xl font-bold text-navy font-mono">--</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-navy-100">
          <p className="text-sm text-navy-400 mb-1">Avg Score</p>
          <p className="text-3xl font-bold text-navy font-mono">--</p>
        </div>
      </div>
    </div>
  );
}
