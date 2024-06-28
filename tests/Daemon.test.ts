import { clean, start, stop } from './fixtures/example-b/launcher.js';
import { isRunning } from '../src/process-utils.js';

import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import { Daemon } from '../src/damon.js';

const EXAMPLE_STOPS: { daemon: Daemon; stop: () => void }[] = [];
const EXAMPLES = {
  b: async () => {
    const { daemon, start, stop } = await import(
      './fixtures/example-b/launcher.js'
    );

    const { pid, data, startedAt, isRunning } = await start();

    // Sanity checks for the underlying daemon
    // (and the order of these is important)
    expect(isRunning).toBe(true);
    expect(startedAt).toBeTruthy();
    expect(pid).not.toBe(process.pid);
    expect(data).deep.equals({ exampleB: 'custom-data-from-the-daemon' });

    EXAMPLE_STOPS.push({
      daemon,
      stop: async () => {
        await stop();
      },
    });
    return { stop, pid, data, startedAt };
  },
};

async function stopExamples() {
  while (EXAMPLE_STOPS.length) {
    let last = EXAMPLE_STOPS.pop();

    await last?.daemon.stop();
  }
}

describe.sequential('Daemon', () => {
  describe('example-b', async () => {
    beforeEach(async () => {
      await clean();
      await stopExamples();
    });
    afterEach(async () => {
      await stopExamples();
    });

    function assertIsRunning(pid: number, msg = '') {
      if (isRunning(pid)) {
        return expect('Process is running').toBeTruthy();
      }

      expect(`${pid} is not running. ${msg}`).toBeFalsy();
    }

    describe('ensureStarted', () => {
      test('it starts a process that was not started previously', async () => {
        let { pid } = await EXAMPLES.b();

        expect(pid).not.toEqual(process.pid);
        assertIsRunning(pid);
      });

      test('when a process is already started, it just returns the info', async () => {
        let originalInfo = await start();
        assertIsRunning(originalInfo.pid, `first start`);

        let newInfo = await start();
        assertIsRunning(newInfo.pid, `after second start`);

        expect(newInfo.startedAt).toStrictEqual(originalInfo.startedAt);
        expect(newInfo.pid).toStrictEqual(originalInfo.pid);
        expect(newInfo.data).toStrictEqual(originalInfo.data);
      });
    });

    describe('stop', () => {
      let info: Awaited<ReturnType<typeof start>>;

      beforeEach(async () => {
        info = await start();

        expect(info.pid).not.toEqual(process.pid);
        assertIsRunning(info.pid);
      });

      test('process can be stopped', async () => {
        await stop();

        expect(isRunning(info.pid)).toBe(false);
      });
    });
  });
});
