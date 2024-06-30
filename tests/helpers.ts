import os from 'node:os';
import path from 'node:path';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { PidFile } from '../src/pid.js';
/**
 * One second is how long we allow for mismatch between
 * how Node manages time and how the OS manages time
 * (as well as the difference between when a daemon is expected to wrie
 *  the starttime to the pid file)
 */
export function waitOneSecond() {
  return wait(1_000);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isWithinTolerance(a: number, b: number, tolerance: number) {
  let delta = Math.abs(a - b);
  expect(delta).toBeLessThan(tolerance);
}

const appPrefix = 'salvatore-tests';

// https://blog.mastykarz.nl/create-temp-directory-app-node-js/
async function tmp(fn: (tmpDir: string) => unknown) {
  let tmpDir;
  try {
    tmpDir = fsSync.mkdtempSync(path.join(os.tmpdir(), appPrefix));
    await fn(tmpDir);
  }
  finally {
    if (tmpDir) {
      fsSync.rmSync(tmpDir, { recursive: true });
    }
  }
}

type Example = { pidFile: PidFile, tmpDir: string; example: any; };
type ScenarioTest = (name: string, testBody: (example: Example) => void | Promise<void>) => void | Promise<void>

export async function scenario(scenarioName: string, describeBody: (test: ScenarioTest) => void | Promise<void>) {

  return describe(scenarioName, async () => {
    let scenarioDir = path.join(__dirname, '..', scenarioName);

    function scenarioTest(name: string, fn: (example: Example) => void | Promise<void>) {
      test(name, async () => {
        await tmp(async (tmpDir) => {
          await fs.cp(scenarioDir, tmpDir, { recursive: true });

          // @ts-expect-error I don't care here
          let example = EXAMPLES[scenarioDir](tmpDir);

          await fn({ tmpDir, pidFile: example.pidFile, example });
        });
      })
    }
    await describeBody(scenarioTest);
  });
}

const EXAMPLE_STOPS: { pidFile: PidFile; stop: () => void }[] = [];
const EXAMPLES = {
  'examples/pidfile': async (tmpDir: string) => {
    const { start, stop } = await import(path.join(tmpDir, './launcher.js'));

    const { didStart, wasAlreadyRunning, pidFile } = await start();

    expect({ didStart, wasAlreadyRunning }).deep.equals({
      didStart: true,
      wasAlreadyRunning: false,
    });

    // Sanity checks for the underlying daemon
    // (and the order of these is important)
    expect(pidFile.exists).toBe(true);
    expect(pidFile.isRunning).toBe(true);
    expect(pidFile.pid).not.toBe(process.pid);
    expect(pidFile.data).toBe('custom-data-from-the-daemon');

    EXAMPLE_STOPS.push({
      pidFile,
      stop: () => {
        stop();
        pidFile.delete();
      },
    });
    return { didStart, wasAlreadyRunning, pidFile, stop };
  },
};

export function stopExamples() {
  while (EXAMPLE_STOPS.length) {
    let last = EXAMPLE_STOPS.pop();

    if (last?.pidFile.isRunning) {
      last?.stop();
    }
  }
}





