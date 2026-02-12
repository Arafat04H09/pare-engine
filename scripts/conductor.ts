#!/usr/bin/env tsx
/**
 * The Conductor — Reactive Pipeline Orchestrator
 *
 * Scans pipeline state, spawns claude agents for each stage,
 * handles research fan-out, and watches for file changes.
 * Fully autonomous by default — no gates unless explicitly requested.
 *
 * Usage:
 *   pnpm conductor                      # Auto-detect state, run forward
 *   pnpm conductor start                # Trigger gap-analysis, run full cycle
 *   pnpm conductor watch                # Reactive: auto-run stages when files appear
 *   pnpm conductor status               # Show pipeline state, exit
 *   pnpm conductor --from=synthesize    # Start from specific stage
 *   pnpm conductor --understanding      # Understanding loop only (gap→synth)
 *   pnpm conductor --build              # Build loop only (decompose→confirm)
 *   pnpm conductor --dry-run            # Show plan without executing
 *   pnpm conductor --gate-all           # Gate after every stage
 *   pnpm conductor --no-gates           # Auto-approve everything (default)
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { watch as chokidarWatch } from 'chokidar';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { glob } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// ─── Constants ───────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PIPELINE_DIR = path.join(ROOT, 'pipeline');
const LOGS_DIR = path.join(PIPELINE_DIR, 'logs');
const STATE_FILE = path.join(LOGS_DIR, 'conductor-state.json');
const APPEND_LOG = path.join(LOGS_DIR, 'conductor.log');
const LOCK_FILE = path.join(LOGS_DIR, 'conductor.lock');
const ARCHIVE_DIR = path.join(PIPELINE_DIR, 'archive');
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const MAX_ARCHIVES = 2;
const AGENT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes per agent

// Pipeline stage directories that get archived between cycles
const STAGE_DIRS = [
  '1-gap-analysis', '1.5-dispatch', '2-research', '3-synthesis',
  '4-search-tools', '5-decompose', '5.5-prepare', '6-build', '7-confirm',
];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Detect pipeline date from existing artifacts, falling back to today */
async function detectPipelineDate(): Promise<string> {
  // Look for the most recent gap-analysis file to infer the active cycle date
  const gapFiles = await globFiles('pipeline/1-gap-analysis/gap-*.md');
  if (gapFiles.length > 0) {
    const latest = gapFiles.sort().pop()!;
    const match = path.basename(latest).match(/gap-(\d{4}-\d{2}-\d{2})\.md/);
    if (match) return match[1];
  }
  return today();
}

// ─── Cycle Safety ────────────────────────────────────────────────────────────

/** Archive previous cycle's pipeline artifacts before starting a new one */
function archivePreviousCycle(): void {
  // Detect what date the existing artifacts belong to
  const gapDir = path.join(PIPELINE_DIR, '1-gap-analysis');
  if (!fs.existsSync(gapDir)) return;

  const gapFiles = fs.readdirSync(gapDir).filter((f) => f.match(/^gap-\d{4}-\d{2}-\d{2}\.md$/));
  if (gapFiles.length === 0) return;

  const oldDate = gapFiles.sort().pop()!.match(/gap-(\d{4}-\d{2}-\d{2})\.md/)![1];
  const archiveTarget = path.join(ARCHIVE_DIR, oldDate);

  // Check if anything to archive
  const hasContent = STAGE_DIRS.some((dir) => {
    const full = path.join(PIPELINE_DIR, dir);
    return fs.existsSync(full) && fs.readdirSync(full).length > 0;
  });
  if (!hasContent) return;

  console.log(`  Archiving cycle ${oldDate} → pipeline/archive/${oldDate}/`);
  fs.mkdirSync(archiveTarget, { recursive: true });

  for (const dir of STAGE_DIRS) {
    const src = path.join(PIPELINE_DIR, dir);
    if (!fs.existsSync(src)) continue;
    const files = fs.readdirSync(src);
    if (files.length === 0) continue;

    const dest = path.join(archiveTarget, dir);
    fs.mkdirSync(dest, { recursive: true });
    for (const file of files) {
      fs.renameSync(path.join(src, file), path.join(dest, file));
    }
  }

  // Also archive the state file
  if (fs.existsSync(STATE_FILE)) {
    fs.renameSync(STATE_FILE, path.join(archiveTarget, 'conductor-state.json'));
  }

  // Prune old archives — keep only MAX_ARCHIVES most recent
  if (fs.existsSync(ARCHIVE_DIR)) {
    const archives = fs.readdirSync(ARCHIVE_DIR)
      .filter((d) => d.match(/^\d{4}-\d{2}-\d{2}$/))
      .sort();
    while (archives.length > MAX_ARCHIVES) {
      const old = archives.shift()!;
      fs.rmSync(path.join(ARCHIVE_DIR, old), { recursive: true, force: true });
      console.log(`  Pruned old archive: ${old}`);
    }
  }
}

/** Validate that output files exist AND are non-empty */
async function validateOutputs(stage: StageDefinition): Promise<{ valid: boolean; empty: string[] }> {
  const empty: string[] = [];
  for (const pattern of stage.outputGlobs) {
    const files = await globFiles(pattern);
    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        if (stat.isFile() && stat.size === 0) {
          empty.push(path.relative(ROOT, file));
        }
      } catch {
        // stat failed — treat as missing
      }
    }
  }
  return { valid: empty.length === 0, empty };
}

/** Append-only log — survives JSON state corruption */
function appendLog(message: string): void {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const line = `${new Date().toISOString()} ${message}\n`;
  fs.appendFileSync(APPEND_LOG, line);
}

/** Acquire a lock file to prevent concurrent conductor instances */
function acquireLock(): boolean {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  if (fs.existsSync(LOCK_FILE)) {
    try {
      const raw = fs.readFileSync(LOCK_FILE, 'utf-8').trim();
      const { pid } = JSON.parse(raw);
      // Check if the process is still alive
      try {
        process.kill(pid, 0); // signal 0 = just check existence
        return false; // Process still running — lock held
      } catch {
        // Process is dead — stale lock, take it over
        console.log(`  \x1b[90mRemoved stale lock (pid ${pid})\x1b[0m`);
      }
    } catch {
      // Corrupt lock file — take it over
    }
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
  return true;
}

function releaseLock(): void {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const raw = fs.readFileSync(LOCK_FILE, 'utf-8').trim();
      const { pid } = JSON.parse(raw);
      if (pid === process.pid) {
        fs.unlinkSync(LOCK_FILE);
      }
    }
  } catch {
    // Best effort
  }
}

// ─── Stage Registry ──────────────────────────────────────────────────────────

type AgentModel = 'claude-opus' | 'claude-sonnet' | 'gemini';

interface StageDefinition {
  id: string;
  name: string;
  order: number;
  skillName: string;
  model: AgentModel;
  inputGlobs: string[];
  outputGlobs: string[];
  parallel: 'none' | 'fan-out' | 'internal';
  tools: string;
  maxTurns: number;
  prompt: (date: string, inputs: string[]) => string;
}

const MODEL_LABELS: Record<AgentModel, string> = {
  'claude-opus': '\x1b[35mopus\x1b[0m',
  'claude-sonnet': '\x1b[34msonnet\x1b[0m',
  'gemini': '\x1b[33mgemini\x1b[0m',
};

const STAGES: StageDefinition[] = [
  {
    id: 'gap-analysis',
    name: 'gap-analysis',
    order: 1,
    skillName: 'gap-analysis',
    model: 'claude-opus',
    inputGlobs: [], // manual trigger
    outputGlobs: ['pipeline/1-gap-analysis/gap-*.md'],
    parallel: 'none',
    tools: 'Read,Write,Edit,Grep,Glob,Bash,WebSearch,WebFetch',
    maxTurns: 50,
    prompt: (date) =>
      `Run /gap-analysis for today (${date}). Orient in the domain first, then scan the codebase. Write output to pipeline/1-gap-analysis/gap-${date}.md`,
  },
  {
    id: 'dispatch',
    name: 'dispatch',
    order: 1.5,
    skillName: 'dispatch',
    model: 'claude-opus',
    inputGlobs: ['pipeline/1-gap-analysis/gap-*.md'],
    outputGlobs: ['pipeline/1.5-dispatch/dispatch-*.md'],
    parallel: 'none',
    tools: 'Read,Write,Edit,Grep,Glob',
    maxTurns: 30,
    prompt: (date) =>
      `Run /dispatch on pipeline/1-gap-analysis/gap-${date}.md — triage into parallel research threads. Write dispatch manifest to pipeline/1.5-dispatch/dispatch-${date}.md and thread briefs to pipeline/1.5-dispatch/thread-*-${date}.md`,
  },
  {
    id: 'research',
    name: 'research',
    order: 2,
    skillName: 'research',
    model: 'gemini',
    inputGlobs: ['pipeline/1.5-dispatch/thread-*-*.md'],
    outputGlobs: ['pipeline/2-research/thread-*-*.md'],
    parallel: 'fan-out',
    tools: 'Read,Write,Edit,Grep,Glob,WebSearch,WebFetch,Bash',
    maxTurns: 40,
    prompt: (_date, inputs) => {
      // Each fan-out agent gets a single thread brief
      const brief = inputs[0];
      return `Run /research on ${brief}. Follow the thread brief exactly — stay within its scope and anti-scope. Write findings to the output location specified in the brief, and update knowledge/ with durable findings.`;
    },
  },
  {
    id: 'synthesize',
    name: 'synthesize',
    order: 3,
    skillName: 'synthesize',
    model: 'claude-opus',
    inputGlobs: ['pipeline/2-research/thread-*-*.md'],
    outputGlobs: ['pipeline/3-synthesis/strategy-*.md'],
    parallel: 'none',
    tools: 'Read,Write,Edit,Grep,Glob,Bash',
    maxTurns: 50,
    prompt: (date) =>
      `Run /synthesize. Read ALL research outputs from pipeline/2-research/ and search-tools output from pipeline/4-search-tools/ (if it exists). Update domain model in knowledge/, then create build strategy at pipeline/3-synthesis/strategy-${date}.md`,
  },
  {
    id: 'decompose',
    name: 'decompose',
    order: 5,
    skillName: 'decompose',
    model: 'claude-opus',
    inputGlobs: ['pipeline/3-synthesis/strategy-*.md'],
    outputGlobs: ['specs/**/*.md', 'pipeline/5-decompose/manifest-*.md'],
    parallel: 'none',
    tools: 'Read,Write,Grep,Glob,Bash',
    maxTurns: 50,
    prompt: (date) =>
      `Run /decompose on pipeline/3-synthesis/strategy-${date}.md. Break strategy into atomic specs with strict file ownership. Write specs to specs/ and manifest to pipeline/5-decompose/manifest-${date}.md`,
  },
  {
    id: 'prepare',
    name: 'prepare',
    order: 5.5,
    skillName: 'prepare',
    model: 'gemini',
    inputGlobs: ['pipeline/5-decompose/manifest-*.md'],
    outputGlobs: ['pipeline/5.5-prepare/*.md'],
    parallel: 'none',
    tools: 'Read,Write,Grep,Glob,Bash',
    maxTurns: 40,
    prompt: () =>
      `Run /prepare. Read the most recent manifest from pipeline/5-decompose/ and prepare build briefs for all specs. Write output to pipeline/5.5-prepare/`,
  },
  {
    id: 'build',
    name: 'build',
    order: 6,
    skillName: 'build',
    model: 'gemini',
    inputGlobs: ['pipeline/5.5-prepare/*.md'],
    outputGlobs: ['pipeline/6-build/build-log-*.md'],
    parallel: 'internal',
    tools: 'Read,Write,Edit,Grep,Glob,Bash',
    maxTurns: 100,
    prompt: (date) =>
      `Run /build --all. Implement all ready specs. Write build log to pipeline/6-build/build-log-${date}.md`,
  },
  {
    id: 'confirm',
    name: 'confirm',
    order: 7,
    skillName: 'confirm',
    model: 'claude-sonnet',
    inputGlobs: ['pipeline/6-build/build-log-*.md'],
    outputGlobs: ['pipeline/7-confirm/confirm-*.md'],
    parallel: 'none',
    tools: 'Read,Write,Grep,Glob,Bash',
    maxTurns: 40,
    prompt: (date) =>
      `Run /confirm. Verify all specs from the most recent build log in pipeline/6-build/. Write confirmation report to pipeline/7-confirm/confirm-${date}.md`,
  },
];

// search-tools runs in parallel with research, not as a sequential stage
const SEARCH_TOOLS_STAGE: StageDefinition = {
  id: 'search-tools',
  name: 'search-tools',
  order: 2,
  skillName: 'search-tools',
  model: 'gemini',
  inputGlobs: ['pipeline/1.5-dispatch/dispatch-*.md'],
  outputGlobs: ['pipeline/4-search-tools/*.md'],
  parallel: 'none',
  tools: 'Read,Write,Edit,Grep,Glob,WebSearch,WebFetch,Bash',
  maxTurns: 40,
  prompt: (date) =>
    `Run /search-tools on pipeline/1.5-dispatch/dispatch-${date}.md. Evaluate tools needed for the build strategy. Write output to pipeline/4-search-tools/`,
};

// ─── State Management ────────────────────────────────────────────────────────

interface StageRun {
  stage: string;
  status: 'running' | 'done' | 'failed' | 'skipped';
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
}

interface ConductorState {
  date: string;
  startedAt: string;
  stages: Record<string, StageRun>;
}

function loadState(): ConductorState | null {
  if (!fs.existsSync(STATE_FILE)) return null;
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(raw) as ConductorState;
  } catch {
    return null;
  }
}

function saveState(state: ConductorState): void {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function initState(date: string): ConductorState {
  return {
    date,
    startedAt: new Date().toISOString(),
    stages: {},
  };
}

// ─── Pipeline Scanner ────────────────────────────────────────────────────────

async function globFiles(pattern: string): Promise<string[]> {
  const results: string[] = [];
  const fullPattern = path.join(ROOT, pattern).replace(/\\/g, '/');
  for await (const entry of glob(fullPattern)) {
    results.push(entry);
  }
  return results;
}

async function stageHasOutput(stage: StageDefinition): Promise<boolean> {
  for (const pattern of stage.outputGlobs) {
    const files = await globFiles(pattern);
    if (files.length > 0) return true;
  }
  return false;
}

async function stageHasInputs(stage: StageDefinition): Promise<boolean> {
  if (stage.inputGlobs.length === 0) return false; // manual trigger
  for (const pattern of stage.inputGlobs) {
    const files = await globFiles(pattern);
    if (files.length === 0) return false;
  }
  return true;
}

async function getThreadBriefs(date: string): Promise<string[]> {
  const pattern = `pipeline/1.5-dispatch/thread-*-${date}.md`;
  return globFiles(pattern);
}

async function getResearchOutputs(date: string): Promise<string[]> {
  const pattern = `pipeline/2-research/thread-*-${date}.md`;
  return globFiles(pattern);
}

type StageStatus = 'done' | 'ready' | 'blocked' | 'running';

interface PipelineStatus {
  stages: Array<{ id: string; name: string; status: StageStatus; detail?: string }>;
}

async function scanPipeline(state: ConductorState): Promise<PipelineStatus> {
  const date = state.date;
  const result: PipelineStatus = { stages: [] };

  for (const stage of STAGES) {
    const stateEntry = state.stages[stage.id];

    if (stateEntry?.status === 'running') {
      // Check if output appeared while we weren't watching (crash recovery)
      const hasOutput = await stageHasOutput(stage);
      if (hasOutput) {
        state.stages[stage.id] = { ...stateEntry, status: 'done', finishedAt: 'recovered' };
        result.stages.push({ id: stage.id, name: stage.name, status: 'done', detail: 'recovered' });
      } else {
        // Stale running state from a crash — reset to allow re-run
        state.stages[stage.id] = { ...stateEntry, status: 'failed', error: 'stale running state (crash recovery)' };
        result.stages.push({ id: stage.id, name: stage.name, status: 'ready' });
      }
      continue;
    }

    if (stateEntry?.status === 'done') {
      result.stages.push({ id: stage.id, name: stage.name, status: 'done', detail: stateEntry.durationMs ? formatMs(stateEntry.durationMs) : undefined });
      continue;
    }

    const hasOutput = await stageHasOutput(stage);
    if (hasOutput) {
      // Output exists from a previous run or manual execution
      if (!stateEntry) {
        state.stages[stage.id] = { stage: stage.id, status: 'done', startedAt: 'unknown' };
      }
      let detail: string | undefined;
      if (stage.id === 'dispatch') {
        const briefs = await getThreadBriefs(date);
        detail = `${briefs.length} threads`;
      } else if (stage.id === 'research') {
        const briefs = await getThreadBriefs(date);
        const outputs = await getResearchOutputs(date);
        detail = `${outputs.length}/${briefs.length} threads`;
      }
      result.stages.push({ id: stage.id, name: stage.name, status: 'done', detail });
      continue;
    }

    // Check if inputs are ready
    if (stage.inputGlobs.length === 0) {
      // Manual trigger (gap-analysis) — only ready if explicitly starting
      result.stages.push({ id: stage.id, name: stage.name, status: 'blocked' });
      continue;
    }

    // Completion validation: fan-out stages must have ALL outputs before downstream is ready
    if (stage.id === 'synthesize') {
      const briefs = await getThreadBriefs(date);
      const outputs = await getResearchOutputs(date);
      if (briefs.length > 0 && outputs.length < briefs.length) {
        result.stages.push({
          id: stage.id, name: stage.name, status: 'blocked',
          detail: `waiting for research ${outputs.length}/${briefs.length}`,
        });
        continue;
      }
    }

    const hasInputs = await stageHasInputs(stage);
    if (hasInputs) {
      result.stages.push({ id: stage.id, name: stage.name, status: 'ready' });
    } else {
      result.stages.push({ id: stage.id, name: stage.name, status: 'blocked' });
    }
  }

  return result;
}

// ─── Agent Spawning ──────────────────────────────────────────────────────────

interface AgentResult {
  stage: string;
  label: string;
  exitCode: number | null;
  durationMs: number;
  error?: string;
}

function buildClaudeArgs(stage: StageDefinition, prompt: string): { cmd: string; args: string[] } {
  const skillFile = path.join(SKILLS_DIR, stage.skillName, 'SKILL.md');
  const model = stage.model === 'claude-opus' ? 'opus' : 'sonnet';
  return {
    cmd: 'claude',
    args: [
      '-p', prompt,
      '--append-system-prompt', fs.readFileSync(skillFile, 'utf-8'),
      '--allowedTools', stage.tools,
      '--output-format', 'text',
      '--model', model,
      '--max-turns', String(stage.maxTurns),
    ],
  };
}

function buildGeminiArgs(stage: StageDefinition, prompt: string): { cmd: string; args: string[] } {
  // Gemini CLI has no --append-system-prompt, so prepend skill instructions to the prompt
  const skillFile = path.join(SKILLS_DIR, stage.skillName, 'SKILL.md');
  const skillContent = fs.readFileSync(skillFile, 'utf-8');
  const fullPrompt = `You are executing a pipeline stage. Follow these skill instructions:\n\n${skillContent}\n\n---\n\nTASK:\n${prompt}`;
  return {
    cmd: 'gemini',
    args: [
      '-p', fullPrompt,
      '--yolo',
      '-o', 'text',
    ],
  };
}

function spawnAgent(
  stage: StageDefinition,
  prompt: string,
  label: string,
): { process: ChildProcess; promise: Promise<AgentResult> } {
  const { cmd, args } = stage.model === 'gemini'
    ? buildGeminiArgs(stage, prompt)
    : buildClaudeArgs(stage, prompt);

  const child = spawn(cmd, args, {
    cwd: ROOT,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  const startTime = Date.now();

  const promise = new Promise<AgentResult>((resolve) => {
    let stderr = '';
    let resolved = false;

    const finish = (exitCode: number | null, error?: string) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve({
        stage: stage.id,
        label,
        exitCode,
        durationMs: Date.now() - startTime,
        error,
      });
    };

    // Timeout: kill the agent if it runs too long
    const timer = setTimeout(() => {
      if (!resolved) {
        child.kill();
        finish(-1, `Timed out after ${AGENT_TIMEOUT_MS / 60000}m`);
      }
    }, AGENT_TIMEOUT_MS);

    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      finish(code, code !== 0 ? stderr.slice(-500) : undefined);
    });

    child.on('error', (err) => {
      finish(-1, err.message);
    });
  });

  return { process: child, promise };
}

// ─── Display ─────────────────────────────────────────────────────────────────

const STATUS_ICONS: Record<StageStatus | 'failed', string> = {
  done: '\x1b[32m✓\x1b[0m',
  ready: '\x1b[33m▸\x1b[0m',
  blocked: '\x1b[90m·\x1b[0m',
  running: '\x1b[36m⟳\x1b[0m',
  failed: '\x1b[31m✗\x1b[0m',
};

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}m ${String(remaining).padStart(2, '0')}s`;
}

function printHeader(): void {
  const date = today();
  console.log(`\n\x1b[1mCONDUCTOR\x1b[0m — ${date}`);
  console.log('─'.repeat(40));
}

function printPipelineStatus(status: PipelineStatus): void {
  console.log('\n  Pipeline State:\n');
  for (const s of status.stages) {
    const icon = STATUS_ICONS[s.status];
    const detail = s.detail ? ` (${s.detail})` : '';
    const stageDef = STAGES.find((st) => st.id === s.id);
    const modelTag = stageDef ? ` ${MODEL_LABELS[stageDef.model]}` : '';
    console.log(`  ${icon} ${s.name.padEnd(16)} ${s.status}${detail}${modelTag}`);
  }
  console.log();
}

function printAgentStart(stageName: string, labels: string[], model: AgentModel): void {
  const modelTag = MODEL_LABELS[model];
  console.log(`  \x1b[33m▸\x1b[0m ${stageName} — spawning ${labels.length === 1 ? 'agent' : `${labels.length} agents`} [${modelTag}]`);
  for (const label of labels) {
    console.log(`    ${label.padEnd(30)} ${STATUS_ICONS.running} running`);
  }
}

function printAgentDone(result: AgentResult): void {
  const icon = result.exitCode === 0 ? STATUS_ICONS.done : STATUS_ICONS.failed;
  const status = result.exitCode === 0 ? formatMs(result.durationMs) : `FAILED`;
  console.log(`    ${result.label.padEnd(30)} ${icon} ${status}`);
  if (result.error) {
    console.log(`      \x1b[31m${result.error.split('\n')[0]}\x1b[0m`);
  }
}

// ─── Gate Handler ────────────────────────────────────────────────────────────

async function promptGate(stageName: string, message: string): Promise<'approve' | 'stop' | 'review'> {
  console.log(`\n  ${'─'.repeat(38)}`);
  console.log(`  \x1b[1mGATE:\x1b[0m ${message}`);
  console.log(`  [a] approve  [s] stop  [r] review`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('  > ', (answer) => {
      rl.close();
      const a = answer.trim().toLowerCase();
      if (a === 's' || a === 'stop') resolve('stop');
      else if (a === 'r' || a === 'review') resolve('review');
      else resolve('approve');
    });
  });
}

// ─── Stage Execution ─────────────────────────────────────────────────────────

async function runStage(
  stage: StageDefinition,
  state: ConductorState,
  opts: ConductorOpts,
): Promise<boolean> {
  const date = state.date;

  // Record start
  state.stages[stage.id] = {
    stage: stage.id,
    status: 'running',
    startedAt: new Date().toISOString(),
  };
  saveState(state);

  const startTime = Date.now();

  if (stage.parallel === 'fan-out' && stage.id === 'research') {
    return runResearchFanOut(stage, state, opts);
  }

  // Single agent execution
  const prompt = stage.prompt(date, []);
  printAgentStart(stage.name, [stage.name], stage.model);

  if (opts.dryRun) {
    const cli = stage.model === 'gemini' ? 'gemini' : 'claude';
    console.log(`    \x1b[90m[dry-run] would execute: ${cli} -p "${prompt.slice(0, 80)}..."\x1b[0m`);
    state.stages[stage.id] = { ...state.stages[stage.id]!, status: 'skipped', finishedAt: new Date().toISOString() };
    saveState(state);
    return true;
  }

  const { promise } = spawnAgent(stage, prompt, stage.name);
  const result = await promise;
  printAgentDone(result);

  const elapsed = Date.now() - startTime;
  let status: 'done' | 'failed' = result.exitCode === 0 ? 'done' : 'failed';
  let error = result.error;

  // Validate outputs are non-empty on success
  if (status === 'done') {
    const validation = await validateOutputs(stage);
    if (!validation.valid) {
      status = 'failed';
      error = `Empty output files: ${validation.empty.join(', ')}`;
      console.log(`    \x1b[31m✗ Output validation failed: ${validation.empty.length} empty file(s)\x1b[0m`);
      for (const f of validation.empty) {
        console.log(`      \x1b[90m${f}\x1b[0m`);
      }
    }
  }

  state.stages[stage.id] = {
    stage: stage.id,
    status,
    startedAt: state.stages[stage.id]!.startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: elapsed,
    error,
  };
  saveState(state);
  appendLog(`stage ${stage.id} ${status} ${formatMs(elapsed)}${error ? ` error=${error}` : ''}`);

  return status === 'done';
}

async function runResearchFanOut(
  stage: StageDefinition,
  state: ConductorState,
  opts: ConductorOpts,
): Promise<boolean> {
  const date = state.date;
  const threadBriefs = await getThreadBriefs(date);
  const existingOutputs = await getResearchOutputs(date);

  // Figure out which threads still need research
  const existingNames = new Set(
    existingOutputs.map((f) => path.basename(f)),
  );
  const pendingBriefs = threadBriefs.filter(
    (f) => !existingNames.has(path.basename(f)),
  );

  // Check if search-tools needs to run
  const searchToolsOutput = await globFiles('pipeline/4-search-tools/*.md');
  const needSearchTools = searchToolsOutput.length === 0;

  const labels = [
    ...pendingBriefs.map((f) => {
      const name = path.basename(f, `.md`).replace(`-${date}`, '');
      return name;
    }),
    ...(needSearchTools ? ['search-tools'] : []),
  ];

  if (labels.length === 0) {
    console.log(`  \x1b[32m✓\x1b[0m research — all threads already complete`);
    state.stages[stage.id] = {
      stage: stage.id,
      status: 'done',
      startedAt: state.stages[stage.id]!.startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: 0,
    };
    saveState(state);
    return true;
  }

  printAgentStart('research', labels, stage.model);

  if (opts.dryRun) {
    for (const label of labels) {
      console.log(`    \x1b[90m[dry-run] would spawn agent for: ${label}\x1b[0m`);
    }
    state.stages[stage.id] = { ...state.stages[stage.id]!, status: 'skipped', finishedAt: new Date().toISOString() };
    saveState(state);
    return true;
  }

  // Spawn all agents in parallel
  const agentPromises: Promise<AgentResult>[] = [];

  for (const brief of pendingBriefs) {
    const relativeBrief = path.relative(ROOT, brief).replace(/\\/g, '/');
    const prompt = stage.prompt(date, [relativeBrief]);
    const label = path.basename(brief, '.md').replace(`-${date}`, '');
    const { promise } = spawnAgent(stage, prompt, label);
    agentPromises.push(promise);
  }

  if (needSearchTools) {
    const stPrompt = SEARCH_TOOLS_STAGE.prompt(date, []);
    const { promise } = spawnAgent(SEARCH_TOOLS_STAGE, stPrompt, 'search-tools');
    agentPromises.push(promise);
  }

  // Wait for all agents, report as they finish
  const results = await Promise.allSettled(agentPromises);
  console.log(); // blank line before results

  let allSuccess = true;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      printAgentDone(r.value);
      if (r.value.exitCode !== 0) allSuccess = false;
    } else {
      console.log(`    \x1b[31m✗ Agent rejected: ${r.reason}\x1b[0m`);
      allSuccess = false;
    }
  }

  // Validate research outputs are non-empty
  if (allSuccess) {
    const newOutputs = await getResearchOutputs(date);
    const emptyOutputs = newOutputs.filter((f) => {
      try { return fs.statSync(f).size === 0; } catch { return true; }
    });
    if (emptyOutputs.length > 0) {
      allSuccess = false;
      console.log(`    \x1b[31m✗ ${emptyOutputs.length} research output(s) are empty\x1b[0m`);
      for (const f of emptyOutputs) {
        console.log(`      \x1b[90m${path.relative(ROOT, f)}\x1b[0m`);
      }
    }
  }

  const elapsed = Date.now() - new Date(state.stages[stage.id]!.startedAt).getTime();
  const fanOutStatus = allSuccess ? 'done' : 'failed';
  state.stages[stage.id] = {
    stage: stage.id,
    status: fanOutStatus,
    startedAt: state.stages[stage.id]!.startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: elapsed,
    error: allSuccess ? undefined : 'Some research threads failed or produced empty output',
  };
  saveState(state);
  appendLog(`stage research ${fanOutStatus} ${formatMs(elapsed)} threads=${labels.length}`);

  return allSuccess;
}

// ─── Main Loop ───────────────────────────────────────────────────────────────

interface ConductorOpts {
  command: 'run' | 'start' | 'watch' | 'status';
  from?: string;
  understanding: boolean;
  build: boolean;
  dryRun: boolean;
  gateAll: boolean;
}

function parseArgs(argv: string[]): ConductorOpts {
  const args = argv.slice(2);
  const opts: ConductorOpts = {
    command: 'run',
    understanding: false,
    build: false,
    dryRun: false,
    gateAll: false,
  };

  for (const arg of args) {
    if (arg === 'start') opts.command = 'start';
    else if (arg === 'watch') opts.command = 'watch';
    else if (arg === 'status') opts.command = 'status';
    else if (arg.startsWith('--from=')) opts.from = arg.split('=')[1];
    else if (arg === '--understanding') opts.understanding = true;
    else if (arg === '--build') opts.build = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--gate-all') opts.gateAll = true;
    else if (arg === '--no-gates') opts.gateAll = false;
  }

  return opts;
}

function getStageRange(opts: ConductorOpts): StageDefinition[] {
  let stages = [...STAGES];

  if (opts.understanding) {
    stages = stages.filter((s) => s.order <= 3);
  } else if (opts.build) {
    stages = stages.filter((s) => s.order >= 5);
  }

  if (opts.from) {
    const fromIdx = stages.findIndex((s) => s.id === opts.from);
    if (fromIdx >= 0) {
      stages = stages.slice(fromIdx);
    } else {
      console.error(`\x1b[31mUnknown stage: ${opts.from}\x1b[0m`);
      console.error(`Available: ${STAGES.map((s) => s.id).join(', ')}`);
      process.exit(1);
    }
  }

  return stages;
}

async function runPipeline(opts: ConductorOpts): Promise<void> {
  const isStart = opts.command === 'start';

  // On 'start', archive previous cycle before doing anything
  if (isStart) {
    const existingDate = await detectPipelineDate();
    if (existingDate !== today()) {
      archivePreviousCycle();
    } else {
      // Same day — check if there's existing content that should be archived
      const existingState = loadState();
      if (existingState?.stages?.confirm?.status === 'done') {
        // Previous cycle completed today — archive it
        archivePreviousCycle();
      }
    }
  }

  const date = isStart ? today() : await detectPipelineDate();
  const loaded = loadState();
  const state = loaded?.date === date ? loaded : initState(date);
  const stages = getStageRange(opts);

  appendLog(`pipeline ${opts.command} date=${date} stages=${stages.map((s) => s.id).join(',')}`);

  let completedAll = true;

  for (const stage of stages) {
    // Check if already done
    const stateEntry = state.stages[stage.id];
    if (stateEntry?.status === 'done') {
      continue;
    }

    // Check if output already exists
    const hasOutput = await stageHasOutput(stage);
    if (hasOutput) {
      state.stages[stage.id] = { stage: stage.id, status: 'done', startedAt: 'pre-existing' };
      saveState(state);
      continue;
    }

    // For gap-analysis, only run if 'start' command
    if (stage.id === 'gap-analysis' && !isStart) {
      const hasInputs = await stageHasInputs(stage);
      if (!hasInputs && stage.inputGlobs.length === 0) {
        // Manual trigger stage without 'start' — skip
        continue;
      }
    }

    // Completion validation for fan-out → downstream transitions
    if (stage.id === 'synthesize') {
      const briefs = await getThreadBriefs(state.date);
      const outputs = await getResearchOutputs(state.date);
      if (briefs.length > 0 && outputs.length < briefs.length) {
        console.log(`  \x1b[90m·\x1b[0m ${stage.name.padEnd(16)} blocked (research ${outputs.length}/${briefs.length})`);
        completedAll = false;
        break;
      }
    }

    // Check inputs ready
    if (stage.inputGlobs.length > 0) {
      const hasInputs = await stageHasInputs(stage);
      if (!hasInputs) {
        console.log(`  \x1b[90m·\x1b[0m ${stage.name.padEnd(16)} blocked (missing inputs)`);
        completedAll = false;
        break; // Can't proceed further in the pipeline
      }
    }

    // Gate check (if --gate-all)
    if (opts.gateAll) {
      const gateResult = await promptGate(stage.name, `Run ${stage.name}?`);
      if (gateResult === 'stop') {
        console.log('\n  Conductor stopped by operator.');
        return;
      }
    }

    console.log();
    const success = await runStage(stage, state, opts);
    if (!success) {
      console.log(`\n  \x1b[31m✗ ${stage.name} failed. Pipeline halted.\x1b[0m`);
      return;
    }
  }

  // Print summary
  const pipelineStatus = await scanPipeline(state);
  console.log('\n' + '─'.repeat(40));
  console.log(completedAll ? '\x1b[1mCycle complete.\x1b[0m\n' : '\x1b[1mPipeline paused.\x1b[0m Blocked stages remain.\n');
  printPipelineStatus(pipelineStatus);

  // Total time
  const totalMs = Date.now() - new Date(state.startedAt).getTime();
  console.log(`  Total: ${formatMs(totalMs)}`);
  console.log();
}

async function watchMode(opts: ConductorOpts): Promise<void> {
  console.log('  \x1b[36mWatching pipeline/ for changes...\x1b[0m');
  console.log('  Press Ctrl+C to stop.\n');

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let running = false;

  const watcher = chokidarWatch(PIPELINE_DIR, {
    ignoreInitial: true,
    depth: 2,
    ignored: [
      '**/logs/**',
      '**/archive/**',
    ],
  });

  watcher.on('add', (filePath: string) => {
    console.log(`  \x1b[90mDetected: ${path.relative(ROOT, filePath)}\x1b[0m`);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      if (running) return;
      running = true;

      const watchDate = await detectPipelineDate();
      const watchLoaded = loadState();
      const state = watchLoaded?.date === watchDate ? watchLoaded : initState(watchDate);
      const status = await scanPipeline(state);
      printPipelineStatus(status);

      // Find first ready stage and run it
      const readyStage = status.stages.find((s) => s.status === 'ready');
      if (readyStage) {
        const stageDef = STAGES.find((s) => s.id === readyStage.id);
        if (stageDef) {
          console.log();
          await runStage(stageDef, state, opts);
        }
      }

      running = false;
    }, 500);
  });

  // Keep alive
  await new Promise(() => {});
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);

  printHeader();

  // Status is read-only — no lock needed
  if (opts.command === 'status') {
    const statusLoaded = loadState();
    const statusDate = await detectPipelineDate();
    const statusState = statusLoaded?.date === statusDate ? statusLoaded : initState(statusDate);
    const status = await scanPipeline(statusState);
    printPipelineStatus(status);
    return;
  }

  // Acquire lock for any mode that runs stages
  if (!acquireLock()) {
    console.error('\n  \x1b[31m✗ Another conductor instance is running.\x1b[0m');
    console.error('  If this is wrong, delete pipeline/logs/conductor.lock');
    process.exit(1);
  }

  // Release lock on exit (normal, error, or signal)
  process.on('exit', releaseLock);
  process.on('SIGINT', () => { releaseLock(); process.exit(130); });
  process.on('SIGTERM', () => { releaseLock(); process.exit(143); });

  const mainLoaded = loadState();
  const mainDate = await detectPipelineDate();
  const state = mainLoaded?.date === mainDate ? mainLoaded : initState(mainDate);
  const status = await scanPipeline(state);
  printPipelineStatus(status);

  if (opts.command === 'watch') {
    await watchMode(opts);
    return;
  }

  await runPipeline(opts);
}

main().catch((err) => {
  releaseLock();
  console.error('\x1b[31mConductor error:\x1b[0m', err);
  process.exit(1);
});
