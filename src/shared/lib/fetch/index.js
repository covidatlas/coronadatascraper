import cheerio from 'cheerio';
import csvParse from 'csv-parse';
import { PdfReader } from 'pdfreader';
import puppeteer from 'puppeteer';
import * as caching from './caching.js';
import * as datetime from '../datetime.js';
import { get } from './get.js';

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
  console.log(url);
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
 *  - rowTolerance: allowed variance in the y-axis. Allows elements with small discrepancies in their y
 *                  value to be considered as being part of the same row, defaults to 1 unit
 */
export const pdf = async (url, date, options) => {
  return new Promise(async (resolve, reject) => {
    const body = await get(url, 'pdf', date, { ...options, toString: false, encoding: null });

    if (!body) {
      resolve(null);
      return;
    }

    const data = [];

    let currentPage = 0;

    new PdfReader().parseBuffer(body, (err, item) => {
      if (err) {
        reject(err);
      } else if (!item) {
        data.push(null);
        resolve(data);
      } else if (item.page) {
        currentPage += 1;
      } else if (item.text) {
        data.push({ page: currentPage, x: item.x, y: item.y, w: item.w, text: item.text.trim() });
      }
    });
  });
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
    console.log(`  ❌ Got error ${response._status} trying to fetch ${url}`);
    browser.close();
    return null;
  } catch (err) {
    browser.close();

    if (err.name === 'TimeoutError') {
      console.log(`  ❌ Timed out trying to fetch ${url}`);
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

/**
 * Find data source id for a widget from the manifest
 *
 * @param {*} dashboardId the ID of the dashboard
 * @param {*} widgetName the name of the widget in the manifest
 *
 *
 */
const findArcGISFeatureDataSourceIDByName = function(manifest, widgetName) {
  for (const w of manifest.widgets) {
    if (w.name === widgetName) {
      if (w.datasets.length !== 1) throw new Error('Expect only one dataset');
      return w.datasets[0].dataSource.itemId;
    }
  }
  throw new Error('Cannot find widget');
};

/**
 * Get the URL for the CSV data from an ArcGIS dashboard
 * @param {*} dashboardId the ID of the dashboard
 * @param {*} widgetName the name of the widget in the manifest
 *
 * The dashboardId is passed to the iframe that renders URL.  For example,
 *   If you have https://maps.arcgis.com/apps/opsdashboard/index.html#/ec4bffd48f7e495182226eee7962b422 is
 *   dashboardId = ec4bffd48f7e495182226eee7962b422
 *
 * To get the widgetName, load the manifest, reformat it, and search for a widget that has a caption
 * that matches the title of table shown in the UI.  The caption is HTML but some places put images
 * instead of text so we should the name when scraping.  For example,
 *    https://maps.arcgis.com/sharing/rest/content/items/ec4bffd48f7e495182226eee7962b422/data?f=json
 * has a widget named 'COVID-19 Cases by County' which has a datasourceId = 24f4fcf164ad4b4280f08c8939dd5dc7
 *
 *
 */
export const getArcGISCSVURLByWidgetName = async function(dashboardId, widgetName) {
  // 1. get the full manifest
  const manifestUrl = `https://maps.arcgis.com/sharing/rest/content/items/${dashboardId}/data?f=json`;
  const dashboardManifestFull = await json(manifestUrl);

  // 2. find the datasourceID for the target
  const datasourceId = findArcGISFeatureDataSourceIDByName(dashboardManifestFull, widgetName);
  if (!datasourceId) throw new Error('Missing datasourceId');

  // 3. get the orgID, layerName, and url from the data source
  const sourceInfo = await json(`https://maps.arcgis.com/sharing/rest/content/items/${datasourceId}?f=json`);
  const xorgId = sourceInfo.orgId;
  const layerName = sourceInfo.name;
  const serverName = sourceInfo.url.substr(0, 28);

  // error checks...
  if (!xorgId) throw new Error('Missing orgID');
  if (!layerName) throw new Error('Missing layerName');
  if (!serverName.endsWith('.com')) throw new Error('Could not parse server name');

  // 4. get the serviceItemId for the layer.
  const layerMetadata = await json(`${serverName}/${xorgId}/arcgis/rest/services/${layerName}/FeatureServer/0?f=json`);
  const { serviceItemId } = layerMetadata;

  // 5. build the URL for the content
  return `https://opendata.arcgis.com/datasets/${serviceItemId}_0.csv`;
};
