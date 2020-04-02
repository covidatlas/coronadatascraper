import puppeteer from 'puppeteer';
import cheerio from 'cheerio';
import * as caching from '../caching/index.js';
import datetime from '../../datetime/index.js';
import log from '../../log.js';

const CHROME_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36';
const DEFAULT_VIEWPORT = { width: 1280, height: 800, isMobile: false };

const RESPONSE_TIMEOUT = 5000;
const READ_TIMEOUT = 30000;

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
        log.error(`  ❌ Got error ${response.status()} (${response.statusText()}) trying to fetch ${url}`);
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

const dateFallback = process.env.NEW_CACHE
  ? // FIXME once find-features can move the crawler, make newcache `iso`, not `old`
    datetime.scrapeDate() || datetime.old.getYYYYMMDD() // ← make `iso`, not `old`
  : datetime.old.scrapeDate() || datetime.old.getYYYYMD();

/**
 * Fetch whatever is at the provided URL in headless mode with Pupeteer. Use cached version if available.
 * @param {*} url URL of the resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} alwaysRun fetches from URL even if resource is in cache, defaults to false
 */
export default async function headless(url, date = dateFallback, options = {}) {
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
}
