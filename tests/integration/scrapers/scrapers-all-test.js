const imports = require('esm')(module);
const path = require('path');
const test = require('tape');
const glob = require('fast-glob').sync;

const shared = path.join(process.cwd(), 'src', 'shared');
const lib = path.join(shared, 'lib');
const join = imports(path.join(lib, 'join.js')).default;
const { readJSON } = imports(path.join(lib, 'fs.js'));
const runScraper = imports('./run-scraper.js').default;

/**
This suite automatically tests a scraper's results against its test cases.

To add test coverage for a scraper, you only need to provide test assets; no new tests need to be added.

- Add a `tests` folder to the scraper folder, e.g. `scrapers/FRA/tests` or `scrapers/USA/AK/tests`
- Add a sample response from the target URL. The filename should be an MD5 hash of the URL + its original ext (the same as we have it in cache):
    - URL: https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv
    - File name: 70837a5939e6cb1950dc07178d47aeb3.csv

- Add a file named `expected.json` containing the array of values that the scraper is expected to
  return. (Leave out any geojson `features` properties.)
- For sources that have a time series, the `expected.json` file represents the latest result in the
  sample response provided. You can additionally test the return value for a specific date by adding
  a file with the name `expected.YYYY-MM-DD.json`; for example, `expected.2020-03-16.json`.

    📁 USA
      📁 AK
        📄 index.js 🡐 scraper
        📁 tests
          📄 dhss_alaska_gov_dph_Epi_id_Pages_COVID_19_monitoring.html 🡐 sample response
          📄 expected.json 🡐 expected result
    ...
    📁 FRA
      📄 index.js 🡐 scraper
      📁 tests
        📄 70837a5939e6cb1950dc07178d47aeb3.csv 🡐 sample response
        📄 expected.json 🡐 expected result for most recent date in sample
        📄 expected.2020-03-16.json 🡐 expected result for March 16, 2020

*/

/**
 * Utility functions
 */
// Extract date from filename, e.g. `expected-2020-03-16.json` -> `2020-03-16`
const datedResultsRegex = /expected.(\d{4}-\d{2}-\d{2}).json/i;
const getDateFromPath = path => datedResultsRegex.exec(path, '$1')[1];

// e.g. `/coronadatascraper/src/shared/scrapers/USA/AK/tests` 🡒 `USA/AK`
const scraperNameFromPath = s => s.replace(join(__dirname, '..', 'scrapers'), '').replace('/tests', '');

// Remove geojson + undefined from scraper result
const strip = d => {
  delete d.feature;
  for (const prop of Object.keys(d)) {
    if (d[prop] === undefined) delete d[prop];
  }
  return d;
};

test('Scraper tests', async t => {
  const testDirs = glob(join(shared, 'scrapers', '**', 'tests'), { onlyDirectories: true });

  for (const testDir of testDirs) {
    const scraperName = scraperNameFromPath(testDir); // e.g. `USA/AK`
    process.env.OVERRIDE_CACHE_PATH = testDir;

    // dynamically import the scraper
    const scraperObj = imports(join(testDir, '..', 'index.js'));

    if (scraperObj.state === 'iso2:US-AL' && scraperObj.country === 'iso1:US') {
      [scraperObj.scraper] = scraperObj.scraper;
    }

    const datedResults = glob(join(testDir, 'expected.*.json'));

    for (const expectedPath of datedResults) {
      const date = getDateFromPath(expectedPath);
      process.env.SCRAPE_DATE = date;

      try {
        let result = await runScraper(scraperObj);
        if (Array.isArray(result)) {
          result = result.map(strip);
        } else {
          result = strip(result);
        }
        const expected = await readJSON(expectedPath);
        t.deepEqual(result, expected, `Got correct result back from ${scraperName}`);
      } catch (err) {
        t.fail(`Failure for ${scraperName}: ${err}`);
      } finally {
        delete process.env.SCRAPE_DATE;
      }
    }
    delete process.env.OVERRIDE_CACHE_PATH;
  }
  t.end();
});
