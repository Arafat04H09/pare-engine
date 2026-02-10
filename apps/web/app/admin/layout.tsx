// Admin layout. S17 will replace with auth-gated version at merge.
import Link from 'next/link';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (<div className="min-h-screen bg-gray-50"><nav className="border-b border-gray-200 bg-white"><div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6"><div className="flex items-center gap-8"><Link href="/admin" className="text-lg font-bold" style={{ color: '#00D4AA' }}>pare admin</Link><Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Dashboard</Link><Link href="/admin/clients" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Clients</Link><Link href="/admin/audits" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Audits</Link></div></div></nav><main className="mx-auto max-w-7xl px-6 py-8">{children}</main></div>);
}
