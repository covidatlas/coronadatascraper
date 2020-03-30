import cheerio from 'cheerio';
import csvParse from 'csv-parse';
import puppeteer from 'puppeteer';
import * as caching from './caching.js';
import * as datetime from '../datetime.js';
import log from '../log.js';
import { get } from './get.js';
import pdfParser from './pdf-parser.js';

// The core http-accessing function, `fetch.fetch`, needs to live in a separate module, `get`, in
// order to be mocked independently of the rest of these functions. Here we re-export `get` as
// `fetch.fetch` so no existing code has to change.
export const fetch = get;

const CHROME_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36';
const DEFAULT_VIEWPORT = { width: 1280, height: 800, isMobile: false };

const RESPONSE_TIMEOUT = 5000;
const READ_TIMEOUT = 30000;

/**
 * Load the webpage at the given URL and return a Cheerio object
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export const page = async (url, date, options = {}) => {
  const body = await get(url, 'html', date, options);

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
  log(url);
  const body = await get(url, 'json', date, options);

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
    const body = await get(url, 'csv', date, options);

    if (!body) {
      resolve(null);
    } else {
      csvParse(
        body,
        {
          delimiter: options.delimiter,
          columns: true
        },
        (err, output) => {
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

/**
 * Load and parse PDF from the given URL
 *
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} options customizable options:
 *  - alwaysRun: fetches from URL even if resource is in cache, defaults to false
 *  - disableSSL: disables SSL verification for this resource, should be avoided
 */
export const pdf = async (url, date, options) => {
  const body = await get(url, 'pdf', date, { ...options, toString: false, encoding: null });

  if (!body) {
    return null;
  }

  const data = await pdfParser(body);

  return data;
};

const fetchHeadless = async url => {
  log('  🤹‍♂️  Loading data for %s from server with a headless browser', url);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setUserAgent(CHROME_AGENT);
  await page.setViewport(DEFAULT_VIEWPORT);

  let tries = 0;
  while (tries < 5) {
    tries++;
    if (tries > 1) {
      // sleep a moment before retrying
      log(`  ⚠️  Retrying (${tries})...`);
      await new Promise(r => setTimeout(r, 2000));
    }

    try {
      const response = await page.goto(url, {
        timeout: READ_TIMEOUT,
        waitUntil: 'networkidle2'
      });

      // Some sort of internal socket error or other badness, retry
      if (response === null) {
        browser.close();
        continue;
      }

      // try again if we got an error code which might be recoverable
      if (response.status() >= 500) {
        console.error(`  ❌ Got error ${response.status()} (${response.statusText()}) trying to fetch ${url}`);
        continue;
      }

      // We got a good response, return it
      if (response.status() < 400) {
        await page.waitFor(RESPONSE_TIMEOUT);
        const html = await page.content();
        browser.close();
        return html;
      }

      // 400-499 means "not found", retrying is not likely to help
      if (response.status() < 500) {
        log.error(`  ❌ Got error ${response.status()} (${response.statusText()}) trying to fetch ${url}`);
        browser.close();
        return null;
      }
    } catch (err) {
      // Caught something, allow retry
      browser.close();
      log.error(`  ❌ Caught ${err.name} (${err.message}) trying to fetch ${url}`);
    }
  }

  log.error(`  ❌ Failed to fetch ${url} after ${tries} tries`);
  return null;
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

/**
 * Open the arcgis iframe and look in the Network/XHR tab for requests with Name of "0".
 *
 * Like this one:
 * https://services7.arcgis.com/4RQmZZ0yaZkGR1zy/arcgis/rest/services/COVID19_testsites_READ_ONLY/FeatureServer/0?f=json
 *
 * serverNumber is 7, from services7.arcgis.com
 * orgId is 4RQmZZ0yaZkGR1zy
 * layerName is COVID19_testsites_READ_ONLY
 */
export const getArcGISCSVURLFromOrgId = async function(serverNumber, orgId, layerName) {
  const layerMetadata = await json(
    `https://services${serverNumber}.arcgis.com/${orgId}/arcgis/rest/services/${layerName}/FeatureServer/0?f=json`
  );
  const { serviceItemId } = layerMetadata;
  return `https://opendata.arcgis.com/datasets/${serviceItemId}_0.csv`;
};

/**
 * Get the URL for the CSV data from an ArcGIS dashboard
 * @param {*} serverNumber the servern number, find this by looking at requests (i.e. https://services1.arcgis.com/ is serverNumber = 1)
 * @param {*} dashboardId the ID of the dashboard, as passed to the iframe that renders it (i.e. https://maps.arcgis.com/apps/opsdashboard/index.html#/ec4bffd48f7e495182226eee7962b422 is dashboardId = ec4bffd48f7e495182226eee7962b422)
 * @param {*} layerName the name of the layer to fetch data for, find this by examining requests
 */
export const getArcGISCSVURL = async function(serverNumber, dashboardId, layerName) {
  const dashboardManifest = await json(`https://maps.arcgis.com/sharing/rest/content/items/${dashboardId}?f=json`);
  const { orgId } = dashboardManifest;
  return getArcGISCSVURLFromOrgId(serverNumber, orgId, layerName);
};
