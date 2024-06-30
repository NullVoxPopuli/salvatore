import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import { PidFile } from '../src/pid.js';
import { Daemon } from '../src/damon.js';
import assert from 'node:assert';
import { $ } from 'execa';
import { assertIsRunning } from './assertions.ts';

const THIS_FILE = url.fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.join(path.dirname(THIS_FILE), '../');

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

const appPrefix = 'salvatore-tests/test-';

console.debug(
  `Outside of CI, these tmp directories are not cleaned up. To clean them up manually, run 'rm -rf $TMPDIR/salvatore-tests/'`
);

// https://blog.mastykarz.nl/create-temp-directory-app-node-js/
async function tmp(fn: (tmpDir: string) => unknown) {
  let root = path.join(os.tmpdir(), appPrefix);
  let tmpDir;
  try {
    fsSync.mkdirSync(root, { recursive: true });
    tmpDir = fsSync.mkdtempSync(root);
    await fn(tmpDir);
  } finally {
    if (process.env.CI) {
      if (tmpDir) {
        fsSync.rmSync(tmpDir, { recursive: true });
      }
    }
  }
}

type Example = {
  pidFile: PidFile;
  tmpDir: string;
  daemon: Daemon;
  stop: () => Promise<void>;
  start: () => ReturnType<Daemon['ensureStarted']>;
  isDaemonRunning: () => boolean;
  status: () => void;
  clean: () => Promise<void>;
};
type ScenarioTest = (
  name: string,
  testBody: (example: Example) => void | Promise<void>
) => void | Promise<void>;

export async function scenario(
  scenarioName: string,
  describeBody: (test: ScenarioTest) => void | Promise<void>
) {
  return describe(scenarioName, async () => {
    let scenarioDir = path.join(__dirname, '..', scenarioName);

    function scenarioTest(
      name: string,
      fn: (example: Example) => void | Promise<void>
    ) {
      test(name, async () => {
        await tmp(async (tmpDir) => {
          await fs.cp(scenarioDir, tmpDir, { recursive: true });
          await $({ cwd: tmpDir })`pnpm remove salvatore`;
          await $({ cwd: tmpDir })`pnpm add ${PROJECT_ROOT}`;

          // @ts-expect-error I don't care here
          let exampleForScenario = EXAMPLES[scenarioName];

          assert(
            exampleForScenario,
            `Could not find example for ${scenarioName}. Available: ${Object.keys(EXAMPLES).join(', ')}`
          );

          console.debug(
            `Example ${scenarioName} can be manually inspected in ${tmpDir}`
          );

          let example = await exampleForScenario(tmpDir);

          await fn({ tmpDir, pidFile: example.pidFile, ...example });
        });
      });
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

    assertIsRunning(pidFile);
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
  'examples/daemon': async (tmpDir: string) => {
    const { daemon, start, stop, pidFile } = await import(
      path.join(tmpDir, './launcher.js')
    );

    const { pid, data, startedAt } = await start();

    assertIsRunning(pidFile);
    expect(data).deep.equals({ exampleB: 'custom-data-from-the-daemon' });

    EXAMPLE_STOPS.push({
      pidFile,
      /**
       * This stop should delete the pid file on its own
       * (for this example, specifically)
       */
      stop,
    });
    return {
      stop,
      pid,
      pidFile,
      data,
      start,
      startedAt,
      get isRunning() {
        return daemon.isRunning;
      },
    };
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
