const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const fs = require('fs');
const path = require('path');

const fetch = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'index.js'));
const caching = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'caching.js'));
const datetime = imports(join(process.cwd(), 'src', 'shared', 'lib', 'datetime', 'iso', 'index.js')).default;

test('Module exists', t => {
  t.plan(2);
  t.ok(fetch, 'fetch exists');
  t.ok(caching, 'caching exists');
});

const testURL = 'https://coronadatascraper.com/data.csv';
const pastDate = '2020-04-01';
const nowDate = datetime.getYYYYMMDD();

test('Write fake cache files', t => {
  // NOTE: this will fail if the cache doesn't have the directories.
  t.plan(4);
  const simulatedResponse = {
    processingTime: '1.21 seconds',
    status: 'Processing',
    generating: {}
  };
  const responseString = JSON.stringify(simulatedResponse);

  let cacheFilename = caching.getCachedFilePath(testURL, 'csv', pastDate);
  let cacheDir = path.dirname(cacheFilename);
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  t.ok(fs.existsSync(cacheDir), `cache folder ${cacheDir} exists.`);
  fs.writeFileSync(cacheFilename, responseString, 'utf8');
  let readBack = fs.readFileSync(cacheFilename, 'utf8');
  t.ok(readBack === responseString, `fake cache file written to ${cacheFilename}`);

  cacheFilename = caching.getCachedFilePath(testURL, 'csv', nowDate);
  cacheDir = path.dirname(cacheFilename);
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  t.ok(fs.existsSync(cacheDir), `cache folder ${cacheDir} exists.`);
  fs.writeFileSync(cacheFilename, responseString, 'utf8');
  readBack = fs.readFileSync(cacheFilename, 'utf8');
  t.ok(readBack === responseString, `fake cache file written to ${cacheFilename}.`);
});

test('Simulate cache hit of JSON arcGIS response', async t => {
  t.plan(2);
  const oldFile = await fetch.csv(Object(), testURL, 'default', pastDate);
  t.ok(oldFile === null, `Successfully gave up trying to recover from an arcGIS response in the past.`);
  const nowFile = await fetch.csv(Object(), testURL, 'default', nowDate);
  t.ok(nowFile !== null, `Successfully recovered from an arcGIS response.`);
});
