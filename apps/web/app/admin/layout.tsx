import Link from 'next/link';
import { destroySession } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function logoutAction(): Promise<void> {
  'use server';
  await destroySession();
  redirect('/admin/login');
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-50">
      <nav className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-lg font-bold text-teal">pare admin</Link>
            <Link href="/admin" className="text-navy-200 hover:text-white transition-colors text-sm">Dashboard</Link>
            <Link href="/admin/clients" className="text-navy-200 hover:text-white transition-colors text-sm">Clients</Link>
            <Link href="/admin/audits" className="text-navy-200 hover:text-white transition-colors text-sm">Audits</Link>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-navy-300 hover:text-white transition-colors text-sm">
              Logout
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
