import path from 'node:path';
import assert from 'node:assert';
import fsSync from 'node:fs';
import process from 'node:process';

function ISODate() {
  return new Date().toISOString();
}

/**
 * @param {number} pid
 */
function isRunning(pid) {
  try {
    // No Signal is sent, but error checking still occurs
    // https://unix.stackexchange.com/questions/169898/what-does-kill-0-do
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (typeof e === 'object' && e !== null && 'code' in e) {
      // e.code will be ESRCH if the pid doesn't exist
      return e.code === 'EPERM';
    }

    // Unexpected!
    throw e;
  }
}

/**
 * Implements a pid file management class capable of monitoring processes using
 * pid files stored at known locations. Designed for use in daemonized processes.
 */
export class DaemonPID {
  #pidFilePath;
  #pid = process.pid;

  /**
   * The path of the Pid file
   *
   * @param {string} pidFilePath
   */
  constructor(pidFilePath) {
    assert(pidFilePath, 'a filePath for the pid file is required');
    assert(this.#pid, 'cannot use DaemonPID without a pid');

    this.#pidFilePath = pidFilePath;
  }

  exists = () => fsSync.existsSync(this.#pidFilePath);

  /**
   * Writes out the PID file with the optional JSON-able data attached. Calls the
   * callback function with (err).
   *
   * @param {unknown} data
   */
  write = (data) => {
    let json = JSON.stringify({
      pid: this.#pid,
      timestamp: ISODate(),
      data: data ?? '',
    });

    let folder = path.dirname(this.#pidFilePath);

    fsSync.mkdirSync(folder, { recursive: true });
    fsSync.writeFileSync(this.#pidFilePath, json);
  };

  read = () => {
    assert(
      this.exists(),
      `pid file ${this.#pidFilePath} does not exist, so it cannot be read.`
    );

    let buffer = fsSync.readFileSync(this.#pidFilePath);
    let str = buffer.toString();
    let pidData = JSON.parse(str);

    this.#pid = pidData.pid;

    return pidData;
  };

  delete = () => {
    if (this.exists()) {
      fsSync.rmSync(this.#pidFilePath);
    }
  };

  uptime = () => {
    let now = Date.now();

    return now - this.started();
  };

  started = () => {
    let pidData = this.read();

    return new Date(pidData.timestamp).getTime();
  };

  running = () => {
    let pidData = this.read();

    return isRunning(pidData.pid);
  };

  /**
   * @param {number} signal
   */
  kill = (signal) => void process.kill(this.#pid, signal);

  pid = () => {
    let assumingPid = this.read().pid;

    assert(
      this.running(),
      `The process at ${assumingPid} is no longer running.`
    );

    return assumingPid;
  };
}
