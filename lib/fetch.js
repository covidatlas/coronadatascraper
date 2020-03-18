import cheerio from 'cheerio';
import needle from 'needle';
import csvParse from 'csv-parse';
import puppeteer from 'puppeteer';

import * as datetime from './datetime.js';
import * as caching from './caching.js';

// Spoof Chrome, just in case
needle.defaults({
  parse_response: false,
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
  open_timeout: 5000, // Maximum time to wait to establish a connection
  response_timeout: 5000, // Maximum time to wait for a response
  read_timeout: 30000 // Maximum time to wait for data to transfer
});

/*
  Fetch whatever is at the given URL (cached)
*/
async function fetch(url, type, date) {
  if (date !== false) {
    if (!date && process.env.SCRAPE_DATE) {
      date = process.env.SCRAPE_DATE;
    } else if (!date) {
      date = datetime.getYYYYMD();
    }
  }

  let body = await caching.getCachedFile(url, type, date);

  if (body === caching.CACHE_MISS) {
    console.log('  🚦  Loading data for %s from server', url);
    const response = await needle('get', url);
    body = response.body.toString();
    await caching.saveFileToCache(url, type, date, body);
    return body;
  }

  return body;
}

/*
  Load the webpage at the given URL and return a Cheerio object
*/
async function page(url, date) {
  const body = await fetch(url, 'html', date);

  if (!body) {
    return null;
  }

  return cheerio.load(body);
}

/*
  Load and parse JSON from the given URL
*/
async function json(url, date) {
  const body = await fetch(url, 'json', date);

  if (!body) {
    return null;
  }

  return JSON.parse(body);
}

/*
  Load and parse CSV from the given URL
*/
function csv(url, date) {
  return new Promise(async (resolve, reject) => {
    const body = await fetch(url, 'csv', date);

    if (!body) {
      resolve(null);
      return;
    }

    csvParse(
      body,
      {
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
  });
}

/*
  Launch Puppeteer, go to the URL and return a Cheerio object

  Pass alwaysRun=true to run Puppeteer again even if cached
*/
async function headless(url, date, alwaysRun) {
  if (date !== false) {
    if (!date && process.env.SCRAPE_DATE) {
      date = process.env.SCRAPE_DATE;
    } else if (!date) {
      date = datetime.getYYYYMD();
    }
  }

  let html = await caching.getCachedFile(url, 'html', date);
  if (html === caching.CACHE_MISS) {
    console.log('  🚦  Loading data for %s from server with a headless browser', url);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800, isMobile: false });

    let response;
    try {
      response = await page.goto(url, {
        timeout: 25000,
        waitUntil: 'networkidle2'
      });
    } catch (err) {
      browser.close();
      if (err.name === 'TimeoutError') {
        console.log('  ❌ Timed out trying to fetch %s headless', url);
        return null;
      }
      throw err;
    }

    if (response._status < 400) {
      await page.waitFor(3000);
      html = await page.content();
      browser.close();
      await caching.saveFileToCache(url, 'html', date, html);
    } else {
      console.log('  ❌ Got error %d trying to fetch %s headless', response._status, url);
      browser.close();
      return null;
    }
  } else if (alwaysRun) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.setContent(html.toString());
    await page.waitFor(3000);
    html = await page.content();
    browser.close();
  }

  const $ = await cheerio.load(html);
  return $;
}

export { fetch, page, json, csv, headless };
