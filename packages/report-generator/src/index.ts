import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { MiniAuditReport } from './templates/MiniAudit.js';
import { AuditResult } from '@pare-engine/core';

export async function generateMiniAuditPDF(
    data: AuditResult, 
    businessName: string
): Promise<NodeJS.ReadableStream> {
    return await renderToStream(
        React.createElement(MiniAuditReport, { data, businessName })
    );
}

// In production, you might also have:
// export async function generateFullAuditPDF(...)
