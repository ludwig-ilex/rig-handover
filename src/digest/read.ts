import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, Night, ReadNight, RunLine, RunStatus } from './types.js';

const STATUSES: readonly RunStatus[] = ['ok', 'retry', 'fail'];

// Parse at the edge: anything that is not a well-formed run line is null.
export function parseLine(line: string): RunLine | null {
  try {
    const v: unknown = JSON.parse(line);
    if (typeof v !== 'object' || v === null) return null;
    const o = v as Record<string, unknown>;
    if (typeof o.at !== 'string' || typeof o.job !== 'string') return null;
    if (!STATUSES.includes(o.status as RunStatus)) return null;
    if (o.owner !== null && typeof o.owner !== 'string') return null;
    if (o.error !== undefined && typeof o.error !== 'string') return null;
    return { at: o.at, job: o.job, status: o.status as RunStatus, owner: o.owner, error: o.error };
  } catch {
    return null;
  }
}

const startRow = (l: RunLine): DigestRow => ({
  job: l.job,
  owner: l.owner,
  runs: 0,
  retries: 0,
  lastStatus: l.status,
  lastError: null,
  firstAt: l.at,
  lastAt: l.at,
});

// Lines are in log order, so the last line seen for a job is its last run.
const addLine = (r: DigestRow, l: RunLine): DigestRow => ({
  ...r,
  owner: r.owner ?? l.owner,
  runs: r.runs + 1,
  retries: r.retries + (l.status === 'retry' ? 1 : 0),
  lastStatus: l.status,
  lastError: l.error ?? null,
  lastAt: l.at,
});

export function digest(night: string, text: string): Night {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  const parsed = lines.map(parseLine);
  const rows = parsed
    .filter((l): l is RunLine => l !== null)
    .reduce((m, l) => m.set(l.job, addLine(m.get(l.job) ?? startRow(l), l)), new Map<string, DigestRow>());
  return {
    night,
    rows: [...rows.values()].sort((a, b) => a.job.localeCompare(b.job)),
    badLines: parsed.filter((l) => l === null).length,
  };
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return null;
  const file = join(runsDir, `${night}.jsonl`);
  return existsSync(file) ? digest(night, readFileSync(file, 'utf8')) : null;
};
