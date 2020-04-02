import pdfParser from './pdf-parser.js';
import get from './get.js';

/**
 * Load and parse PDF from the given URL
 *
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export default async function pdf(url, date, options) {
  const body = await get(url, 'pdf', date, { ...options, toString: false, encoding: null });

  if (!body) {
    return null;
  }

  const data = await pdfParser(body);

  return data;
}
