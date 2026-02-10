import { redirect } from 'next/navigation';
import { authenticateAdmin } from '@/lib/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
};

async function loginAction(formData: FormData): Promise<void> {
  'use server';

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const from = formData.get('from') as string;

  if (!email || !password) {
    redirect('/admin/login?error=missing_fields');
  }

  const result = await authenticateAdmin(email, password);

  if (result.success) {
    redirect(from || '/admin');
  } else {
    redirect('/admin/login?error=invalid_credentials');
  }
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string; from?: string }>;
}

export async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;
  const from = params.from || '/admin';

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">pare</h1>
          <p className="text-navy-300 mt-2">Admin Panel</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-bold text-navy mb-6">Sign In</h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error === 'missing_fields'
                ? 'Please enter both email and password.'
                : 'Invalid email or password.'}
            </div>
          )}
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="from" value={from} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy mb-1">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy mb-1">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-navy-200 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-teal-400 transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
