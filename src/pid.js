import path from 'node:path';
import assert from 'node:assert';
import fsSync from 'node:fs';
import process from 'node:process';
import { isRunning, processStartedAt } from './process-utils.js';

/**
 * 1s seems to be the minimum granularity we can check for.
 * 500ms is too short.
 */
const MAX_TIME_BETWEEN_START_TIMESTAMPS = 1000; /* ms */

function ISODate() {
  return new Date().toISOString();
}

/**
 * Implements a pid file management class capable of monitoring processes using
 * pid files stored at known locations. Designed for use in daemonized processes.
 */
export class PidFile {
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

  get exists() {
    return fsSync.existsSync(this.#pidFilePath);
  }

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

  get data() {
    return this.#readPidFile().data;
  }

  get fileContents() {
    assert(
      this.exists,
      `pid file ${this.#pidFilePath} does not exist, so it cannot be read.`
    );

    let buffer = fsSync.readFileSync(this.#pidFilePath);
    let str = buffer.toString();
    let pidData = JSON.parse(str);

    return pidData;
  }

  #readPidFile = () => {
    let pidData = this.fileContents;

    this.#pid = pidData.pid;

    return pidData;
  };

  delete = () => {
    if (this.exists) {
      fsSync.rmSync(this.#pidFilePath);
    }
  };

  get uptime() {
    let now = Date.now();

    return now - this.startedAt.getTime();
  }

  get startedAt() {
    assert(
      isRunning(this.pid),
      `Process @ ${this.pid} is not running, so we can't ask the OS what the start time is.`
    );
    return processStartedAt(this.pid);
  }

  get #recordedStartedTime() {
    let pidData = this.#readPidFile();

    return new Date(pidData.timestamp).getTime();
  }

  get isRunning() {
    let pidData = this.#readPidFile();

    let runningPIDExists = isRunning(pidData.pid);

    if (!runningPIDExists) {
      return false;
    }

    // Now we need to make sure the running PID
    // is *probably* from the same process as we expect
    // (as PIDs can be re-used)
    let actualStart = this.startedAt.getTime();
    let recordedStart = this.#recordedStartedTime;

    let delta = Math.abs(actualStart - recordedStart);

    return delta < MAX_TIME_BETWEEN_START_TIMESTAMPS;
  }

  /**
   * @param {number} signal
   */
  kill = (signal) => process.kill(this.#pid, signal);

  get pid() {
    return this.#readPidFile().pid;
  }
}
