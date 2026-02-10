import { chromium, Browser, Page } from 'playwright';

export async function fetchPageContent(url: string): Promise<string> {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const content = await page.content();
        return content;
    } catch (e) {
        console.error(`Failed to fetch ${url}`, e);
        return '';
    } finally {
        await browser.close();
    }
}

// Reusable browser context for multi-page crawls
export async function createBrowser(): Promise<Browser> {
    return await chromium.launch({ headless: true });
}

export async function crawlPages(startUrl: string, limit: number = 10): Promise<string[]> {
    // Basic BFS crawler logic would go here
    // For MVP, just returning startUrl + inferred pages
    return [
        startUrl,
        `${startUrl}/about`,
        `${startUrl}/contact`,
        `${startUrl}/services`
    ];
}
