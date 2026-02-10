import * as cheerio from 'cheerio';
import { PageSchemaAnalysis } from '@pare-engine/core';

export function analyzeSchema(html: string, url: string): PageSchemaAnalysis {
    const $ = cheerio.load(html);
    const jsonLdScripts = $('script[type="application/ld+json"]');
    const schemaTypes: string[] = [];
    const validationErrors: string[] = [];

    jsonLdScripts.each((_, el) => {
        try {
            const json = JSON.parse($(el).html() || '{}');
            extractTypes(json, schemaTypes);
        } catch (e) {
            validationErrors.push('Invalid JSON-LD syntax');
        }
    });

    return {
        url,
        schemaTypes: [...new Set(schemaTypes)], // Unique types
        validationErrors
    };
}

function extractTypes(json: any, list: string[]) {
    if (!json) return;
    
    if (json['@type']) {
        if (Array.isArray(json['@type'])) {
            list.push(...json['@type']);
        } else {
            list.push(json['@type']);
        }
    }

    // Recurse into common nested properties
    if (json.hasPart) extractTypes(json.hasPart, list);
    if (json.mainEntity) extractTypes(json.mainEntity, list);
    if (Array.isArray(json)) {
        json.forEach(item => extractTypes(item, list));
    }
}
