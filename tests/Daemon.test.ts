import { Daemon } from 'salvatore';
import { start, stop } from './fixtures/example-b/launcher.js';
import { isRunning } from '../src/process-utils.js';

import { describe, expect, test, beforeEach, afterEach } from 'vitest';

describe('Daemon', () => {
  describe('example-b', () => {
    afterEach(async () => {
      await stop();
    });

    describe('ensureStarted', () => {
      test('it starts a process that was not started previously', async () => {
        let info = await start();

        expect(info.pid).not.toEqual(process.pid);
        expect(isRunning(info.pid)).toBe(true);
      });

      test('when a process is already started, it just returns the info', async () => {
        let originalInfo = await start();

        expect(isRunning(originalInfo.pid)).toBe(true);

        let newInfo = await start();

        expect(newInfo).deep.equals(originalInfo);
      });
    });

    describe('stop', () => {
      let info: Awaited<ReturnType<typeof start>>;

      beforeEach(async () => {
        info = await start();

        expect(info.pid).not.toEqual(process.pid);
        expect(isRunning(info.pid)).toBe(true);
      });

      test('process can be stopped', async () => {
        await stop();

        expect(isRunning(info.pid)).toBe(false);
      });
    });
  });
});
