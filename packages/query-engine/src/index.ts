import { QueryResult, Platform } from '@pare-engine/core';
import { LLMProvider, OpenAIProvider, AnthropicProvider, PerplexityProvider, GeminiProvider, GoogleAIOProvider } from './providers/index.js';
import { parseResponse } from './parser.js';
import { generatePrompts } from './prompts.js';
import { createHash } from 'crypto';

const providers: Record<Platform, LLMProvider> = {
    chatgpt: new OpenAIProvider(),
    claude: new AnthropicProvider(),
    perplexity: new PerplexityProvider(),
    gemini: new GeminiProvider(),
    google_aio: new GoogleAIOProvider()
};

export interface BatchQueryConfig {
    businessName: string;
    domain: string;
    vertical: string;
    location: string;
    competitors: string[];
    platforms: Platform[];
}

export async function executeAuditQueries(config: BatchQueryConfig): Promise<QueryResult[]> {
    const prompts = generatePrompts(config.vertical, config.location);
    const results: QueryResult[] = [];

    // Parallel execution across platforms
    // Note: In production, use limited concurrency (p-limit)
    
    for (const platform of config.platforms) {
        const provider = providers[platform];
        if (!provider) continue;

        for (const query of prompts) {
            try {
                const response = await provider.executeQuery(query);
                const parsed = parseResponse(response, config.businessName, config.domain, config.competitors);
                
                results.push({
                    platform,
                    query,
                    response,
                    ...parsed,
                    responseHash: createHash('md5').update(response).digest('hex'),
                    executedAt: new Date()
                });
            } catch (error) {
                console.error(`Failed to execute query on ${platform}:`, error);
                // In production: push error result or retry
            }
        }
    }

    return results;
}
