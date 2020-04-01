import { parse } from './parse.js';

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than the second date
 */
export const dateIsBefore = (a, b) => parse(a) < parse(b);

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than or equal to the second date
 */
export const dateIsBeforeOrEqualTo = (a, b) => parse(a) <= parse(b);
