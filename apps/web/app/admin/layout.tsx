import Link from 'next/link';
import { destroySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { CommandPalette } from '@/components/command-palette';

async function logoutAction(): Promise<void> {
  'use server';
  await destroySession();
  redirect('/admin/login');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-navy-50">
      <nav className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-lg font-bold text-teal">pare admin</Link>
            <Link href="/admin" className="text-navy-200 hover:text-white transition-colors text-sm">Dashboard</Link>
            <Link href="/admin/clients" className="text-navy-200 hover:text-white transition-colors text-sm">Clients</Link>
            <Link href="/admin/audits" className="text-navy-200 hover:text-white transition-colors text-sm">Audits</Link>
            <Link href="/admin/pipeline" className="text-navy-200 hover:text-white transition-colors text-sm">Pipeline</Link>
            <Link href="/admin/settings" className="text-navy-200 hover:text-white transition-colors text-sm">Settings</Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-navy-400 text-xs hidden sm:block">Ctrl+K</span>
            <form action={logoutAction}>
              <button type="submit" className="text-navy-300 hover:text-white transition-colors text-sm">
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      <CommandPalette />
    </div>
  );
}
