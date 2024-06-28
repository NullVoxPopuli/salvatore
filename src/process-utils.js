import { execSync } from "node:child_process";

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
    if (typeof e === "object" && e !== null && "code" in e) {
      // e.code will be ESRCH if the pid doesn't exist
      return e.code === "EPERM";
    }

    // Unexpected!
    throw e;
  }
}

/**
 * @param {number} pid
 */
export function processStartedAt(pid) {
  let buffer = execSync(`ps -o "lstart=" ${pid}`);
  let stdout = buffer.toString();

  return new Date(stdout);
}
