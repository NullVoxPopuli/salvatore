import { execSync } from 'node:child_process';

/**
 * @param {number} pid
 */
export function isRunning(pid) {
  try {
    // No Signal is sent, but error checking still occurs
    // https://unix.stackexchange.com/questions/169898/what-does-kill-0-do
    process.kill(pid, 0);
    return true;
  } catch (e) {
    if (isObject(e)) {
      if ('code' in e) {
        // e.code will be ESRCH if the pid doesn't exist
        return e.code === 'EPERM';
      }
    }

    // Unexpected!
    throw e;
  }
}

/**
 *
 * @param {number} pid
 * @param {number | string} signal
 */
export function killWithoutError(pid, signal) {
  try {
    process.kill(pid, signal);
  } catch (e) {
    if (isObject(e)) {
      if ('code' in e) {
        if (e.code === 'ESRCH') {
          return;
        }
      }
    }
    throw e;
  }
}

/**
 * @param {number} pid
 * @returns {Date}
 */
export function processStartedAt(pid) {
  let buffer = execSync(`ps -o "lstart=" ${pid}`);
  let stdout = buffer.toString();

  return new Date(stdout);
}

/**
 *
 * @param {unknown} x
 * @returns {x is NonNullable<object>}
 */
function isObject(x) {
  return typeof x === 'object' && x !== null;
}
