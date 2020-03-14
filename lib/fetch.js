import cheerio from 'cheerio';
import needle from 'needle';
import path from 'path';
import csvParse from 'csv-parse';
import * as fs from './fs.js';
import * as transform from './transform.js';

// Spoof Chrome, just in case
needle.defaults({
  parse_response: false,
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
});

// Ignore TLS failures (such as Texas DHHS)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

/*
  Fetch whatever is at the given URL (cached)
*/
async function fetch(url, type, date) {
  if (!date && process.env['SCRAPE_DATE']) {
    date = process.env['SCRAPE_DATE'];
  }

  let urlHash = transform.hash(url);
  let extension = type || path.extname(url) || 'txt';

  let cachePath = path.join('coronadatascraper-cache', date);
  let filePath = path.join(cachePath, `${urlHash}.${extension}`);
  let body;
  if (await fs.exists(filePath)) {
    console.log('  ⚡️ Loading data for %s from cache/%s.%s', url, urlHash, extension);
    body = await fs.readFile(filePath);
  }
  else {
    console.log('  🚦  Loading data for %s from server', url);
    let response = await needle('get', url);
    body = response.body.toString();
    await fs.ensureDir(cachePath);
    await fs.writeFile(filePath, body);
  }
  return body;
}

/*
  Load the webpage at the given URL and return a Cheerio object
*/
async function page(url) {
  let body = await fetch(url, 'html');

  return cheerio.load(body);
}

/*
  Load and parse JSON from the given URL
*/
async function json(url) {
  let body = await fetch(url, 'json');

  return JSON.parse(body);
}

/*
  Load and parse CSV from the given URL
*/
function csv(url) {
  return new Promise(async (resolve, reject) => {
    let body = await fetch(url, 'csv');

    csvParse(body, {
      columns: true
    }, function(err, output) {
      if (err) {
        reject(err);
      }
      else {
        resolve(output);
      }
    });
  });
}

export { fetch, page, json, csv };
