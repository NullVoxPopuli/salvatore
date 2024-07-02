import type { SignalConstants } from 'node:os';

export class PidFile {
  constructor(pidFile: string);

  /**
   ******************************
   * DATA ACCESS
   ******************************
   */

  /**
   * Retrieves the parsed contents of the pid file with no checking or processing.
   */
  get fileContents(): {
    pid: number;
    timestamp: string;
    data: any;
    command: string;
  };

  /**
   * Retrieves the process-id of the referenced process.
   */
  get pid(): number;

  /**
   * Reads the PID file's data from the filesystem.
   *
   */
  get data(): any;

  /**
   * Returns true if the pid file has been written
   */
  get exists(): boolean;

  /**
   * Retrieves the time in milliseconds the process referenced by the pid file has been running.
   */
  get uptime(): number;

  /**
   * Retrieves a Date object representing the date and time the process referenced by the pid file was started.
   */
  get startedAt(): Date;

  /**
   * if the associated process is currently running.
   */
  get isRunning(): boolean;

  /**
   * The command that the PID is related to.
   * This, combined with startedAt help deter
   */
  get command(): string;

  /**
   ******************************
   * MANAGEMENT
   ******************************
   */

  /**
   * Creates the PID file and writes it to the filesystem.
   *
   * Does not start any process.
   */
  write(data?: unknown): void;

  /**
   * Deletes the associated pid file.
   *
   * Does not stop any started process.
   */
  delete(): void;

  /**
   *  Sends the passed signal to the process (basically a shortcut for process.kill).
   */
  kill(signal: number | (keyof SignalConstants & string)): void;
}
