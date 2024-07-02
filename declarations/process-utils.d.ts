/**
 * @param {number} pid
 */
export function isRunning(pid: number): boolean;
/**
 * @param {number} pid
 * @returns {Date}
 */
export function processStartedAt(pid: number): Date;
/**
 * @param {number} pid
 * @returns {string}
 */
export function processCommand(pid: number): string;
