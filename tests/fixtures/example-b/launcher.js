import { Daemon, PidFile } from 'salvatore';
import { daemon as scriptPath, pidPath } from './shared.js';
import assert from 'node:assert';
import { isRunning } from '../../../src/process-utils.js';

let daemon = new Daemon(scriptPath, { pidFilePath: pidPath });

const pidFile = new PidFile(pidPath);

function clean() {
  if (pidFile.exists) {
    if (pidFile.isRunning) {
      pidFile.kill(9);
    }
  }
}

export async function start() {
  clean();
  return await daemon.ensureStarted();
}

export async function stop() {
  // If there is no pid file, we cannot be confident that we are going to kill the correct process
  if (!pidFile.exists) return;

  let pid = daemon.info.pid;
  if (!isRunning(daemon.info.pid)) {
    console.log(`Process @ ${pid} is not running`);
    clean();
    return;
  }

  try {
    assert(
      pid !== process.pid,
      `Somehow the Daemon's PID is our pid. This means we can't stop the process without stopping ourselves`
    );

    await daemon.stop();
  } finally {
    clean();
  }
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
