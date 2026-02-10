// Minimal root page for Next.js App Router.
// S14 owns this file and will replace it with the full homepage at merge.

export default function HomePage() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px', color: '#1B2A4A' }}>Pare</h1>
      <p style={{ color: '#64748B' }}>AI Visibility Consulting</p>
      <a href="/audit" style={{ color: '#00D4AA', marginTop: '16px', display: 'inline-block' }}>
        Start Your AI Readiness Audit
      </a>
    </div>
  );
}
