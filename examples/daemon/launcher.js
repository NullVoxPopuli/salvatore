import { Daemon, PidFile } from 'salvatore';
import { daemon as scriptPath, pidPath } from './shared.js';
import assert from 'node:assert';
import { isRunning } from 'salvatore/__private__/process-utils';

export const daemon = new Daemon(scriptPath, {
  pidFilePath: pidPath,
  // logFile: "example-b.log",
});

export const pidFile = new PidFile(pidPath);

export async function clean() {
  if (pidFile.exists) {
    if (pidFile.isRunning) {
      await daemon.stop();
    }
  }
  pidFile.delete();
}

export async function start() {
  return await daemon.ensureStarted();
}

export async function stop() {
  // If there is no pid file, we cannot be confident that we are going to kill the correct process
  if (!pidFile.exists) {
    console.log('PidFile does not exist, nothing to stop');
    return;
  }

  let pid = daemon.info.pid;
  if (!isRunning(pid)) {
    console.log(`Process @ ${pid} is not running`);
    await clean();
    return;
  }

  try {
    assert(
      pid !== process.pid,
      `Somehow the Daemon's PID is our pid. This means we can't stop the process without stopping ourselves`
    );

    await daemon.stop();
  } finally {
    await clean();
  }
}

export function isDaemonRunning() {
  return pidFile.isRunning;
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
