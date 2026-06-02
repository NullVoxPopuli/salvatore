/**
 *  @param {(() => boolean) | (() => Promise<boolean>)} conditionFn
 *  @param {string | (() => string)} rejectMessage
 *  @param {number} timeout
 *  @param {number} [checkEvery]
 */
export function waitFor(conditionFn: (() => boolean) | (() => Promise<boolean>), rejectMessage: string | (() => string), timeout: number, checkEvery?: number | undefined): Promise<void>;
