import { PidFile } from './pid.js';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import fsSync from 'node:fs';
import { waitFor } from './utils.js';

/**
 * @typedef {object} Options
 * @property {string} pidFilePath
 * @property {string} [ runWith ]
 * @property {number} [ timeout ]
 * @property {() => boolean} [ restartWhen ]
 */

/**
 * Allows managing a js script as a daemon
 */
export class Daemon {
  #scriptPath;
  #pidFilePath;
  #runWith;
  #pidFile;
  #timeout;
  #restartWhen;

  /**
   * @param {string} scriptPath
   * @param {Options} options
   */
  constructor(scriptPath, options) {
    this.#scriptPath = scriptPath;

    this.#pidFile = new PidFile(options.pidFilePath);
    this.#pidFilePath = options.pidFilePath;
    this.#runWith = options.runWith || process.argv0;
    this.#timeout = options.timeout ?? 2_000;
    this.#restartWhen = options.restartWhen;
  }

  /**
   * Ensures a process has started at the given script path.
   *
   * Will error if the pid file did not get created or if the process didn't start or exited too early.
   *
   * @returns {Promise<{ pid: number, data: unknown }>}
   */
  ensureStarted = async () => {
    let forceRestart = this.#restartWhen?.() ?? false;

    if (!forceRestart && this.#pidFile.exists && this.#pidFile.isRunning) {
      // We don't need to start anything
      return this.info;
    }

    if (forceRestart) {
      // Kill the pre-existing PID, if it exists
      this.#pidFile.kill(9);
    }

    let theDaemon = spawn(this.#runWith, [this.#scriptPath], {
      detached: true,
      // stdio: "ignore",
      stdio: 'inherit',
    });

    /**
     * Required to allow the daemon to keep running
     * when the launcher-process exits
     */
    theDaemon.unref();

    /**
     * Wait for the pidFile to be written, error if it doesn't
     */
    await waitFor(
      () => fsSync.existsSync(this.#pidFilePath),
      `Timed out waiting for ${this.#pidFilePath} to exist. It's possible the process prematurely exited and cleaned up after itself.`,
      this.#timeout
    );

    return this.info;
  };

  stop = async () => {
    assert(
      this.info.pid !== process.pid,
      `Unexpectedly, the Daemon's PID is our pid. This means we can't stop the process without stopping ourselves`
    );

    if (this.#pidFile.isRunning) {
      this.#pidFile.kill('SIGKILL');
    }

    await waitFor(
      () => !fsSync.existsSync(this.#pidFilePath),
      () => {
        let stillRunning = '';
        if (this.#pidFile.isRunning) {
          stillRunning = `Process is @ ${this.#pidFile.pid} and is still running (Uptime: ${this.#pidFile.uptime}ms).`;
        }
        return (
          `Timed out waiting for ${this.#pidFilePath} to be deleted. ` +
          `It is the daemonized process' responsibility to delete this file.` +
          ` ${stillRunning}`
        );
      },
      this.#timeout
    );
  };

  get info() {
    let isRunning = this.#pidFile.isRunning;
    let startedAt = isRunning ? this.#pidFile.startedAt : null;

    return {
      pid: this.#pidFile.pid,
      data: this.#pidFile.data,
      startedAt,
      isRunning,
    };
  }
}
