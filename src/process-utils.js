import { execSync } from 'node:child_process';
import os from 'node:os';

/**
 * Mac has a special version of `ps` and does not take all the same arguments.
 */
const isMac = os.platform() === 'darwin';

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
 * @param {number} pid
 * @returns {Date}
 */
export function processStartedAt(pid) {
  let stdout = runSync(`ps -o "lstart=" ${pid}`);

  return new Date(stdout);
}

/**
 * @param {number} pid
 * @returns {string}
 */
export function processCommand(pid) {
  return isMac
    ? runSync(`ps -p $pid -o%args=`)
    : runSync(`ps -p ${pid} -o args --no-headers`);
}

/**
 * @param {string} command
 * @returns {string}
 */
function runSync(command) {
  let buffer = execSync(command);
  let stdout = buffer.toString();
  return stdout;
}

/**
 *
 * @param {unknown} x
 * @returns {x is NonNullable<object>}
 */
function isObject(x) {
  return typeof x === 'object' && x !== null;
}
