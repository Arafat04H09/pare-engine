import { fetchPageContent, crawlPages } from './crawler.js';
import { analyzeSchema } from './schema.js';
import { analyzeContent } from './content.js';
import { checkRobotsTxt, checkLlmsTxt } from './technical.js';
import { PageSchemaAnalysis, PageContentAnalysis, RobotsTxtAnalysis } from '@pare-engine/core';

export interface SiteAnalysisResult {
    schemaAnalysis: PageSchemaAnalysis[];
    contentAnalysis: PageContentAnalysis[];
    technical: {
        robotsTxt: RobotsTxtAnalysis;
        llmsTxt: boolean;
        llmsFullTxt: boolean;
    };
}

export async function analyzeSite(url: string): Promise<SiteAnalysisResult> {
    const domain = new URL(url).origin;
    
    // Parallel technical checks
    const [robotsTxt, llmsTxt] = await Promise.all([
        checkRobotsTxt(domain),
        checkLlmsTxt(domain)
    ]);

    // Crawl a few pages (simulated breadth 1)
    const pagesToAnalyze = await crawlPages(url);
    const schemaAnalysis: PageSchemaAnalysis[] = [];
    const contentAnalysis: PageContentAnalysis[] = [];

    // Analyze each page (could be parallelized)
    for (const pageUrl of pagesToAnalyze) {
        const html = await fetchPageContent(pageUrl);
        if (!html) continue;

        schemaAnalysis.push(analyzeSchema(html, pageUrl));
        contentAnalysis.push(analyzeContent(html, pageUrl));
    }

    return {
        schemaAnalysis,
        contentAnalysis,
        technical: {
            robotsTxt,
            llmsTxt: llmsTxt.standard,
            llmsFullTxt: llmsTxt.full
        }
    };
}
