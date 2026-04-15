/**
 * HealthMonitor - Port monitoring, health checks, and version checking
 *
 * Extracted from worker-service.ts monolith to provide centralized health monitoring.
 * Handles:
 * - Port availability checking
 * - Worker health/readiness polling
 * - Version mismatch detection (critical for plugin updates)
 * - HTTP-based shutdown requests
 */

import path from 'path';
import http from 'http';
import net from 'net';
import { readFileSync } from 'fs';
import { logger } from '../../utils/logger.js';
import { MARKETPLACE_ROOT } from '../../shared/paths.js';

/**
 * Make an HTTP request to the worker via TCP.
 * Returns { ok, statusCode, body } or throws on transport error.
 */
async function httpRequestToWorker(
  port: number,
  endpointPath: string,
  method: string = 'GET',
  timeoutMs: number = 2_000
): Promise<{ ok: boolean; statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = http.request({
      host: '127.0.0.1',
      port,
      path: endpointPath,
      method,
      agent: false,
      headers: {
        Connection: 'close'
      }
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => {
        body += chunk;
      });
      response.on('end', () => {
        resolve({
          ok: (response.statusCode ?? 500) >= 200 && (response.statusCode ?? 500) < 300,
          statusCode: response.statusCode ?? 500,
          body
        });
      });
    });

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });

    request.on('error', reject);
    request.end();
  });
}

/**
 * Check if a port is in use by attempting an atomic socket bind.
 * More reliable than HTTP health check for daemon spawn guards —
 * prevents TOCTOU race where two daemons both see "port free" via
 * HTTP and then both try to listen() (upstream bug workaround).
 *
 * Falls back to HTTP health check on Windows where socket bind
 * behavior differs.
 */
export async function isPortInUse(port: number): Promise<boolean> {
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let settled = false;

      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        resolve(result);
      };

      socket.setTimeout(750);
      socket.once('connect', () => finish(true));
      socket.once('timeout', () => finish(false));
      socket.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'ECONNREFUSED') {
          finish(false);
          return;
        }
        finish(false);
      });
      socket.connect(port, '127.0.0.1');
    });
  }

  // Unix: atomic socket bind check — no TOCTOU race
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close(() => resolve(false));
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Poll a worker endpoint until it returns 200 OK or timeout.
 * Shared implementation for liveness and readiness checks.
 */
async function pollEndpointUntilOk(
  port: number,
  endpointPath: string,
  timeoutMs: number,
  retryLogMessage: string
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await httpRequestToWorker(port, endpointPath);
      if (result.ok) return true;
    } catch (error) {
      // [ANTI-PATTERN IGNORED]: Retry loop - expected failures during startup, will retry
      logger.debug('SYSTEM', retryLogMessage, {}, error as Error);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

/**
 * Wait for the worker HTTP server to become responsive (liveness check).
 * Uses /api/health which returns 200 as soon as the HTTP server is listening.
 * For full initialization (DB + search), use waitForReadiness() instead.
 */
export function waitForHealth(port: number, timeoutMs: number = 30000): Promise<boolean> {
  return pollEndpointUntilOk(port, '/api/health', timeoutMs, 'Service not ready yet, will retry');
}

/**
 * Wait for the worker to be fully initialized (DB + search ready).
 * Uses /api/readiness which returns 200 only after core initialization completes.
 * Now that initializationCompleteFlag is set after DB/search init (not MCP),
 * this typically completes in a few seconds.
 */
export function waitForReadiness(port: number, timeoutMs: number = 30000): Promise<boolean> {
  return pollEndpointUntilOk(port, '/api/readiness', timeoutMs, 'Worker not ready yet, will retry');
}

/**
 * Wait for a port to become free (no longer responding to health checks)
 * Used after shutdown to confirm the port is available for restart
 */
export async function waitForPortFree(port: number, timeoutMs: number = 10000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (!(await isPortInUse(port))) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

/**
 * Send HTTP shutdown request to a running worker
 * @returns true if shutdown request was acknowledged, false otherwise
 */
export async function httpShutdown(port: number): Promise<boolean> {
  try {
    const result = await httpRequestToWorker(port, '/api/admin/shutdown', 'POST');
    if (!result.ok) {
      logger.warn('SYSTEM', 'Shutdown request returned error', { status: result.statusCode });
      return false;
    }
    return true;
  } catch (error) {
    // Connection refused is expected if worker already stopped
    if (error instanceof Error && error.message?.includes('ECONNREFUSED')) {
      logger.debug('SYSTEM', 'Worker already stopped', {}, error);
      return false;
    }
    // Unexpected error - log full details
    logger.error('SYSTEM', 'Shutdown request failed unexpectedly', {}, error as Error);
    return false;
  }
}

/**
 * Get the plugin version from the installed marketplace package.json
 * This is the "expected" version that should be running.
 * Returns 'unknown' on ENOENT/EBUSY (shutdown race condition, fix #1042).
 */
export function getInstalledPluginVersion(): string {
  try {
    const packageJsonPath = path.join(MARKETPLACE_ROOT, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EBUSY') {
      logger.debug('SYSTEM', 'Could not read plugin version (shutdown race)', { code });
      return 'unknown';
    }
    throw error;
  }
}

/**
 * Get the running worker's version via API
 * This is the "actual" version currently running.
 */
export async function getRunningWorkerVersion(port: number): Promise<string | null> {
  try {
    const result = await httpRequestToWorker(port, '/api/version');
    if (!result.ok) return null;
    const data = JSON.parse(result.body) as { version: string };
    return data.version;
  } catch {
    // Expected: worker not running or version endpoint unavailable
    logger.debug('SYSTEM', 'Could not fetch worker version', {});
    return null;
  }
}

export interface VersionCheckResult {
  matches: boolean;
  pluginVersion: string;
  workerVersion: string | null;
}

/**
 * Check if worker version matches plugin version
 * Critical for detecting when plugin is updated but worker is still running old code
 * Returns true if versions match or if we can't determine (assume match for graceful degradation)
 */
export async function checkVersionMatch(port: number): Promise<VersionCheckResult> {
  const pluginVersion = getInstalledPluginVersion();
  const workerVersion = await getRunningWorkerVersion(port);

  // If either version is unknown/null, assume match (graceful degradation, fix #1042)
  if (!workerVersion || pluginVersion === 'unknown') {
    return { matches: true, pluginVersion, workerVersion };
  }

  return { matches: pluginVersion === workerVersion, pluginVersion, workerVersion };
}
