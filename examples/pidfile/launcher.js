import { PidFile } from 'salvatore/pid';
import fsSync from 'node:fs';
import { spawn } from 'node:child_process';
import { pidPath, daemon } from './shared.js';
import { isRunning } from 'salvatore/__private__/process-utils';
import { waitFor } from 'salvatore/__private__/utils';

export const pidFile = new PidFile(pidPath);

function clean() {
  if (pidFile.exists) {
    if (pidFile.isRunning) {
      pidFile.kill(9);
    }
  }
}

export async function start() {
  clean();
  let state = { didStart: false, wasAlreadyRunning: false, pidFile };

  if (pidFile.exists && pidFile.isRunning) {
    state.wasAlreadyRunning = true;
  } else {
    let prc = spawn(process.argv0, [daemon], {
      detached: true,
      stdio: [
        'ignore',
        fsSync.openSync('example.log', 'a'),
        fsSync.openSync('example.log', 'a'),
      ],
    });

    process.on('exit', () => {
      if (prc.exitCode === null) {
        throw new Error(
          `Process for ${pidPath} is still running. Expected it to be cleaned up!`
        );
      }
    });

    await waitFor(
      () => fsSync.existsSync(pidPath),
      `Timed out waiting for ${pidPath} to exist. It's possible the process prematurely exited and cleaned up after itself.`,
      2000
    );

    // Spawn detaches, so we need a way to wait for
    // the creation of the pid file.
    await waitFor(
      () => isRunning(pidFile.pid),
      `Process for ${pidPath} @ ${pidFile.pid} did not start or exited`,
      2000
    );

    state.didStart = true;
  }

  return state;
}

export async function stop() {
  pidFile.kill(9);
  clean();
}

export async function status() {
  if (!pidFile.exists) {
    console.log(
      `pidFile @ ${pidPath} does not exist. Cannot gather more information. The process may have exited and cleaned itself up.`
    );
    return;
  }

  let isRunning = pidFile.isRunning;
  let startedAt = isRunning ? pidFile.startedAt : null;
  let uptime = isRunning ? pidFile.uptime : null;

  console.log(`
    Running: ${isRunning}
    PID:     ${pidFile.pid}
    Started: ${startedAt}
    Uptime:  ${uptime} 
    Data:    ${JSON.stringify(pidFile.data)}
  `);
}
