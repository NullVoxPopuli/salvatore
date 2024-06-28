import { Daemon, PidFile } from "salvatore";
import { daemon as scriptPath, pidPath } from "./shared.js";
import assert from "node:assert";

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
  let pid = daemon.info.pid;

  assert(
    pid !== process.pid,
    `Somehow the Daemon's PID is our pid. This means we can't stop the process without stopping ourselves`,
  );

  await daemon.stop();
  clean();
}
