import { QueryResult } from '@pare-engine/core';

export function parseResponse(
  response: string,
  businessName: string,
  domain: string,
  competitors: string[]
): Omit<QueryResult, 'platform' | 'query' | 'executedAt' | 'response' | 'responseHash'> {
  
  const lowerResponse = response.toLowerCase();
  
  // 1. Detect Brand Mention (Exact + Fuzzy)
  const brandMentioned = detectBrandMention(lowerResponse, businessName.toLowerCase());

  // 2. Detect Brand Position
  const brandPosition = brandMentioned
    ? calculatePosition(lowerResponse, businessName.toLowerCase(), competitors.map(c => c.toLowerCase()))
    : null;

  // 3. Analyze Sentiment
  const brandSentiment = brandMentioned
    ? analyzeSentiment(lowerResponse, businessName.toLowerCase())
    : 'not_mentioned';

  // 4. Extract Citations
  const citedUrls = extractUrls(response);
  const brandUrlCited = citedUrls.some(url => url.includes(domain.replace('www.', '')));

  // 5. Competitor Mentions
  const competitorMentions: Record<string, any> = {};
  for (const comp of competitors) {
    const compLower = comp.toLowerCase();
    const mentioned = detectBrandMention(lowerResponse, compLower);
    competitorMentions[comp] = {
      mentioned,
      position: mentioned ? calculatePosition(lowerResponse, compLower, [businessName.toLowerCase(), ...competitors.map(c => c.toLowerCase())]) : null,
      sentiment: mentioned ? analyzeSentiment(lowerResponse, compLower) : 'not_mentioned'
    };
  }

  return {
    brandMentioned,
    brandPosition,
    brandSentiment,
    brandUrlCited,
    citedUrls,
    competitorMentions
  };
}

function detectBrandMention(text: string, brand: string): boolean {
  if (text.includes(brand)) return true;
  // Simple fuzzy: check if 2 significant words appear
  const words = brand.split(' ').filter(w => w.length > 3);
  if (words.length >= 2) {
      const matchCount = words.filter(w => text.includes(w)).length;
      return matchCount >= 2;
  }
  return false;
}

function calculatePosition(text: string, brand: string, allBrands: string[]): number | null {
    // Find index of first occurrence of each brand
    const positions = allBrands.map(b => ({ name: b, index: text.indexOf(b) }))
        .filter(p => p.index !== -1)
        .sort((a, b) => a.index - b.index);
    
    const rank = positions.findIndex(p => p.name === brand);
    return rank === -1 ? null : rank + 1;
}

function analyzeSentiment(text: string, brand: string): 'positive' | 'neutral' | 'negative' {
    // Basic keyword heuristic for MVP
    const positiveWords = ['best', 'top', 'recommend', 'excellent', 'great', 'leading'];
    const negativeWords = ['avoid', 'bad', 'poor', 'issue', 'complaint'];
    
    // Extract context around mention
    const index = text.indexOf(brand);
    const context = text.substring(Math.max(0, index - 100), Math.min(text.length, index + 200));
    
    let score = 0;
    positiveWords.forEach(w => { if (context.includes(w)) score++; });
    negativeWords.forEach(w => { if (context.includes(w)) score--; });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
}

function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}
