import cheerio from 'cheerio';
import needle from 'needle';
import path from 'path';
import csvParse from 'csv-parse';
import puppeteer from 'puppeteer';
import * as fs from './fs.js';
import * as transform from './transform.js';
import * as datetime from './datetime.js';

// Spoof Chrome, just in case
needle.defaults({
  parse_response: false,
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
  open_timeout: 5000, // Maximum time to wait to establish a connection
  response_timeout: 5000, // Maximum time to wait for a response
  read_timeout: 30000 // Maximum time to wait for data to transfer
});

// Ignore TLS failures (such as Texas DHHS)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

/*
  Fetch whatever is at the given URL (cached)
*/
async function fetch(url, type, date) {
  let cachePath;
  if (date === false) {
    // This data probably has its own timeseries in it
    // Use local cache, assumed to be recent
    cachePath = 'cache';
  } else {
    if (!date && process.env['SCRAPE_DATE']) {
      date = process.env['SCRAPE_DATE'];
    } else if (!date) {
      date = datetime.getDate();
    }
    cachePath = path.join('coronadatascraper-cache', datetime.getYYYYMMDD(date));
  }

  let urlHash = transform.hash(url);
  let extension = type || path.extname(url) || 'txt';

  let filePath = path.join(cachePath, `${urlHash}.${extension}`);
  let body;

  await fs.ensureDir(cachePath);

  if (await fs.exists(filePath)) {
    console.log('  ⚡️ Loading data for %s from %s', url, filePath);
    body = await fs.readFile(filePath);
  } else if (date && datetime.isDateBefore(date, datetime.getDate())) {
    console.log('  ⚠️  Cannot go back in time to get %s, no cache present', url);
    body = '';
  } else {
    console.log('  🚦  Loading data for %s from server', url);
    let response = await needle('get', url);
    body = response.body.toString();
    await fs.writeFile(filePath, body);
  }
  return body;
}

/*
  Load the webpage at the given URL and return a Cheerio object
*/
async function page(url, date) {
  let body = await fetch(url, 'html', date);

  if (body === '') {
    return null;
  }

  return cheerio.load(body);
}

/*
  Load and parse JSON from the given URL
*/
async function json(url, date) {
  let body = await fetch(url, 'json', date);

  return JSON.parse(body);
}

/*
  Load and parse CSV from the given URL
*/
function csv(url, date) {
  return new Promise(async (resolve, reject) => {
    let body = await fetch(url, 'csv', date);

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
  Launch Puppeteer, go to the URL and return the browser
*/
async function headless(url, date) {
  // todo: figure out how to read from cache
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  return { browser, page };
}

export { fetch, page, json, csv, headless };
