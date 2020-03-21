import cheerio from 'cheerio';
import needle from 'needle';
import csvParse from 'csv-parse';
import puppeteer from 'puppeteer';

import * as datetime from './datetime.js';
import * as caching from './caching.js';

const CHROME_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36';
const DEFAULT_VIEWPORT = { width: 1280, height: 800, isMobile: false };

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
 */
export const fetch = async (url, type, date = process.env.SCRAPE_DATE || datetime.getYYYYMD(), options = {}) => {
  const { alwaysRun, disableSSL } = { alwaysRun: false, disableSSL: false, ...options };

  const cachedBody = await caching.getCachedFile(url, type, date);

  if (cachedBody === caching.CACHE_MISS || alwaysRun) {
    console.log('  🚦  Loading data for %s from server', url);

    if (disableSSL) {
      console.log('  ⚠️  SSL disabled for this resource');
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const response = await needle('get', url);
    const fetchedBody = response.body.toString();

    await caching.saveFileToCache(url, type, date, fetchedBody);

    if (disableSSL) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }

    return fetchedBody;
  }
  return cachedBody;
};

/**
 * Load the webpage at the given URL and return a Cheerio object
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export const page = async (url, date, options = {}) => {
  const body = await fetch(url, 'html', date, options);

  if (!body) {
    return null;
  }
  return cheerio.load(body);
};

/**
 * Load and parse JSON from the given URL
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export const json = async (url, date, options = {}) => {
  const body = await fetch(url, 'json', date, options);

  if (!body) {
    return null;
  }
  return JSON.parse(body);
};

/**
 * Load and parse CSV from the given URL
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 *  - delimiter: the delimiter to use (default is ,)
 */
export const csv = async (url, date, options = {}) => {
  return new Promise(async (resolve, reject) => {
    const body = await fetch(url, 'csv', date, options);

    if (!body) {
      resolve(null);
    } else {
      csvParse(
        body,
        {
          delimiter: options.delimiter,
          columns: true
        },
        function(err, output) {
          if (err) {
            reject(err);
          } else {
            resolve(output);
          }
        }
      );
    }
  });
};

/**
 * Load and parse TSV from the given URL
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export const tsv = async (url, date, options = {}) => {
  options.delimiter = '\t';
  return csv(url, date, options);
};

const fetchHeadless = async url => {
  console.log('  🤹‍♂️  Loading data for %s from server with a headless browser', url);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent(CHROME_AGENT);
  await page.setViewport(DEFAULT_VIEWPORT);

  try {
    const response = await page.goto(url, {
      timeout: READ_TIMEOUT,
      waitUntil: 'networkidle2'
    });

    if (response._status < 400) {
      await page.waitFor(RESPONSE_TIMEOUT);
      const html = await page.content();
      browser.close();
      return html;
    }
    console.log('  ❌ Got error %d trying to fetch %s headless', response._status, url);
    browser.close();
    return null;
  } catch (err) {
    browser.close();

    if (err.name === 'TimeoutError') {
      console.log('  ❌ Timed out trying to fetch %s headless', url);
      return null;
    }
    throw err;
  }
};

/**
 * Fetch whatever is at the provided URL in headless mode with Pupeteer. Use cached version if available.
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} alwaysRun fetches from URL even if resource is in cache, defaults to false
 */
export const headless = async (url, date = process.env.SCRAPE_DATE || datetime.getYYYYMD(), options = {}) => {
  const { alwaysRun } = { alwaysRun: false, disableSSL: false, ...options };

  const cachedBody = await caching.getCachedFile(url, 'html', date);

  if (cachedBody === caching.CACHE_MISS || alwaysRun) {
    const fetchedBody = await fetchHeadless(url);
    await caching.saveFileToCache(url, 'html', date, fetchedBody);

    const $ = await cheerio.load(fetchedBody);
    return $;
  }
  const $ = await cheerio.load(cachedBody);
  return $;
};
