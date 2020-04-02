import log from '../../log.js';
import get from './get.js';

/**
 * Load and parse JSON from the given URL
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export default async function json(url, date, options = {}) {
  log(url);
  const body = await get(url, 'json', date, options);

  if (!body) {
    return null;
  }
  return JSON.parse(body);
}
