import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { clearPortCache, getWorkerHost, getWorkerPort } from '../../src/shared/worker-utils.js';

describe('worker-utils', () => {
  let tempDir: string;
  let settingsPath: string;
  const originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;

  beforeEach(() => {
    tempDir = join(tmpdir(), `worker-utils-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tempDir, { recursive: true });
    settingsPath = join(tempDir, 'settings.json');
    process.env.CLAUDE_MEM_DATA_DIR = tempDir;
    clearPortCache();
  });

  afterEach(() => {
    clearPortCache();

    if (originalDataDir === undefined) {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    } else {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reloads worker port when settings file changes on disk', async () => {
    writeFileSync(settingsPath, JSON.stringify({
      CLAUDE_MEM_WORKER_PORT: '37777',
      CLAUDE_MEM_WORKER_HOST: '127.0.0.1'
    }), 'utf-8');

    expect(getWorkerPort()).toBe(37777);

    await new Promise(resolve => setTimeout(resolve, 20));

    writeFileSync(settingsPath, JSON.stringify({
      CLAUDE_MEM_WORKER_PORT: '37791',
      CLAUDE_MEM_WORKER_HOST: '127.0.0.1'
    }), 'utf-8');

    expect(getWorkerPort()).toBe(37791);
  });

  it('reloads worker host when settings file changes on disk', async () => {
    writeFileSync(settingsPath, JSON.stringify({
      CLAUDE_MEM_WORKER_PORT: '37777',
      CLAUDE_MEM_WORKER_HOST: '127.0.0.1'
    }), 'utf-8');

    expect(getWorkerHost()).toBe('127.0.0.1');

    await new Promise(resolve => setTimeout(resolve, 20));

    writeFileSync(settingsPath, JSON.stringify({
      CLAUDE_MEM_WORKER_PORT: '37777',
      CLAUDE_MEM_WORKER_HOST: '0.0.0.0'
    }), 'utf-8');

    expect(getWorkerHost()).toBe('0.0.0.0');
  });
});
