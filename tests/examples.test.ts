import { afterEach, beforeEach, describe, expect } from 'vitest';
import { isWithinTolerance, scenario, stopExamples, wait } from './helpers.ts';
import { isRunning } from '../src/process-utils.js';
import { Daemon } from '../src/damon.js';
import { assertIsRunning } from './assertions.ts';

describe('Examples', () => {
  beforeEach(() => {
    stopExamples();
  });
  afterEach(() => {
    stopExamples();
  });

  scenario('examples/pidfile', (test) => {
    describe('.startedAt', () => {
      test('represents the actual process start time, as known by the OS', async ({
        pidFile,
      }) => {
        assertIsRunning(pidFile);

        let asRecorded = new Date(pidFile.fileContents.timestamp);
        isWithinTolerance(
          asRecorded.getTime(),
          pidFile.startedAt.getTime(),
          2000 /* 2s */
        );
      });
    });

    describe('.kill()', () => {
      test('can be killed', async ({ pidFile }) => {
        assertIsRunning(pidFile);

        pidFile.kill(9);

        // process killing is async
        await wait(1000);
        expect(pidFile.isRunning, 'process is not running').toBe(false);
      });
    });
  });

  scenario('examples/daemon', (test) => {
    function assertIsRunning(pid: number, msg = '') {
      if (isRunning(pid)) {
        return expect('Process is running').toBeTruthy();
      }

      expect(`${pid} is not running. ${msg}`).toBeFalsy();
    }

    describe('ensureStarted', () => {
      test('it starts a process that was not started previously', async ({
        pidFile,
      }) => {
        expect(pidFile.pid).not.toEqual(process.pid);
        assertIsRunning(pidFile.pid);
      });

      test('when a process is already started, it just returns the info', async ({
        start,
      }) => {
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
      let info: Awaited<Daemon>;

      async function setup(start: () => ReturnType<Daemon['ensureStarted']>) {
        info = await start();

        expect(info.pid).not.toEqual(process.pid);
        assertIsRunning(info.pid);
      }

      test('process can be stopped', async ({ start, stop }) => {
        await setup(start);
        await stop();

        expect(isRunning(info.pid)).toBe(false);
      });
    });
  });
});
