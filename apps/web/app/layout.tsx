// Minimal root layout for Next.js App Router.
// S14 owns this file and will replace it with the full branded layout at merge.

export const metadata = {
  title: 'Pare | AI Visibility Consulting',
  description: 'AI readiness audits for local businesses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
