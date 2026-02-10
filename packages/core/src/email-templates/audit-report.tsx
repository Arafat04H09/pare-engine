// Owner: S13 (Email Delivery). Consumers: S12.
// React Email template for delivering audit PDF reports.
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
  Row,
  Column,
  Font,
} from '@react-email/components';

// --- Brand Colors (from packages/report-generator/src/styles.ts) ---

const BRAND = {
  deepNavy: '#1B2A4A',
  electricTeal: '#00D4AA',
  warning: '#EF4444',
  success: '#22C55E',
  text: '#334155',
  lightGray: '#F8FAFC',
  mediumGray: '#94A3B8',
  white: '#FFFFFF',
  border: '#E2E8F0',
} as const;

// --- Props ---

export interface AuditReportEmailProps {
  businessName: string;
  domain: string;
  overallScore: number;
  letterGrade: string;
  pillarScores: {
    aiVisibility: { score: number; maxScore: number };
    contentQuality: { score: number; maxScore: number };
    schemaStructuredData: { score: number; maxScore: number };
    technicalReadiness: { score: number; maxScore: number };
    localGbp: { score: number; maxScore: number };
  };
  topFindings: Array<{
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
  }>;
  auditDate: string;
}

// --- Helper Functions ---

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return BRAND.success;
    case 'B':
      return BRAND.electricTeal;
    case 'C':
      return '#F59E0B';
    case 'D':
      return '#F97316';
    case 'F':
      return BRAND.warning;
    default:
      return BRAND.text;
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return BRAND.warning;
    case 'warning':
      return '#F59E0B';
    case 'success':
      return BRAND.success;
    case 'info':
    default:
      return BRAND.electricTeal;
  }
}

function formatPillarName(key: string): string {
  const names: Record<string, string> = {
    aiVisibility: 'AI Visibility',
    contentQuality: 'Content Quality',
    schemaStructuredData: 'Schema & Structured Data',
    technicalReadiness: 'Technical Readiness',
    localGbp: 'Local/GBP & Third-Party',
  };
  return names[key] ?? key;
}

// --- Main Styles ---

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

const scoreCircle: React.CSSProperties = {
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  border: `4px solid ${BRAND.electricTeal}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px auto',
  textAlign: 'center' as const,
};

const pillarRow: React.CSSProperties = {
  padding: '10px 0',
  borderBottom: `1px solid ${BRAND.border}`,
};

const pillarLabel: React.CSSProperties = {
  color: BRAND.text,
  fontSize: '14px',
  margin: '0',
};

const pillarScore: React.CSSProperties = {
  color: BRAND.deepNavy,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
  textAlign: 'right' as const,
};

const findingBullet: React.CSSProperties = {
  fontSize: '14px',
  color: BRAND.text,
  lineHeight: '24px',
  margin: '4px 0',
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

export function AuditReportEmail(props: AuditReportEmailProps): React.ReactElement {
  const {
    businessName,
    domain,
    overallScore,
    letterGrade,
    pillarScores,
    topFindings,
    auditDate,
  } = props;

  const gradeColor = getGradeColor(letterGrade);

  const pillarEntries = Object.entries(pillarScores) as Array<
    [keyof typeof pillarScores, { score: number; maxScore: number }]
  >;

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
        {`${businessName} scored ${overallScore}/100 (${letterGrade}) on their AI Readiness Audit. Full report attached.`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>pare</Text>
            <Text style={headerSubtitle}>AI Readiness Audit</Text>
          </Section>

          {/* Score Hero */}
          <Section style={bodyPadding}>
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
              Your AI Readiness Score
            </Heading>
            <Text
              style={{
                color: BRAND.mediumGray,
                fontSize: '14px',
                textAlign: 'center' as const,
                margin: '0 0 24px 0',
              }}
            >
              {businessName} &middot; {domain} &middot; {auditDate}
            </Text>

            {/* Score Display */}
            <table
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ margin: '0 auto 8px auto' }}
            >
              <tr>
                <td
                  style={{
                    ...scoreCircle,
                    borderColor: gradeColor,
                    width: '120px',
                    height: '120px',
                  }}
                >
                  <div>
                    <Text
                      style={{
                        color: gradeColor,
                        fontSize: '48px',
                        fontWeight: 700,
                        margin: '0',
                        lineHeight: '1',
                      }}
                    >
                      {letterGrade}
                    </Text>
                    <Text
                      style={{
                        color: BRAND.text,
                        fontSize: '20px',
                        fontWeight: 600,
                        margin: '0',
                      }}
                    >
                      {overallScore}/100
                    </Text>
                  </div>
                </td>
              </tr>
            </table>

            <Text
              style={{
                color: BRAND.mediumGray,
                fontSize: '13px',
                textAlign: 'center' as const,
                margin: '0 0 24px 0',
              }}
            >
              Your full report is attached as a PDF.
            </Text>

            <Hr style={{ borderColor: BRAND.border, margin: '0 0 24px 0' }} />

            {/* Pillar Breakdown */}
            <Heading
              as="h2"
              style={{
                color: BRAND.deepNavy,
                fontSize: '16px',
                fontWeight: 600,
                margin: '0 0 12px 0',
              }}
            >
              Score Breakdown
            </Heading>

            {pillarEntries.map(([key, pillar]) => (
              <Row key={key} style={pillarRow}>
                <Column style={{ width: '70%' }}>
                  <Text style={pillarLabel}>{formatPillarName(key)}</Text>
                </Column>
                <Column style={{ width: '30%' }}>
                  <Text style={pillarScore}>
                    {Math.round(pillar.score)}/{pillar.maxScore}
                  </Text>
                </Column>
              </Row>
            ))}

            {/* Top Findings */}
            {topFindings.length > 0 && (
              <>
                <Heading
                  as="h2"
                  style={{
                    color: BRAND.deepNavy,
                    fontSize: '16px',
                    fontWeight: 600,
                    margin: '24px 0 12px 0',
                  }}
                >
                  Key Findings
                </Heading>
                {topFindings.map((finding, index) => (
                  <Text key={index} style={findingBullet}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getSeverityColor(finding.severity),
                        marginRight: '8px',
                      }}
                    />
                    {finding.title}
                  </Text>
                ))}
              </>
            )}

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
                Ready to improve your AI visibility? Our team can implement the
                recommendations in your report.
              </Text>
              <Button
                href="https://pareconsulting.com/services"
                style={ctaButton}
              >
                Explore Our Services
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Pare Consulting &middot; Generative Engine Optimization
            </Text>
            <Text style={{ ...footerText, marginTop: '4px' }}>
              This report was generated automatically. If you did not request this
              audit, please disregard this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
