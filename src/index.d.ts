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
   * Retrieves the time in seconds the process referenced by the pid file has been running.
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

  /**
  * Creates a monitoring interval which periodically (every five seconds by default) 
  * checks that the associated process is still running. 
  *
  * This behaves similar to setInterval, in that the callback will be called every interval-time.
  * The callback will be passed an object with a property, `isRunning` that'll be either true or false.
  * If the value is ever false.
  */
  monitor(callback: (state: { isRunning: boolean }) => void, interval = 5000): void;

  /**
   * Stops monitoring the associated process.
   */
  unmonitor(): void;
}
