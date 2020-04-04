/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */
/* eslint-disable no-use-before-define */

const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const fastGlob = require('fast-glob');
const path = require('path');
const { EventEmitter } = require('events');

const fs = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fs.js'));
const runScraper = imports(join(process.cwd(), 'src', 'events', 'crawler', 'scrape-data', 'run-scraper.js'));
const get = imports(join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'get.js'));

// This suite automatically tests a scraper's results against its test
// cases. To add test coverage for a scraper, see
// docs/sources.md#testing-sources

// The tests monkeypatch get.get, so make sure that's restored at the end!
const oldGetGet = get.get;

// Utility functions

/** Splits folder path into the scraper name and test date hash.
 * e.g. 'X/Y/2020-03-04' => { scraperName: 'X/Y', date: '2020-03-04' }
 */
function scraperNameAndDateFromPath(s) {
  const parts = s.split(path.sep);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const name = parts.filter(s => !dateRegex.test(s)).join(path.sep);
  const dt = parts.filter(s => dateRegex.test(s));

  const date = dt.length === 0 ? null : dt[0];
  return {
    scraperName: name,
    date
  };
}

/** Changes a URL to a filesystem-friendly name, removes extension. */
function sanitizeUrl(s) {
  const ext = path.extname(s);
  return s
    .replace(ext, '')
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-z0-9]/gi, '_');
}

/** Run a single scraper test directory. */
async function runTest(t, cacheRoot, testDirectory) {
  const { scraperName, date } = scraperNameAndDateFromPath(testDirectory);

  // Monkeypatch global get for this test.
  // eslint-disable-next-line no-unused-vars
  get.get = async (url, type, date, options) => {
    const sanurl = sanitizeUrl(url);
    const respFile = join(testDirectory, sanurl);
    // console.log(`  Call: ${url}\n  Sanitized: ${sanurl}\n  Response: ${respFile}`);
    return fs.readFile(join(cacheRoot, respFile));
  };

  const pathParts = [__dirname, '..', '..', '..', 'src', 'shared', 'scrapers', scraperName, 'index.js'];
  const scraperObj = imports(join(...pathParts)).default;

  let result = null;
  try {
    process.env.SCRAPE_DATE = date;
    result = await runScraper.runScraper(scraperObj);
  } catch (e) {
    t.fail(`${scraperName} on ${date}, error scraping: ${e}`);
  } finally {
    delete process.env.SCRAPE_DATE;
    get.get = oldGetGet;
  }

  if (result) {
    // Writing the actual scraper result so ppl can diff/investigate.
    // These are ignored in .gitignore.
    const actualFilepath = join(cacheRoot, testDirectory, 'actual.json');
    await fs.writeJSON(actualFilepath, result, { log: false });

    const expectedPath = join(cacheRoot, testDirectory, 'expected.json');
    const fullExpected = await fs.readJSON(expectedPath);

    // Ignore features (for now?).
    const removeFeatures = d => {
      delete d.feature;
      return d;
    };
    const actual = JSON.stringify(result.map(removeFeatures));
    const expected = JSON.stringify(fullExpected.map(removeFeatures));
    const shortPath = cacheRoot.replace(process.cwd(), '');
    const msg = `${scraperName} on ${date} (actual.json vs expected.json in ${shortPath}/${testDirectory})`;
    t.equal(actual, expected, msg);
  } else {
    t.fail(`should have had a result for ${scraperName} on ${date}`);
  }
}

// Mutex

// Each test folder modifies global state (get.get, and
// process.env.SCRAPE_DATE), so we need to make sure that they're run
// one at a time.  Global state is bad!

// https://medium.com/trabe/synchronize-cache-updates-in-node-js-with-a-mutex-d5b395457138
class Lock {
  constructor(maxListeners = 20) {
    this._locked = false;
    this._ee = new EventEmitter();
    this._ee.setMaxListeners(maxListeners);
  }

  acquire() {
    return new Promise(resolve => {
      // If nobody has the lock, take it and resolve immediately
      if (!this._locked) {
        // Safe because JS doesn't interrupt you on synchronous operations,
        // so no need for compare-and-swap or anything like that.
        this._locked = true;
        return resolve();
      }

      // Otherwise, wait until somebody releases the lock and try again
      const tryAcquire = () => {
        if (!this._locked) {
          this._locked = true;
          this._ee.removeListener('release', tryAcquire);
          return resolve();
        }
      };
      this._ee.on('release', tryAcquire);
    });
  }

  release() {
    // Release the lock immediately
    this._locked = false;
    setImmediate(() => this._ee.emit('release'));
  }
}

// Tests.

const cachePath = join(process.cwd(), 'tests', 'integration', 'scrapers', 'testcache');
const testDirs = fastGlob
  .sync(join(cachePath, '**'), { onlyDirectories: true })
  .filter(s => /\d{4}-\d{2}-\d{2}$/.test(s))
  .map(s => s.replace(`${cachePath}${path.sep}`, ''));
// console.log(`======== ${testDirs} =======`);

const lock = new Lock(testDirs.length);

test('scrapers-all-test, Parsers', async t => {
  t.plan(testDirs.length);
  testDirs.forEach(async d => {
    await lock.acquire();
    try {
      await runTest(t, cachePath, d);
    } catch (e) {
      t.fail(`Failure for ${d}: ${e}`);
    } finally {
      lock.release();
    }
  });
});

// Final cleanup.
delete process.env.SCRAPE_DATE;
get.get = oldGetGet;
