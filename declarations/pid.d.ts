/**
 * Implements a pid file management class capable of monitoring processes using
 * pid files stored at known locations. Designed for use in daemonized processes.
 */
export class PidFile {
    /**
     * The path of the Pid file
     *
     * @param {string} pidFilePath
     */
    constructor(pidFilePath: string);
    /**
     * Retrieves the process-id of the referenced process.
     */
    get pid(): number;
    /**
     * Returns true if the pid file has been written
     */
    get exists(): boolean;
    /**
     * Reads the PID file's data from the filesystem.
     */
    get data(): any;
    /**
     * Retrieves the parsed contents of the pid file with no checking or processing.
     *
     * @returns {{
     *  pid: number;
     *  timestamp: string;
     *  data: any;
     *  command: string;
     * }}
     */
    get fileContents(): {
        pid: number;
        timestamp: string;
        data: any;
        command: string;
    };
    /**
     * Retrieves the time in milliseconds the process referenced by the pid file has been running.
     *
     * @returns {number}
     */
    get uptime(): number;
    /**
     * The command that the PID is related to.
     * This, combined with startedAt help deter
     *
     * @returns {string}
     */
    get command(): string;
    /**
     * Retrieves a Date object representing the date and time the process referenced by the pid file was started.
     *
     * @returns {Date}
     */
    get startedAt(): Date;
    /**
     * if the associated process is currently running.
     *
     * @returns {boolean}
     */
    get isRunning(): boolean;
    /**
     * Sends the passed signal to the process (basically a shortcut for process.kill).
     *
     * @param {number | (keyof import("node:os").SignalConstants & string)} signal
     */
    kill: (signal: number | (keyof import("node:os").SignalConstants & string)) => true;
    /**
     * Creates the PID file and writes it to the filesystem.
     *
     * Does not start any process.
     *
     * @param {unknown} [ data ]
     * @returns {void}
     */
    write: (data?: unknown) => void;
    /**
     * Deletes the associated pid file.
     *
     * Does not stop any started process.
     */
    delete: () => void;
    #private;
}
