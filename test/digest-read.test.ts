import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read.js';

describe('readNight', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads 2026-10-28 into 5 jobs and counts 1 bad line', () => {
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(night?.badLines).toBe(1);
  });

  it('sums runs and retries and keeps the last status and error', () => {
    const refresh = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(refresh).toMatchObject({ runs: 4, retries: 3, fails: 0, lastStatus: 'ok', lastError: null });
    const backup = night?.rows.find((r) => r.job === 'notes/backup');
    expect(backup).toMatchObject({ runs: 1, fails: 1, lastStatus: 'fail', lastError: 'quota exceeded' });
  });

  it('keeps first and last time with their offset', () => {
    const sync = night?.rows.find((r) => r.job === 'lane/sync');
    expect(sync).toMatchObject({ firstAt: '2026-10-28T23:00:06+01:00', lastAt: '2026-10-29T05:00:04+01:00' });
  });

  it('keeps a row with a null owner', () => {
    expect(night?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('returns null for a night with no file, and no rows for an empty file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
    writeFileSync(join(dir, '2026-01-01.jsonl'), '');
    expect(readNight(dir, '2026-01-02')).toBeNull();
    expect(readNight(dir, '2026-01-01')).toEqual({ night: '2026-01-01', rows: [], badLines: 0 });
  });

  it('rejects a night that is not a date', () => {
    expect(readNight('runs', '../package')).toBeNull();
  });
});
