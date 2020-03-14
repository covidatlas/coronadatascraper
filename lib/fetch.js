import cheerio from 'cheerio';
import needle from 'needle';
import path from 'path';
import crypto from 'crypto';
import * as fs from './fs.js';

// Spoof Chrome, just in case
needle.defaults({
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
});

// Ignore TLS failures (such as Texas DHHS)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

/*
  MD5 hash a given URL
*/
function hash(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/*
  Fetch whatever is at the given URL (cached)
*/
async function fetch(url) {
  let urlHash = hash(url);
  let filePath = path.join('cache', `${urlHash}.html`);
  let body;
  if (await fs.exists(filePath)) {
    console.log('✅ Loading data for %s from cache %s.html', url, urlHash);
    body = await fs.readFile(filePath);
  }
  else {
    console.log('⚠️  Loading data for %s from server', url);
    let response = await needle('get', url);
    body = response.body.toString();
    await fs.writeFile(filePath, body);
  }
  return body;
}

/*
  Load the webpage at the given URL and return a Cheerio object
*/
async function page(url) {
  let body = await fetch(url);

  return cheerio.load(body);
}

/*
  Load and parse JSON from the given URL
*/
async function json(url) {
  let body = await fetch(url);

  return JSON.parse(body);
}

export { page, json };
