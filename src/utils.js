/**
 * @param {number} ms duration to sleep
 */
async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 *  @param {() => boolean | (() => Promise<boolean>)} conditionFn
 *  @param {string | (() => string)} rejectMessage
 *  @param {number} timeout
 *  @param {number} [checkEvery]
 */
export async function waitFor(
  conditionFn,
  rejectMessage,
  timeout,
  checkEvery = 10 /* ms */
) {
  /** @type {ReturnType<typeof setTimeout>} */
  let errorTimeout;

  let waiting = true;

  await Promise.race([
    /**
     * This rejecting promise is really only needed if
     * the first iteration of the while loop in the success branch
     * never finishes.
     */
    new Promise((_, reject) => {
      errorTimeout = setTimeout(() => {
        let msg =
          typeof rejectMessage === 'function' ? rejectMessage() : rejectMessage;
        waiting = false;
        reject(msg);
      }, timeout);
    }),
    new Promise(async (resolve) => {
      /**
       * while loop here is to only check the conditionFn
       * as fast as the OS will let us.
       *
       * (previously this used setInterval, which could possibly become problematic if the conditionFn
       *  took longer to run than the checkEvery ms time)
       */
      while (waiting) {
        let cond = await conditionFn();
        if (cond) {
          waiting = false;
          clearTimeout(errorTimeout);
          resolve(null);
          break;
        }

        await sleep(checkEvery);
      }
    }),
  ]);
}
