// Owner: S13 (Email Delivery). Consumers: S12.
// React Email template for audit request confirmation ("Audit received, processing").
// Brand: Deep Navy #1B2A4A, Electric Teal #00D4AA.

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Preview,
  Heading,
  Font,
} from '@react-email/components';

// --- Brand Colors (from packages/report-generator/src/styles.ts) ---

const BRAND = {
  deepNavy: '#1B2A4A',
  electricTeal: '#00D4AA',
  text: '#334155',
  lightGray: '#F8FAFC',
  mediumGray: '#94A3B8',
  white: '#FFFFFF',
  border: '#E2E8F0',
} as const;

// --- Props ---

export interface AuditReceiptEmailProps {
  businessName: string;
  domain: string;
  auditType: 'full' | 'mini';
  contactEmail: string;
  estimatedMinutes?: number;
}

// --- Styles ---

const main: React.CSSProperties = {
  backgroundColor: BRAND.lightGray,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: BRAND.white,
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: `1px solid ${BRAND.border}`,
};

const headerStyle: React.CSSProperties = {
  backgroundColor: BRAND.deepNavy,
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const logoStyle: React.CSSProperties = {
  color: BRAND.white,
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  margin: '0',
};

const headerSubtitle: React.CSSProperties = {
  color: BRAND.electricTeal,
  fontSize: '14px',
  fontWeight: 500,
  margin: '4px 0 0 0',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const bodyPadding: React.CSSProperties = {
  padding: '32px 40px',
};

const statusBadge: React.CSSProperties = {
  backgroundColor: '#ECFDF5',
  border: '1px solid #A7F3D0',
  borderRadius: '24px',
  padding: '8px 20px',
  display: 'inline-block',
  color: '#065F46',
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 auto 24px auto',
};

const detailRow: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: `1px solid ${BRAND.border}`,
};

const detailLabel: React.CSSProperties = {
  color: BRAND.mediumGray,
  fontSize: '13px',
  fontWeight: 500,
  margin: '0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const detailValue: React.CSSProperties = {
  color: BRAND.deepNavy,
  fontSize: '15px',
  fontWeight: 600,
  margin: '2px 0 0 0',
};

const stepContainer: React.CSSProperties = {
  padding: '16px 0',
};

const stepItem: React.CSSProperties = {
  fontSize: '14px',
  color: BRAND.text,
  lineHeight: '28px',
  margin: '0',
};

const stepNumber: React.CSSProperties = {
  display: 'inline-block',
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: BRAND.electricTeal,
  color: BRAND.deepNavy,
  fontSize: '13px',
  fontWeight: 700,
  textAlign: 'center' as const,
  lineHeight: '24px',
  marginRight: '10px',
};

const ctaButton: React.CSSProperties = {
  backgroundColor: BRAND.electricTeal,
  borderRadius: '6px',
  color: BRAND.deepNavy,
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 600,
  padding: '14px 32px',
  textDecoration: 'none',
  textAlign: 'center' as const,
};

const footerStyle: React.CSSProperties = {
  padding: '24px 40px',
  backgroundColor: BRAND.lightGray,
  textAlign: 'center' as const,
};

const footerText: React.CSSProperties = {
  color: BRAND.mediumGray,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0',
};

// --- Email Component ---

export function AuditReceiptEmail(props: AuditReceiptEmailProps): React.ReactElement {
  const {
    businessName,
    domain,
    auditType,
    contactEmail,
    estimatedMinutes = 5,
  } = props;

  const auditTypeLabel = auditType === 'full' ? 'Full AI Readiness Audit' : 'Mini AI Readiness Audit';

  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYAZ9hiA.woff2',
            format: 'woff2',
          }}
          fontWeight={600}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Arial"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>
        {`Your ${auditTypeLabel} for ${businessName} is being generated. Results will arrive in ~${estimatedMinutes} minutes.`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>pare</Text>
            <Text style={headerSubtitle}>Audit Confirmation</Text>
          </Section>

          {/* Body */}
          <Section style={bodyPadding}>
            {/* Status Badge */}
            <Section style={{ textAlign: 'center' as const }}>
              <Text style={statusBadge}>Audit In Progress</Text>
            </Section>

            <Heading
              as="h1"
              style={{
                color: BRAND.deepNavy,
                fontSize: '22px',
                fontWeight: 700,
                textAlign: 'center' as const,
                margin: '0 0 8px 0',
              }}
            >
              We&apos;re analyzing {businessName}
            </Heading>
            <Text
              style={{
                color: BRAND.text,
                fontSize: '15px',
                textAlign: 'center' as const,
                margin: '0 0 24px 0',
                lineHeight: '24px',
              }}
            >
              Your {auditTypeLabel.toLowerCase()} has been received and is now being
              processed. You&apos;ll receive your branded PDF report at{' '}
              <strong>{contactEmail}</strong> within approximately{' '}
              <strong>{estimatedMinutes} minutes</strong>.
            </Text>

            <Hr style={{ borderColor: BRAND.border, margin: '0 0 24px 0' }} />

            {/* Audit Details */}
            <Heading
              as="h2"
              style={{
                color: BRAND.deepNavy,
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 12px 0',
              }}
            >
              Audit Details
            </Heading>

            <Section style={detailRow}>
              <Text style={detailLabel}>Business</Text>
              <Text style={detailValue}>{businessName}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Website</Text>
              <Text style={detailValue}>{domain}</Text>
            </Section>
            <Section style={detailRow}>
              <Text style={detailLabel}>Audit Type</Text>
              <Text style={detailValue}>{auditTypeLabel}</Text>
            </Section>
            <Section style={{ ...detailRow, borderBottom: 'none' }}>
              <Text style={detailLabel}>Delivery Email</Text>
              <Text style={detailValue}>{contactEmail}</Text>
            </Section>

            <Hr style={{ borderColor: BRAND.border, margin: '24px 0' }} />

            {/* What Happens Next */}
            <Heading
              as="h2"
              style={{
                color: BRAND.deepNavy,
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 12px 0',
              }}
            >
              What Happens Next
            </Heading>

            <Section style={stepContainer}>
              <Text style={stepItem}>
                <span style={stepNumber}>1</span>
                We crawl your website to analyze content and structure
              </Text>
              <Text style={stepItem}>
                <span style={stepNumber}>2</span>
                We query ChatGPT, Perplexity, and Gemini about your business
              </Text>
              <Text style={stepItem}>
                <span style={stepNumber}>3</span>
                We score your AI readiness across 5 pillars (0-100)
              </Text>
              <Text style={stepItem}>
                <span style={stepNumber}>4</span>
                We generate a branded PDF report with actionable recommendations
              </Text>
              <Text style={stepItem}>
                <span style={stepNumber}>5</span>
                Your report is delivered to your inbox
              </Text>
            </Section>

            <Hr style={{ borderColor: BRAND.border, margin: '24px 0' }} />

            {/* CTA */}
            <Section style={{ textAlign: 'center' as const }}>
              <Text
                style={{
                  color: BRAND.text,
                  fontSize: '14px',
                  margin: '0 0 16px 0',
                }}
              >
                While you wait, learn more about how AI engines see local businesses.
              </Text>
              <Button
                href="https://pareconsulting.com/services"
                style={ctaButton}
              >
                Learn About GEO
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Pare Consulting &middot; Generative Engine Optimization
            </Text>
            <Text style={{ ...footerText, marginTop: '4px' }}>
              This confirmation was sent to {contactEmail} because an audit was
              requested for {domain}.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
