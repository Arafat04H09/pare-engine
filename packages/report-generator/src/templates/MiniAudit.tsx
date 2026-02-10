import React from 'react';
import { Text, View, Document, Page } from '@react-pdf/renderer';
import { styles, colors } from '../styles.js';
import { AuditResult } from '@pare-engine/core';

interface MiniAuditProps {
  data: AuditResult;
  businessName: string;
}

export const MiniAuditReport: React.FC<MiniAuditProps> = ({ data, businessName }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>pare</Text>
          <Text style={{ fontSize: 10, color: colors.text }}>AI Readiness Assessment</Text>
        </View>

        {/* Hero Score */}
        <View style={{ marginBottom: 30, alignItems: 'center' }}>
          <Text style={styles.title}>AI Readiness Score for {businessName}</Text>
          <Text style={styles.scoreBig}>{data.overallScore}/100</Text>
          <Text style={{ fontSize: 14, color: data.overallScore > 70 ? colors.success : colors.warning }}>
             Grade: {data.letterGrade}
          </Text>
        </View>

        {/* 3 Key Pillars */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ width: '30%', padding: 10, backgroundColor: colors.lightGray, borderRadius: 5 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>AI VISIBILITY</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{data.aiVisibility.score}/35</Text>
            </View>
            <View style={{ width: '30%', padding: 10, backgroundColor: colors.lightGray, borderRadius: 5 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>SCHEMA MARKUP</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{data.schema.score}/25</Text>
            </View>
            <View style={{ width: '30%', padding: 10, backgroundColor: colors.lightGray, borderRadius: 5 }}>
                <Text style={{ fontSize: 10, color: '#64748b' }}>CONTENT</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.primary }}>{data.content.score}/20</Text>
            </View>
        </View>

        {/* Findings List */}
        <View style={styles.section}>
            <Text style={styles.title}>Key Findings</Text>
            {data.aiVisibility.mentionRate < 0.2 && (
                <Text style={styles.text}>• Your brand is mentioned in less than 20% of relevant AI queries.</Text>
            )}
            {data.schema.missingTypes.length > 0 && (
                <Text style={styles.text}>• Missing critical schema: {data.schema.missingTypes.join(', ')}.</Text>
            )}
            {data.technical.robotsTxt.blockedBots.length > 0 && (
                <Text style={styles.text}>• Your website is actively blocking AI crawlers: {data.technical.robotsTxt.blockedBots.join(', ')}.</Text>
            )}
        </View>

        <View style={styles.footer}>
          <Text>Pare Consulting • Generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
};
