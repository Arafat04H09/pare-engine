import * as cheerio from 'cheerio';
import { PageContentAnalysis } from '@pare-engine/core';

export function analyzeContent(html: string, url: string): PageContentAnalysis {
    const $ = cheerio.load(html);
    const text = $('body').text();
    
    // 1. Answer First Score (heuristic: meaningful text in first 200 chars)
    const firstParagraph = $('p').first().text().trim();
    const answerFirstScore = firstParagraph.length > 50 && firstParagraph.length < 300 ? 100 : 0;

    // 2. Stats Count (numbers followed by % or keyword)
    const statsRegex = /\d+(\.\d+)?%|\d+(\.\d+)?\s+(clients|years|awards|locations|reviews)/gi;
    const statsCount = (text.match(statsRegex) || []).length;

    // 3. Author Attribution
    const hasAuthor = $('meta[name="author"]').length > 0 || 
                     text.toLowerCase().includes('written by') || 
                     $('.author-bio').length > 0;

    return {
        url,
        answerFirstScore,
        statsCount,
        hasAuthor
    };
}
