import { PidFile } from 'salvatore/pid';
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
      stdio: 'ignore',
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
