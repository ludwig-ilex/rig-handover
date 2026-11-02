import { readdirSync } from 'node:fs';
import type { RigConfig } from './config.js';
import { lastBeat, type Beat } from './heartbeat.js';
import { readNight } from './digest/read.js';

export type Status = {
  adapter: string;
  installed: string;
  lastBeat: Beat | null;
  nights: NightCounts[];
};

export type NightCounts = { night: string; ok: number; retry: number; fail: number };

// Nights on disk = runs/<YYYY-MM-DD>.jsonl, newest first.
export function nightsOnDisk(runsDir: string): string[] {
  try {
    return readdirSync(runsDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
      .map((f) => f.slice(0, 10))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

// ok = runs that were neither retries nor fails, summed over jobs.
export function nightCounts(runsDir: string, night: string): NightCounts {
  const rows = readNight(runsDir, night)?.rows ?? [];
  return {
    night,
    ok: rows.reduce((a, r) => a + r.runs - r.retries - r.fails, 0),
    retry: rows.reduce((a, r) => a + r.retries, 0),
    fail: rows.reduce((a, r) => a + r.fails, 0),
  };
}

export function readStatus(config: RigConfig): Status {
  return {
    adapter: config.adapter,
    installed: config.installed,
    lastBeat: lastBeat(),
    nights: nightsOnDisk(config.runsDir).map((n) => nightCounts(config.runsDir, n)),
  };
}
