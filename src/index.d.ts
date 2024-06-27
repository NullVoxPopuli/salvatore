export class DaemonPID {
  constructor(pidFile: string);

  /**
   ******************************
   * DATA ACCESS
   ******************************
   */

  /**
   * Retrieves the process-id of the referenced process.
   */
  pid(): number;

  /**
   * Reads the PID file's data from the filesystem.
   *
   */
  read(): any;

  /**
   * Returns true if the pid file has been written
   */
  exists(): boolean;

  /**
   * Retrieves the time in milliseconds the process referenced by the pid file has been running.
   */
  uptime(): number;

  /**
   * Retrieves a Date object representing the date and time the process referenced by the pid file was started.
   */
  started(): Date;

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
  write(): void;

  /**
   * Deletes the associated pid file.
   *
   * Does not stop any started process.
   */
  delete(): void;

  /**
   * Checks if the associated process is currently running.
   */
  running(): boolean;

  /**
  *  Sends the passed signal to the process (basically a shortcut for process.kill).
  */
  kill(signal: number): void;
}
