/**
 * Some libraries in this project have gone rogue and decided to include timeouts,
 * (looking at you, geo-tz) meaning Node will not exit after the scraper has finished running. This file
 * allows us to clear all timeouts on exit.
 */

const globalObject = global;

let allTimeoutIds = [];
const originalTimeout = setTimeout;

// Use a function instead of () => to ensure this can be overridden.
globalObject.setTimeout = function(callback, timeInMS) {
  const timeoutId = originalTimeout(callback, timeInMS);
  allTimeoutIds.push(timeoutId);
};

const originalClearTimeout = clearTimeout;
globalObject.clearTimeout = function(timeoutId) {
  allTimeoutIds = allTimeoutIds.filter(id => id !== timeoutId);
  originalClearTimeout(timeoutId);
};

/**
 * Clears all timeouts. Should only be called on exit.
 */
export default () => {
  for (const id of allTimeoutIds) {
    clearTimeout(id);
  }
};
