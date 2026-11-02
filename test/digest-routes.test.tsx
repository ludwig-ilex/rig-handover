import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import type { DigestRow, Night } from '../src/digest/types.js';

const line = (at: string, job: string, status: string, owner: string | null, error?: string) =>
  JSON.stringify({ at, job, status, owner, ...(error === undefined ? {} : { error }) });

const runsDir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
const write = (night: string, text: string) => writeFileSync(join(runsDir, `${night}.jsonl`), text);

write(
  '2026-01-01',
  [
    line('2026-01-01T01:00:00+01:00', 'zeta', 'ok', 'ana'),
    line('2026-01-01T01:05:00+01:00', 'alpha', 'fail', null, 'boom'),
    line('2026-01-01T01:10:00+01:00', 'zeta', 'ok', 'ana'),
  ].join('\n') + '\n',
);
write('2026-01-02', '');
write('2026-01-03', [line('2026-01-03T01:00:00+01:00', 'alpha', 'ok', 'ana'), 'not json'].join('\n') + '\n');

const app = createApp({
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
  runsDir,
});

const page = (night: string) => app.request(`/digest/${night}`);
const api = (night: string) => app.request(`/api/digest/${night}`);
const jobs = (rows: DigestRow[]) => rows.map((r) => r.job);

describe('GET /digest/:night', () => {
  it('200 for a night with lines', async () => {
    const res = await page('2026-01-01');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('digest 2026-01-01');
    expect(html).toContain('last status');
  });

  it('404 for a night with no file', async () => {
    const res = await page('2026-01-09');
    expect(res.status).toBe(404);
    expect(await res.text()).toContain('no runs for 2026-01-09');
  });

  it('empty night says nothing ran and has no table', async () => {
    const res = await page('2026-01-02');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('nothing ran');
    expect(html).not.toContain('<table');
  });

  it('bad line shows the count and keeps the other rows', async () => {
    const html = await (await page('2026-01-03')).text();
    expect(html).toContain('bad lines: 1');
    expect(html).toContain('alpha');
  });

  it('owner null renders —', async () => {
    const html = await (await page('2026-01-01')).text();
    const row = html.split('<tr').find((r) => r.includes('alpha')) ?? '';
    expect(row).toContain('boom');
    expect(row).toContain('—');
  });
});

describe('GET /api/digest/:night', () => {
  it('200 for a night with lines', async () => {
    const res = await api('2026-01-01');
    const body = (await res.json()) as Night;
    expect(res.status).toBe(200);
    expect(body.night).toBe('2026-01-01');
    expect(body.badLines).toBe(0);
    expect(jobs(body.rows)).toEqual(['alpha', 'zeta']);
    expect(body.rows[0]?.owner).toBeNull();
  });

  it('404 for a night with no file', async () => {
    const res = await api('2026-01-09');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'no runs', night: '2026-01-09' });
  });

  it('empty night gives rows []', async () => {
    const res = await api('2026-01-02');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ night: '2026-01-02', rows: [], badLines: 0 });
  });

  it('bad line gives badLines 1 and keeps the other rows', async () => {
    const body = (await (await api('2026-01-03')).json()) as Night;
    expect(body.badLines).toBe(1);
    expect(jobs(body.rows)).toEqual(['alpha']);
  });
});

describe('page and JSON agree', () => {
  it('list the same jobs in the same order', async () => {
    const body = (await (await api('2026-01-01')).json()) as Night;
    const html = await (await page('2026-01-01')).text();
    const positions = jobs(body.rows).map((j) => html.indexOf(`>${j}<`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
