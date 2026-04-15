import { describe, it, expect, mock } from 'bun:test';
import { SSEBroadcaster } from '../../src/services/worker/SSEBroadcaster.js';

describe('SSEBroadcaster', () => {
  it('closes connected clients during shutdown', () => {
    const broadcaster = new SSEBroadcaster();

    const closeHandlers: Array<() => void> = [];
    const response = {
      write: mock(() => true),
      end: mock(() => undefined),
      on: mock((event: string, handler: () => void) => {
        if (event === 'close') {
          closeHandlers.push(handler);
        }
      }),
      status: mock(() => response),
      setHeader: mock(() => undefined),
      socket: {
        end: mock(() => undefined),
        destroySoon: mock(() => undefined),
        destroy: mock(() => undefined),
      }
    } as any;

    broadcaster.addClient(response);

    expect(broadcaster.getClientCount()).toBe(1);

    const closed = broadcaster.shutdown();

    expect(closed).toBe(1);
    expect(broadcaster.getClientCount()).toBe(0);
    expect(response.end).toHaveBeenCalled();
    expect(response.socket.end).toHaveBeenCalled();
    expect(response.socket.destroy).toHaveBeenCalled();

    closeHandlers.forEach(handler => handler());
    expect(broadcaster.getClientCount()).toBe(0);
  });
});
