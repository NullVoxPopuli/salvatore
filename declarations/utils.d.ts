/**
 *  @param {() => boolean } conditionFn
 *  @param {string | (() => string)} rejectMessage
 *  @param {number} timeout
 *  @param {number} [checkEvery]
 */
export function waitFor(conditionFn: () => boolean, rejectMessage: string | (() => string), timeout: number, checkEvery?: number | undefined): Promise<void>;
