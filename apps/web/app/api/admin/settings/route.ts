// GET/POST /api/admin/settings — Manage operator settings (API key status, branding).
// Settings are stored as a single-row JSONB in the settings JSON file since
// the database schema is read-only for this spec.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { validateSession } from '@/lib/session';

const SettingsUpdateSchema = z.object({
  brandPrimaryColor: z.string().optional(),
  brandAccentColor: z.string().optional(),
  companyName: z.string().optional(),
  logoUrl: z.string().optional(),
  replyToEmail: z.string().email().or(z.literal('')).optional(),
});

const SETTINGS_DIR = join(process.cwd(), 'data');
const SETTINGS_FILE = join(SETTINGS_DIR, 'settings.json');

interface AppSettings {
  brandPrimaryColor: string;
  brandAccentColor: string;
  companyName: string;
  logoUrl: string;
  replyToEmail: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  brandPrimaryColor: '#1B2A4A',
  brandAccentColor: '#00D4AA',
  companyName: 'Pare Consulting',
  logoUrl: '',
  replyToEmail: '',
};

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await mkdir(SETTINGS_DIR, { recursive: true });
  await writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

function getApiKeyStatus(): Record<string, boolean> {
  return {
    OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY),
    GOOGLE_GENERATIVE_AI_API_KEY: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
    PERPLEXITY_API_KEY: Boolean(process.env.PERPLEXITY_API_KEY),
    FIRECRAWL_API_KEY: Boolean(process.env.FIRECRAWL_API_KEY),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    STRIPE_SECRET_KEY: Boolean(process.env.STRIPE_SECRET_KEY),
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
  };
}

export async function GET(): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
    const settings = await loadSettings();
    const apiKeys = getApiKeyStatus();
    return NextResponse.json({ settings, apiKeys });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load settings', details: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await validateSession())) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }
    const raw = await request.json();
    const parsed = SettingsUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 });
    }
    const body = parsed.data;
    const current = await loadSettings();
    const updated: AppSettings = {
      brandPrimaryColor: body.brandPrimaryColor ?? current.brandPrimaryColor,
      brandAccentColor: body.brandAccentColor ?? current.brandAccentColor,
      companyName: body.companyName ?? current.companyName,
      logoUrl: body.logoUrl ?? current.logoUrl,
      replyToEmail: body.replyToEmail ?? current.replyToEmail,
    };
    await saveSettings(updated);
    return NextResponse.json({ settings: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save settings', details: message }, { status: 500 });
  }
}
