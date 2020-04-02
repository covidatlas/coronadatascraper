import cheerio from 'cheerio';
import get from './get.js';

/**
 * Load the webpage at the given URL and return a Cheerio object
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export default async function page(url, date, options = {}) {
  const body = await get(url, 'html', date, options);

  if (!body) {
    return null;
  }
  return cheerio.load(body);
}
