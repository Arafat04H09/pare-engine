import robotsParser from 'robots-parser';
import { RobotsTxtAnalysis } from '@pare-engine/core';

// Mock fetch for robots.txt if actual fetch fails
async function fetchText(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (response.ok) return await response.text();
    } catch (e) {}
    return null;
}

export async function checkRobotsTxt(domain: string): Promise<RobotsTxtAnalysis> {
    const robotsUrl = `${domain}/robots.txt`;
    const robotsContent = await fetchText(robotsUrl);
    
    if (!robotsContent) {
        return { aiFriendly: true, blockedBots: [] }; // Assume open if no robots.txt
    }

    const robot = robotsParser(robotsUrl, robotsContent);
    
    // Check key AI bots
    const aiBots = ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];
    const blockedBots: string[] = [];

    for (const bot of aiBots) {
        if (robot.isDisallowed(`${domain}/`, bot)) {
            blockedBots.push(bot);
        }
    }

    return {
        aiFriendly: blockedBots.length === 0,
        blockedBots
    };
}

export async function checkLlmsTxt(domain: string): Promise<{ standard: boolean; full: boolean }> {
    const standard = await fetchText(`${domain}/llms.txt`);
    const full = await fetchText(`${domain}/llms-full.txt`);
    
    return {
        standard: !!standard && standard.length > 0,
        full: !!full && full.length > 0
    };
}
