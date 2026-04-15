import { describe, it, expect, afterEach, mock, spyOn } from 'bun:test';
import http from 'http';
import net from 'net';
import {
  isPortInUse,
  waitForHealth,
  waitForPortFree,
  getInstalledPluginVersion,
  checkVersionMatch
} from '../../src/services/infrastructure/index.js';

describe('HealthMonitor', () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true,
      configurable: true
    });
  });

  async function startHttpServer(
    handler: http.RequestListener,
    port: number = 0
  ): Promise<{ server: http.Server; port: number }> {
    const server = http.createServer(handler);
    await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', () => resolve()));
    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('Expected TCP server address');
    }
    return { server, port: address.port };
  }

  async function stopHttpServer(server: http.Server): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    });
  }

  describe('isPortInUse', () => {
    it('should return true for occupied port (EADDRINUSE)', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      // Create a specific mock for this test
      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'error') {
            // Trigger EADDRINUSE immediately
            setTimeout(() => cb({ code: 'EADDRINUSE' }), 0);
          }
        }),
        listen: mock(() => {})
      }));
      
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const result = await isPortInUse(37777);

      expect(result).toBe(true);
      expect(net.createServer).toHaveBeenCalled();
      
      spy.mockRestore();
    });

    it('should return false for free port (listening succeeds)', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      const closeMock = mock((cb: Function) => cb());
      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'listening') {
            // Trigger listening success
            setTimeout(() => cb(), 0);
          }
        }),
        listen: mock(() => {}),
        close: closeMock
      }));
      
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const result = await isPortInUse(39999);

      expect(result).toBe(false);
      expect(net.createServer).toHaveBeenCalled();
      expect(closeMock).toHaveBeenCalled();
      
      spy.mockRestore();
    });

    it('should return false for other socket errors', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'error') {
            // Trigger other error (e.g., EACCES)
            setTimeout(() => cb({ code: 'EACCES' }), 0);
          }
        }),
        listen: mock(() => {})
      }));
      
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const result = await isPortInUse(37777);

      expect(result).toBe(false);

      spy.mockRestore();
    });

    it('should detect occupied port on Windows via TCP connect', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true
      });

      const server = net.createServer();
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
      const address = server.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
      }

      try {
        const result = await isPortInUse(address.port);
        expect(result).toBe(true);
      } finally {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => err ? reject(err) : resolve());
        });
      }
    });

    it('should detect free port on Windows without using fetch', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true,
        configurable: true
      });

      const tempServer = net.createServer();
      await new Promise<void>((resolve) => tempServer.listen(0, '127.0.0.1', () => resolve()));
      const address = tempServer.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
      }
      const freePort = address.port;
      await new Promise<void>((resolve, reject) => {
        tempServer.close((err) => err ? reject(err) : resolve());
      });

      const result = await isPortInUse(freePort);

      expect(result).toBe(false);
    });
  });

  describe('waitForHealth', () => {
    it('should succeed immediately when server responds', async () => {
      const { server, port } = await startHttpServer((_req, res) => {
        res.statusCode = 200;
        res.end('ok');
      });

      try {
        const start = Date.now();
        const result = await waitForHealth(port, 5000);
        const elapsed = Date.now() - start;

        expect(result).toBe(true);
        expect(elapsed).toBeLessThan(1000);
      } finally {
        await stopHttpServer(server);
      }
    });

    it('should timeout when no server responds', async () => {
      const tempServer = net.createServer();
      await new Promise<void>((resolve) => tempServer.listen(0, '127.0.0.1', () => resolve()));
      const address = tempServer.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
      }
      const port = address.port;
      await new Promise<void>((resolve, reject) => {
        tempServer.close((err) => err ? reject(err) : resolve());
      });

      const start = Date.now();
      const result = await waitForHealth(port, 1500);
      const elapsed = Date.now() - start;

      expect(result).toBe(false);
      // Should take close to timeout duration
      expect(elapsed).toBeGreaterThanOrEqual(1400);
      expect(elapsed).toBeLessThan(2500);
    });

    it('should succeed after server becomes available', async () => {
      const tempServer = net.createServer();
      await new Promise<void>((resolve) => tempServer.listen(0, '127.0.0.1', () => resolve()));
      const address = tempServer.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
      }
      const port = address.port;
      await new Promise<void>((resolve, reject) => {
        tempServer.close((err) => err ? reject(err) : resolve());
      });

      const delayedServerPromise = (async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return startHttpServer((_req, res) => {
          res.statusCode = 200;
          res.end('ok');
        }, port);
      })();

      const result = await waitForHealth(port, 5000);
      const { server } = await delayedServerPromise;

      try {
        expect(result).toBe(true);
      } finally {
        await stopHttpServer(server);
      }
    });

    it('should check health endpoint for liveness', async () => {
      let requestedPath = '';
      const { server, port } = await startHttpServer((req, res) => {
        requestedPath = req.url || '';
        res.statusCode = 200;
        res.end('ok');
      });

      try {
        await waitForHealth(port, 1000);
        expect(requestedPath).toBe('/api/health');
      } finally {
        await stopHttpServer(server);
      }
    });

    it('should use default timeout when not specified', async () => {
      const { server, port } = await startHttpServer((_req, res) => {
        res.statusCode = 200;
        res.end('ok');
      });

      try {
        const result = await waitForHealth(port);

        expect(result).toBe(true);
      } finally {
        await stopHttpServer(server);
      }
    });
  });

  describe('getInstalledPluginVersion', () => {
    it('should return a valid semver string', () => {
      const version = getInstalledPluginVersion();

      // Should be a string matching semver pattern or 'unknown'
      if (version !== 'unknown') {
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });

    it('should not throw on ENOENT (graceful degradation)', () => {
      // The function handles ENOENT internally — should not throw
      // If package.json exists, it returns the version; if not, 'unknown'
      expect(() => getInstalledPluginVersion()).not.toThrow();
    });
  });

  describe('checkVersionMatch', () => {
    it('should assume match when worker version is unavailable', async () => {
      const tempServer = net.createServer();
      await new Promise<void>((resolve) => tempServer.listen(0, '127.0.0.1', () => resolve()));
      const address = tempServer.address();
      if (!address || typeof address === 'string') {
        throw new Error('Expected TCP server address');
      }
      const port = address.port;
      await new Promise<void>((resolve, reject) => {
        tempServer.close((err) => err ? reject(err) : resolve());
      });

      const result = await checkVersionMatch(port);

      expect(result.matches).toBe(true);
      expect(result.workerVersion).toBeNull();
    });

    it('should detect version mismatch', async () => {
      const { server, port } = await startHttpServer((req, res) => {
        if (req.url === '/api/version') {
          res.statusCode = 200;
          res.end(JSON.stringify({ version: '0.0.0-definitely-wrong' }));
          return;
        }
        res.statusCode = 404;
        res.end();
      });

      const result = await checkVersionMatch(port);

      try {
        const pluginVersion = getInstalledPluginVersion();
        if (pluginVersion !== 'unknown' && pluginVersion !== '0.0.0-definitely-wrong') {
          expect(result.matches).toBe(false);
        }
      } finally {
        await stopHttpServer(server);
      }
    });

    it('should detect version match', async () => {
      const pluginVersion = getInstalledPluginVersion();
      if (pluginVersion === 'unknown') return; // Skip if can't read plugin version

      const { server, port } = await startHttpServer((req, res) => {
        if (req.url === '/api/version') {
          res.statusCode = 200;
          res.end(JSON.stringify({ version: pluginVersion }));
          return;
        }
        res.statusCode = 404;
        res.end();
      });

      const result = await checkVersionMatch(port);

      try {
        expect(result.matches).toBe(true);
        expect(result.pluginVersion).toBe(pluginVersion);
        expect(result.workerVersion).toBe(pluginVersion);
      } finally {
        await stopHttpServer(server);
      }
    });
  });

  describe('waitForPortFree', () => {
    it('should return true immediately when port is already free', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'listening') setTimeout(() => cb(), 0);
        }),
        listen: mock(() => {}),
        close: mock((cb: Function) => cb())
      }));
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const start = Date.now();
      const result = await waitForPortFree(39999, 5000);
      const elapsed = Date.now() - start;

      expect(result).toBe(true);
      expect(elapsed).toBeLessThan(1000);
      spy.mockRestore();
    });

    it('should timeout when port remains occupied', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'error') setTimeout(() => cb({ code: 'EADDRINUSE' }), 0);
        }),
        listen: mock(() => {})
      }));
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const start = Date.now();
      const result = await waitForPortFree(37777, 1500);
      const elapsed = Date.now() - start;

      expect(result).toBe(false);
      expect(elapsed).toBeGreaterThanOrEqual(1400);
      expect(elapsed).toBeLessThan(2500);
      spy.mockRestore();
    });

    it('should succeed when port becomes free', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      let callCount = 0;
      const spy = spyOn(net, 'createServer').mockImplementation(() => ({
        once: mock((event: string, cb: Function) => {
          callCount++;
          // Port occupied for first 2 checks, then free
          if (callCount < 3) {
            if (event === 'error') setTimeout(() => cb({ code: 'EADDRINUSE' }), 0);
          } else {
            if (event === 'listening') setTimeout(() => cb(), 0);
          }
        }),
        listen: mock(() => {}),
        close: mock((cb: Function) => cb())
      } as any));

      const result = await waitForPortFree(37777, 5000);

      expect(result).toBe(true);
      expect(callCount).toBeGreaterThanOrEqual(3);
      spy.mockRestore();
    });

    it('should use default timeout when not specified', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true,
        configurable: true
      });

      const createServerMock = mock(() => ({
        once: mock((event: string, cb: Function) => {
          if (event === 'listening') setTimeout(() => cb(), 0);
        }),
        listen: mock(() => {}),
        close: mock((cb: Function) => cb())
      }));
      const spy = spyOn(net, 'createServer').mockImplementation(createServerMock as any);

      const result = await waitForPortFree(39999);

      expect(result).toBe(true);
      spy.mockRestore();
    });
  });
});
