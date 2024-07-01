/**
 *  @param {() => boolean } conditionFn
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

  await Promise.race([
    new Promise((_, reject) => {
      errorTimeout = setTimeout(() => {
        let msg =
          typeof rejectMessage === 'function' ? rejectMessage() : rejectMessage;
        reject(msg);
      }, timeout);
    }),
    new Promise((resolve) => {
      let interval = setInterval(() => {
        let cond = conditionFn();
        if (cond) {
          clearInterval(interval);
          clearTimeout(errorTimeout);
          resolve(null);
        }
      }, checkEvery);
    }),
  ]);
}
