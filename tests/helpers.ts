/**
 * One second is how long we allow for mismatch between
 * how Node manages time and how the OS manages time
 * (as well as the difference between when a daemon is expected to wrie
 *  the starttime to the pid file)
 */
export function waitOneSecond() {
  return wait(1_000);
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
