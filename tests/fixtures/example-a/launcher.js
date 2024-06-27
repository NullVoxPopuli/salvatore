import { DaemonPID } from "salvatore";
import { spawn } from "node:child_process";
import { pidPath, daemon } from "./shared.js";

const pidFile = new DaemonPID(pidPath);

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
      stdio: "ignore",
    });
    // Required to allow the daemon to keep running
    // when the launcher-process exits
    prc.unref();

    // Spawn detaches, so we need a way to wait for
    // the creation of the pid file.
    await new Promise((r) => setTimeout(r, 50));

    state.didStart = true;
  }

  return state;
}

export async function stop() {
  pidFile.kill(9);
}
