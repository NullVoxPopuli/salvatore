import path from "node:path";
import assert from "node:assert";
import fsSync from "node:fs";
import process from "node:process";
import {
  isRunning,
  processCommand,
  processStartedAt,
} from "./process-utils.js";

/**
 * 1s seems to be the minimum granularity we can check for.
 * 500ms is too short.
 * Often, 1s is too short.
 *        especially in CI.
 */
const MAX_TIME_BETWEEN_START_TIMESTAMPS = 5000; /* ms */

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
    assert(pidFilePath, "a filePath for the pid file is required");
    assert(this.#pid, "cannot use DaemonPID without a pid");

    this.#pidFilePath = pidFilePath;
  }

  /**
   * Retrieves the process-id of the referenced process.
   */
  get pid() {
    return this.#readPidFile().pid;
  }

  /**
   * Returns true if the pid file has been written
   */
  get exists() {
    return fsSync.existsSync(this.#pidFilePath);
  }

  /**
   * Reads the PID file's data from the filesystem.
   */
  get data() {
    return this.#readPidFile().data;
  }

  /**
   * Retrieves the parsed contents of the pid file with no checking or processing.
   */
  get fileContents() {
    assert(
      this.exists,
      `pid file ${this.#pidFilePath} does not exist, so it cannot be read.`,
    );

    let buffer = fsSync.readFileSync(this.#pidFilePath);
    let str = buffer.toString();
    let pidData = JSON.parse(str);

    return pidData;
  }

  /**
   * Retrieves the time in milliseconds the process referenced by the pid file has been running.
   */
  get uptime() {
    let now = Date.now();

    return now - this.startedAt.getTime();
  }

  /**
   * The command that the PID is related to.
   * This, combined with startedAt help deter
   *
   * @returns {string}
   */
  get command() {
    return this.fileContents.command;
  }

  /**
   * Retrieves a Date object representing the date and time the process referenced by the pid file was started.
   *
   * @returns {Date}
   */
  get startedAt() {
    assert(
      isRunning(this.pid),
      `Process @ ${this.pid} is not running, so we can't ask the OS what the start time is.`,
    );
    return processStartedAt(this.pid);
  }

  /**
   * if the associated process is currently running.
   *
   * @returns {boolean}
   */
  get isRunning() {
    if (!this.exists) {
      return false;
    }

    let pidData = this.#readPidFile();

    let runningPIDExists = isRunning(pidData.pid);

    if (!runningPIDExists) {
      return false;
    }

    // Now ne need to see if the COMMAND was the same
    // if not, then we're not running, and we
    // don't need to check the time.
    let actualCommand = processCommand(pidData.pid).trim();
    let recordedCommand = pidData.command.trim();
    // Example:
    //   actual:    node path/to/script.js
    //   recorded:  /opt/hostedtoolcache/node/22.3.0/x64/bin/node path/to/script.js
    let sameCommand = recordedCommand.endsWith(actualCommand);
    if (!sameCommand) {
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
   * Sends the passed signal to the process (basically a shortcut for process.kill).
   *
   * @param {number | (keyof import("node:os").SignalConstants & string)} signal
   */
  kill = (signal) => process.kill(this.#pid, signal);

  /**
   * Creates the PID file and writes it to the filesystem.
   *
   * Does not start any process.
   *
   * @param {unknown} [ data ]
   * @returns {void}
   */
  write = (data) => {
    let [initiator, script] = process.argv;

    let json = JSON.stringify({
      pid: this.#pid,
      timestamp: ISODate(),
      command: `${initiator} ${script}`,
      data: data ?? "",
    });

    let folder = path.dirname(this.#pidFilePath);

    fsSync.mkdirSync(folder, { recursive: true });
    fsSync.writeFileSync(this.#pidFilePath, json);
  };

  /**
   * Deletes the associated pid file.
   *
   * Does not stop any started process.
   */
  delete = () => {
    if (this.exists) {
      fsSync.rmSync(this.#pidFilePath);
    }
  };

  get #recordedStartedTime() {
    let pidData = this.#readPidFile();

    return new Date(pidData.timestamp).getTime();
  }

  #readPidFile = () => {
    let pidData = this.fileContents;

    this.#pid = pidData.pid;

    return pidData;
  };
}
