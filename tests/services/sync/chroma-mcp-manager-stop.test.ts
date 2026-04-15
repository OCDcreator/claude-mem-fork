import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';

const CHROMA_MCP_MANAGER_PATH = join(
  import.meta.dir, '..', '..', '..', 'src', 'services', 'sync', 'ChromaMcpManager.ts'
);

describe('ChromaMcpManager stop hardening', () => {
  it('forces subprocess termination if graceful close leaves chroma-mcp alive', () => {
    const source = readFileSync(CHROMA_MCP_MANAGER_PATH, 'utf-8');

    expect(source).toContain('getDescendantProcesses(chromaPid)');
    expect(source).toContain('forceKillProcess(pid)');
    expect(source).toContain('waitForProcessTreeExit(chromaProcessTree, SUBPROCESS_EXIT_WAIT_MS)');
    expect(source).toContain('waitForProcessTreeExit(chromaProcessTree, SUBPROCESS_FORCE_KILL_WAIT_MS)');
  });

  it('keeps supervisor cleanup until subprocess exit is confirmed', () => {
    const source = readFileSync(CHROMA_MCP_MANAGER_PATH, 'utf-8');

    expect(source).toContain('if (chromaExited) {');
    expect(source).toContain("getSupervisor().unregisterProcess(CHROMA_SUPERVISOR_ID)");
    expect(source).toContain('leaving supervisor entry for shutdown cascade');
  });
});
