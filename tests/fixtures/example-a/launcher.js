import { PidFile } from 'salvatore/pid';
import fsSync from 'node:fs';
import { spawn } from 'node:child_process';
import { pidPath, daemon } from './shared.js';

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
        fsSync.openSync('example-a.log', 'a'),
        fsSync.openSync('example-a.log', 'a'),
      ],
    });

    process.on('exit', () => {
      if (prc.exitCode === null) {
        throw new Error(
          `Process for ${pidPath} is still running. Expected it to be cleaned up!`
        );
      }
    });

    // Spawn detaches, so we need a way to wait for
    // the creation of the pid file.
    await new Promise((r) => setTimeout(r, 1000));

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
