import { Platform } from '@pare-engine/core';

export interface LLMProvider {
  name: Platform;
  executeQuery(query: string): Promise<string>;
}

export class OpenAIProvider implements LLMProvider {
  name: Platform = 'chatgpt';
  
  async executeQuery(query: string): Promise<string> {
    // Mock implementation for scaffold
    return `Mock ChatGPT response to: ${query}`;
  }
}

export class AnthropicProvider implements LLMProvider {
  name: Platform = 'claude';
  
  async executeQuery(query: string): Promise<string> {
     // Mock implementation for scaffold
    return `Mock Claude response to: ${query}`;
  }
}

export class PerplexityProvider implements LLMProvider {
  name: Platform = 'perplexity';
  
  async executeQuery(query: string): Promise<string> {
     // Mock implementation for scaffold
    return `Mock Perplexity response to: ${query}`;
  }
}

export class GeminiProvider implements LLMProvider {
  name: Platform = 'gemini';
  
  async executeQuery(query: string): Promise<string> {
     // Mock implementation for scaffold
    return `Mock Gemini response to: ${query}`;
  }
}

export class GoogleAIOProvider implements LLMProvider {
  name: Platform = 'google_aio';
  
  async executeQuery(query: string): Promise<string> {
     // Mock implementation for scaffold
    return `Mock Google AI Overview response to: ${query}`;
  }
}
