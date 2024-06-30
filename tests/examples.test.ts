import { afterEach, beforeEach, describe, expect } from "vitest";
import { isWithinTolerance, scenario, stopExamples, wait } from "./helpers.ts";

describe('Examples', () => {
  beforeEach(() => {
    stopExamples();
  });
  afterEach(() => {
    stopExamples();
  });

  scenario('examples/pidfile', (test) => {
    describe('.startedAt', () => {
      test('represents the actual process start time, as known by the OS', async ({ pidFile }) => {

        expect(pidFile.exists).toBe(true);
        expect(pidFile.isRunning).toBe(true);

        let asRecorded = new Date(pidFile.fileContents.timestamp);
        isWithinTolerance(
          asRecorded.getTime(),
          pidFile.startedAt.getTime(),
          1000 /* 1s */
        );
      });
    });

    describe('.kill()', () => {
      test('can be killed', async ({ pidFile }) => {

        expect(pidFile.exists, 'pid file exists').toBe(true);
        expect(pidFile.isRunning, 'process is running').toBe(true);

        pidFile.kill(9);

        // process killing is async
        await wait(1000);
        expect(pidFile.isRunning, 'process is not running').toBe(false);
      });
    });
  });
});
