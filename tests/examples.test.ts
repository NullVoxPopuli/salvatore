import { afterEach, beforeEach, describe, expect } from 'vitest';
import { isWithinTolerance, scenario, stopExamples, wait } from './helpers.ts';
import { isRunning } from '../src/process-utils.js';
import { Daemon } from '../src/damon.js';
import { PidFile } from '../src/pid.js';
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
    describe('ensureStarted', () => {
      test('it starts a process that was not started previously', async ({
        pidFile,
      }) => {
        expect(pidFile.pid).not.toEqual(process.pid);
        assertIsRunning(pidFile);
      });

      test('when a process is already started, it just returns the info', async ({
        start,
        pidFile,
      }) => {
        let originalInfo = await start();
        assertIsRunning(pidFile);

        let newInfo = await start();
        assertIsRunning(pidFile);

        expect(newInfo.startedAt).toStrictEqual(originalInfo.startedAt);
        expect(newInfo.pid).toStrictEqual(originalInfo.pid);
        expect(newInfo.data).toStrictEqual(originalInfo.data);
        expect(newInfo.command).toStrictEqual(originalInfo.command);
      });
    });

    describe('stop', () => {
      let info: Awaited<Daemon>;

      async function setup(
        start: () => ReturnType<Daemon['ensureStarted']>,
        pidFile: PidFile
      ) {
        info = await start();
        console.log(info);

        expect(info.pid).not.toEqual(process.pid);
        assertIsRunning(pidFile);
      }

      test('process can be stopped', async ({ start, stop, pidFile }) => {
        await setup(start, pidFile);
        await stop();

        await wait(1000);
        expect(isRunning(info.pid)).toBe(false);
      });
    });
  });
});
