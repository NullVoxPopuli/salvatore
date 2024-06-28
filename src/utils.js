/**
 *  @param {() => boolean } conditionFn
 *  @param {string} rejectMessage
 *  @param {number} timeout
 *  @param {number} [checkEvery]
 */
export async function waitFor(
  conditionFn,
  rejectMessage,
  timeout,
  checkEvery = 10 /* ms */,
) {
  await Promise.race([
    new Promise((_, reject) => {
      setTimeout(() => reject(rejectMessage), timeout);
    }),
    new Promise((resolve) => {
      let interval = setInterval(() => {
        let cond = conditionFn();
        if (cond) {
          clearInterval(interval);
          resolve(null);
        }
      }, checkEvery);
    }),
  ]);
}
