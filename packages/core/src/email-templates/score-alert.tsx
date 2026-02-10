// Owner: S25 (Score Delta Alerts). Consumers: S25 (score-alerts.ts).
// React Email template for operator score change alerts.
// Sent when weekly monitoring detects a significant score delta.
// Brand: Deep Navy #1B2A4A, Electric Teal #00D4AA.

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
  Heading,
  Row,
  Column,
  Font,
} from '@react-email/components';

// --- Brand Colors ---

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

export interface PillarDelta {
  pillarName: string;
  oldScore: number;
  newScore: number;
  maxScore: number;
  delta: number;
}

export interface ScoreAlertEmailProps {
  businessName: string;
  domain: string;
  oldOverallScore: number;
  newOverallScore: number;
  overallDelta: number;
  oldLetterGrade: string;
  newLetterGrade: string;
  changedPillars: PillarDelta[];
  possibleCauses: string[];
  monitoringDate: string;
}

// --- Helpers ---

function getDeltaColor(delta: number): string {
  if (delta > 0) return BRAND.success;
  if (delta < 0) return BRAND.warning;
  return BRAND.text;
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

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

const deltaDisplay: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '16px 0',
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

const pillarScoreStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  margin: '0',
  textAlign: 'right' as const,
};

const causeItem: React.CSSProperties = {
  fontSize: '14px',
  color: BRAND.text,
  lineHeight: '24px',
  margin: '4px 0',
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

export function ScoreAlertEmail(props: ScoreAlertEmailProps): React.ReactElement {
  const {
    businessName,
    domain,
    oldOverallScore,
    newOverallScore,
    overallDelta,
    oldLetterGrade,
    newLetterGrade,
    changedPillars,
    possibleCauses,
    monitoringDate,
  } = props;

  const deltaColor = getDeltaColor(overallDelta);
  const direction = overallDelta > 0 ? 'improved' : 'declined';

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
        {`Score alert: ${businessName} ${direction} by ${Math.abs(overallDelta)} points (${oldOverallScore} -> ${newOverallScore})`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerStyle}>
            <Text style={logoStyle}>pare</Text>
            <Text style={headerSubtitle}>Score Change Alert</Text>
          </Section>

          {/* Delta Hero */}
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
              Score Change Detected
            </Heading>
            <Text
              style={{
                color: BRAND.mediumGray,
                fontSize: '14px',
                textAlign: 'center' as const,
                margin: '0 0 24px 0',
              }}
            >
              {businessName} &middot; {domain} &middot; {monitoringDate}
            </Text>

            {/* Score Comparison */}
            <table
              cellPadding="0"
              cellSpacing="0"
              border={0}
              style={{ margin: '0 auto 24px auto', width: '100%' }}
            >
              <tr>
                {/* Old Score */}
                <td style={{ textAlign: 'center' as const, width: '40%' }}>
                  <Text
                    style={{
                      color: BRAND.mediumGray,
                      fontSize: '12px',
                      fontWeight: 500,
                      margin: '0 0 4px 0',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Previous
                  </Text>
                  <Text
                    style={{
                      color: getGradeColor(oldLetterGrade),
                      fontSize: '36px',
                      fontWeight: 700,
                      margin: '0',
                      lineHeight: '1.2',
                    }}
                  >
                    {oldOverallScore}
                  </Text>
                  <Text
                    style={{
                      color: BRAND.mediumGray,
                      fontSize: '14px',
                      margin: '0',
                    }}
                  >
                    Grade {oldLetterGrade}
                  </Text>
                </td>

                {/* Arrow and Delta */}
                <td style={{ ...deltaDisplay, width: '20%' }}>
                  <Text
                    style={{
                      color: deltaColor,
                      fontSize: '24px',
                      fontWeight: 700,
                      margin: '0',
                    }}
                  >
                    {formatDelta(overallDelta)}
                  </Text>
                  <Text
                    style={{
                      color: BRAND.mediumGray,
                      fontSize: '13px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    pts
                  </Text>
                </td>

                {/* New Score */}
                <td style={{ textAlign: 'center' as const, width: '40%' }}>
                  <Text
                    style={{
                      color: BRAND.mediumGray,
                      fontSize: '12px',
                      fontWeight: 500,
                      margin: '0 0 4px 0',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.5px',
                    }}
                  >
                    Current
                  </Text>
                  <Text
                    style={{
                      color: getGradeColor(newLetterGrade),
                      fontSize: '36px',
                      fontWeight: 700,
                      margin: '0',
                      lineHeight: '1.2',
                    }}
                  >
                    {newOverallScore}
                  </Text>
                  <Text
                    style={{
                      color: BRAND.mediumGray,
                      fontSize: '14px',
                      margin: '0',
                    }}
                  >
                    Grade {newLetterGrade}
                  </Text>
                </td>
              </tr>
            </table>

            <Hr style={{ borderColor: BRAND.border, margin: '0 0 24px 0' }} />

            {/* Changed Pillars */}
            {changedPillars.length > 0 && (
              <>
                <Heading
                  as="h2"
                  style={{
                    color: BRAND.deepNavy,
                    fontSize: '16px',
                    fontWeight: 600,
                    margin: '0 0 12px 0',
                  }}
                >
                  Pillars That Changed
                </Heading>

                {changedPillars.map((pillar, index) => (
                  <Row key={index} style={pillarRow}>
                    <Column style={{ width: '50%' }}>
                      <Text style={pillarLabel}>{pillar.pillarName}</Text>
                    </Column>
                    <Column style={{ width: '25%' }}>
                      <Text
                        style={{
                          ...pillarScoreStyle,
                          color: BRAND.text,
                          textAlign: 'center' as const,
                        }}
                      >
                        {Math.round(pillar.oldScore)} → {Math.round(pillar.newScore)}/{pillar.maxScore}
                      </Text>
                    </Column>
                    <Column style={{ width: '25%' }}>
                      <Text
                        style={{
                          ...pillarScoreStyle,
                          color: getDeltaColor(pillar.delta),
                        }}
                      >
                        {formatDelta(pillar.delta)}
                      </Text>
                    </Column>
                  </Row>
                ))}

                <Hr style={{ borderColor: BRAND.border, margin: '24px 0' }} />
              </>
            )}

            {/* Possible Causes */}
            {possibleCauses.length > 0 && (
              <>
                <Heading
                  as="h2"
                  style={{
                    color: BRAND.deepNavy,
                    fontSize: '16px',
                    fontWeight: 600,
                    margin: '0 0 12px 0',
                  }}
                >
                  Possible Causes
                </Heading>

                {possibleCauses.map((cause, index) => (
                  <Text key={index} style={causeItem}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: BRAND.electricTeal,
                        marginRight: '10px',
                      }}
                    />
                    {cause}
                  </Text>
                ))}

                <Hr style={{ borderColor: BRAND.border, margin: '24px 0' }} />
              </>
            )}

            {/* Footer Note */}
            <Text
              style={{
                color: BRAND.text,
                fontSize: '14px',
                lineHeight: '22px',
                margin: '0',
              }}
            >
              This is an automated alert from Pare's weekly monitoring system. Review the
              client's dashboard for full details and consider whether action is needed.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footerStyle}>
            <Text style={footerText}>
              Pare Consulting &middot; Operator Alert
            </Text>
            <Text style={{ ...footerText, marginTop: '4px' }}>
              This alert was sent to the operator because a significant score change was
              detected for {businessName} ({domain}).
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
