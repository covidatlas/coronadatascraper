import cheerio from 'cheerio';
import needle from 'needle';
import path from 'path';
import crypto from 'crypto';
import * as fs from './fs.js';

needle.defaults({
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36'
});

function hash(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/*
  Load the given URL and return a Cheerio object
*/
async function load(url) {
  let urlHash = hash(url);
  let filePath = path.join('cache', `${urlHash}.html`);
  let body;
  if (await fs.exists(filePath)) {
    console.log('✅ Loading data for %s from cache %s', url, urlHash);
    body = await fs.readFile(filePath);
  }
  else {
    console.log('⚠️  Loading data for %s from server', url);
    let response = await needle('get', url);
    body = response.body.toString();
    await fs.writeFile(filePath, body);
  }

  const $ = cheerio.load(body);
  return $;
}

export default load;
