// Root layout. S14 owns and will replace at merge.
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Pare | AI Visibility Consulting', template: '%s | Pare' }, description: 'Pare audits how AI engines see your business.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return (<html lang="en"><body className="min-h-screen bg-white antialiased">{children}</body></html>); }
