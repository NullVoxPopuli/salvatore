import { PidFile } from 'salvatore';
import { expect } from 'vitest';
import { isRunning } from '../src/process-utils.js';

export function assertIsRunning(pidFile: PidFile) {
  // Sanity checks for the underlying daemon
  // (and the order of these is important)
  expect(pidFile.exists, `PID file exists`).toBe(true);

  expect(isRunning(pidFile.pid), `PID exists and did not receive ESRCH`).toBe(
    true
  );

  expect(pidFile.isRunning, `PID file thinks it's running`).toBe(true);

  expect(
    pidFile.pid,
    `PID did not accidentally be the same as the parent (vitest) process`
  ).not.toBe(process.pid);
}
