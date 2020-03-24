/* eslint-disable import/prefer-default-export */

import needle from 'needle';
import * as caching from './caching.js';
import * as datetime from './datetime.js';

const CHROME_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36';

const OPEN_TIMEOUT = 5000;
const RESPONSE_TIMEOUT = 5000;
const READ_TIMEOUT = 30000;

// Spoof Chrome, just in case
needle.defaults({
  parse_response: false,
  user_agent: CHROME_AGENT,
  open_timeout: OPEN_TIMEOUT, // Maximum time to wait to establish a connection
  response_timeout: RESPONSE_TIMEOUT, // Maximum time to wait for a response
  read_timeout: READ_TIMEOUT // Maximum time to wait for data to transfer
});

/**
 * Fetch whatever is at the provided URL. Use cached version if available.
 * @param {*} url URL of the resource
 * @param {*} type type of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 *  - toString: returns data as a string instead of buffer, defaults to true
 *  - encoding: encoding to use when retrieving files from cache, defaults to utf8
 */
export const get = async (url, type, date = process.env.SCRAPE_DATE || datetime.getYYYYMD(), options = {}) => {
  const { alwaysRun, disableSSL, toString, encoding } = {
    alwaysRun: false,
    disableSSL: false,
    toString: true,
    encoding: 'utf8',
    ...options
  };

  const cachedBody = await caching.getCachedFile(url, type, date, encoding);

  if (cachedBody === caching.CACHE_MISS || alwaysRun) {
    console.log('  🚦  Loading data for %s from server', url);

    if (disableSSL) {
      console.log('  ⚠️  SSL disabled for this resource');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const response = await needle('get', url);

    if (disableSSL) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }

    if (response.statusCode < 400) {
      const fetchedBody = toString ? response.body.toString() : response.body;
      await caching.saveFileToCache(url, type, date, fetchedBody);
      return fetchedBody;
    }
    console.log(`  ❌ Got error ${response.statusCode} trying to fetch ${url}`);
    return null;
  }
  return cachedBody;
};
