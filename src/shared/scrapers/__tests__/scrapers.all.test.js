/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */
/* eslint-disable no-use-before-define */

import { sync as glob } from 'fast-glob';
import { readFileSync as readFile } from 'fs';
import path from 'path';
import join from '../../lib/join.js';
import { readJSON } from '../../lib/fs.js';
import { get } from '../../lib/fetch/get.js';
import runScraper from './run-scraper.js';

jest.mock('../../lib/fetch/get.js');

/**
This suite automatically tests a scraper's results against its test cases.

To add test coverage for a scraper, you only need to provide test assets; no new tests need to be added.

- Add a `tests` folder to the scraper folder, e.g. `scrapers/FRA/tests` or `scrapers/USA/AK/tests`
- Add a sample response from the target URL. The filename should be the URL, without the
  `http(s)://` prefix, and with all non-alphanumeric characters replaced with an underscore `_`. The
  file extension should match the format of the contents (`html`, `csv`, `json`, etc). Example:
    - URL: https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv
    - File name: raw_githubusercontent_com_opencovid19_fr_data_master_dist_chiffres_cles.csv

- Add a file named `expected.YYYY-MM-DD.json` containing the array of values that the scraper is expected to
  return for a particular date. (Leave out any geojson `features` properties.); for example, `expected.2020-03-16.json`.

    ...
    📁 FRA
      📄 index.js 🡐 scraper
      📁 tests
        📄 raw_githubusercontent_com_opencovid19_fr_data_master_dist_chiffres_cles.csv 🡐 sample response
        📄 expected.2020-03-27.json 🡐 expected result for March 27, 2020
        📄 expected.2020-03-16.json 🡐 expected result for March 16, 2020

*/

// Utility functions

// Extract date from filename, e.g. `expected-2020-03-16.json` -> `2020-03-16`
const datedResultsRegex = /expected.(\d{4}-\d{2}-\d{2}).json/i;
const getDateFromPath = path => datedResultsRegex.exec(path, '$1')[1];

// e.g. `/coronadatascraper/src/shared/scrapers/USA/AK/tests` 🡒 `USA/AK`
const scraperNameFromPath = s => s.replace(join(__dirname, '..', 'scrapers'), '').replace('/tests', '');

// Remove geojson from scraper result
const stripFeatures = d => {
  delete d.feature;
  return d;
};

describe('all scrapers', () => {
  const testDirs = glob(join(__dirname, '..', '**', 'tests'), { onlyDirectories: true });

  for (const testDir of testDirs) {
    const scraperName = scraperNameFromPath(testDir); // e.g. `USA/AK`

    describe(`scraper: ${scraperName}`, () => {
      beforeAll(() => {
        // Read sample responses for this scraper and pass them to the mock `get` function.
        const sampleResponses = glob(join(testDir, '*')).filter(p => !p.includes('expected'));
        for (const filePath of sampleResponses) {
          const fileName = path.basename(filePath);
          const fullPath = path.resolve(__dirname, filePath);
          const source = { [fileName]: readFile(fullPath).toString() };
          get.addSources(source);
        }
      });

      // dynamically import the scraper
      const scraperObj = require(join(testDir, '..', 'index.js')).default;

      const datedResults = glob(join(testDir, 'expected.*.json'));
      for (const expectedPath of datedResults) {
        const date = getDateFromPath(expectedPath);

        it(`returns data for ${date}`, async () => {
          process.env.SCRAPE_DATE = date;
          let result = await runScraper(scraperObj);
          result = result.map(stripFeatures);
          const expected = await readJSON(expectedPath);
          expect(result).toEqual(expected);
        });
      }

      // clean up environment vars
      afterEach(() => {
        delete process.env.SCRAPE_DATE;
      });
    });
  }
});
