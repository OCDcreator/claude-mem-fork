/**
 * GracefulShutdown - Cleanup utilities for graceful exit
 *
 * Extracted from worker-service.ts to provide centralized shutdown coordination.
 * Handles:
 * - HTTP server closure (with Windows-specific delays)
 * - Session manager shutdown coordination
 * - Child process cleanup (Windows zombie port fix)
 */

import http from 'http';
import { logger } from '../../utils/logger.js';
import { stopSupervisor } from '../../supervisor/index.js';

export interface ShutdownableService {
  shutdownAll(): Promise<void>;
}

export interface CloseableClient {
  close(): Promise<void>;
}

export interface CloseableDatabase {
  close(): Promise<void>;
}

/**
 * Stoppable service interface for ChromaMcpManager
 */
export interface StoppableService {
  stop(): Promise<void>;
}

/**
 * Configuration for graceful shutdown
 */
export interface GracefulShutdownConfig {
  server: http.Server | null;
  closeServer?: () => Promise<void>;
  sessionManager: ShutdownableService;
  mcpClient?: CloseableClient;
  dbManager?: CloseableDatabase;
  chromaMcpManager?: StoppableService;
}

/**
 * Perform graceful shutdown of all services
 *
 * IMPORTANT: On Windows, we must kill all child processes before exiting
 * to prevent zombie ports. The socket handle can be inherited by children,
 * and if not properly closed, the port stays bound after process death.
 */
export async function performGracefulShutdown(config: GracefulShutdownConfig): Promise<void> {
  logger.info('SYSTEM', 'Shutdown initiated');

  // STEP 1: Close HTTP server first
  if (config.closeServer) {
    await runShutdownStep('closeServer', () => config.closeServer!(), 10_000);
    logger.info('SYSTEM', 'HTTP server closed');
  } else if (config.server) {
    await runShutdownStep('closeHttpServer', () => closeHttpServer(config.server!), 10_000);
    logger.info('SYSTEM', 'HTTP server closed');
  }

  // STEP 2: Shutdown active sessions
  await runShutdownStep('sessionManager.shutdownAll', () => config.sessionManager.shutdownAll(), 15_000);

  // STEP 3: Close MCP client connection (signals child to exit gracefully)
  if (config.mcpClient) {
    await runShutdownStep('mcpClient.close', () => config.mcpClient!.close(), 10_000);
    logger.info('SYSTEM', 'MCP client closed');
  }

  // STEP 4: Stop Chroma MCP connection
  if (config.chromaMcpManager) {
    logger.info('SHUTDOWN', 'Stopping Chroma MCP connection...');
    await runShutdownStep('chromaMcpManager.stop', () => config.chromaMcpManager!.stop(), 20_000);
    logger.info('SHUTDOWN', 'Chroma MCP connection stopped');
  }

  // STEP 5: Close database connection (includes ChromaSync cleanup)
  if (config.dbManager) {
    await runShutdownStep('dbManager.close', () => config.dbManager!.close(), 10_000);
  }

  // STEP 6: Supervisor handles tracked child termination, PID cleanup, and stale sockets.
  await runShutdownStep('stopSupervisor', () => stopSupervisor(), 10_000);

  logger.info('SYSTEM', 'Worker shutdown complete');
}

/**
 * Close HTTP server with Windows-specific delays
 * Windows needs extra time to release sockets properly
 */
async function closeHttpServer(server: http.Server): Promise<void> {
  const closePromise = new Promise<void>((resolve, reject) => {
    server.close(err => err ? reject(err) : resolve());
  });

  if (typeof server.closeIdleConnections === 'function') {
    server.closeIdleConnections();
  }

  if (typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }

  // Give Windows time to close connections before closing server (prevents zombie ports)
  if (process.platform === 'win32') {
    await new Promise(r => setTimeout(r, 500));
  }

  // Close the server
  await closePromise;

  // Extra delay on Windows to ensure port is fully released
  if (process.platform === 'win32') {
    await new Promise(r => setTimeout(r, 500));
    logger.info('SYSTEM', 'Waited for Windows port cleanup');
  }
}

async function runShutdownStep(
  stepName: string,
  fn: () => Promise<void>,
  timeoutMs: number
): Promise<void> {
  const stepPromise = fn().catch((error) => {
    logger.warn('SHUTDOWN', `Shutdown step failed: ${stepName}`, {}, error as Error);
  });

  const result = await Promise.race([
    stepPromise.then(() => 'done' as const),
    new Promise<'timeout'>(resolve => {
      setTimeout(() => resolve('timeout'), timeoutMs);
    })
  ]);

  if (result === 'timeout') {
    logger.warn('SHUTDOWN', `Shutdown step timed out: ${stepName}`, { timeoutMs });
  }
}
