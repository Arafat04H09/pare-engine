// Owner: S15 (Audit Form + Stripe)
// /audit/success -- Confirmation page shown after successful Stripe Checkout.

'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const stepStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: 1.6,
};

export function AuditSuccessPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '80px 24px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', textAlign: 'center' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1B2A4A', marginBottom: '12px' }}>
        Payment Confirmed
      </h1>

      <p style={{ fontSize: '18px', color: '#64748B', lineHeight: 1.6, marginBottom: '32px' }}>
        Your AI Readiness Audit is now being processed. We are crawling your website, querying AI engines, and generating your comprehensive report.
      </p>

      <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '24px', marginBottom: '32px', textAlign: 'left' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1B2A4A', marginBottom: '16px' }}>
          What happens next
        </h2>
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li style={stepStyle}>
            <strong>Site Crawl</strong> -- We scan your website for content quality, schema markup, and technical readiness.
          </li>
          <li style={stepStyle}>
            <strong>AI Engine Queries</strong> -- We ask ChatGPT, Perplexity, and Gemini about your business to measure visibility.
          </li>
          <li style={stepStyle}>
            <strong>5-Pillar Scoring</strong> -- Your business is scored 0-100 across AI Visibility, Content, Schema, Technical, and Local/GBP.
          </li>
          <li style={stepStyle}>
            <strong>Report Delivery</strong> -- A branded PDF report with actionable recommendations is emailed to you within 24 hours.
          </li>
        </ol>
      </div>

      <p style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>
        Check your email for a confirmation receipt from Stripe.
      </p>

      {sessionId && (
        <p style={{ fontSize: '12px', color: '#CBD5E1' }}>
          Reference: {sessionId.slice(0, 20)}...
        </p>
      )}

      <a href="/" style={{ display: 'inline-block', marginTop: '32px', padding: '12px 24px', backgroundColor: '#1B2A4A', color: '#FFFFFF', textDecoration: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>
        Back to Home
      </a>
    </div>
  );
}

function AuditSuccessPageWrapper(): React.ReactElement {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>}>
      <AuditSuccessPage />
    </Suspense>
  );
}

export { AuditSuccessPageWrapper as default };
