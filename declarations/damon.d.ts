/**
 * @typedef {object} Options
 * @property {string} pidFilePath
 * @property {string} [ runWith ]
 * @property {number} [ timeout ]
 * @property {string} [logFile]
 * @property {() => boolean} [ restartWhen ]
 */
/**
 * Allows managing a js script as a daemon
 */
export class Daemon {
    /**
     * @param {string} scriptPath
     * @param {Options} options
     */
    constructor(scriptPath: string, options: Options);
    /**
     * Ensures a process has started at the given script path.
     *
     * Will error if the pid file did not get created or if the process didn't start or exited too early.
     *
     * @returns {Promise<Daemon['info']>}
     */
    ensureStarted: () => Promise<Daemon["info"]>;
    /**
     * Stop the daemon if it's running.
     *
     * Note that it is the daemon's responsibility to clean up the pidfile.
     */
    stop: () => Promise<void>;
    /**
     * Get information about the Daemon, regardless of if it's running or not.
     *
     * @returns {{
     *   pid: number;
     *   data: any;
     *   command: string;
     *   startedAt: Date | null;
     *   isRunning: boolean;
     * }}
     */
    get info(): {
        pid: number;
        data: any;
        command: string;
        startedAt: Date | null;
        isRunning: boolean;
    };
    #private;
}
export type Options = {
    pidFilePath: string;
    runWith?: string;
    timeout?: number;
    logFile?: string;
    restartWhen?: () => boolean;
};
