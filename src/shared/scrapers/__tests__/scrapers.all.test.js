/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */
/* eslint-disable no-use-before-define */

import { sync as glob } from 'fast-glob';
import { readFileSync as readFile } from 'fs';
import path from 'path';
import join from '../../lib/join.js';
import { readJSON } from '../../lib/fs.js';
import { get } from '../../lib/fetch/get.js';
import runScraper from '../../lib/run-scraper.js';

// import { looksLike } from '../../lib/iso-date.js';
const looksLike = {
  isoDate: s => /^\d{4}-\d{2}-\d{2}$/.test(s) // YYYY-DD-MM
};

jest.mock('../../lib/fetch/get.js');

// This suite automatically tests a scraper's results against its test cases. To add test coverage for
// a scraper, see https://github.com/lazd/coronadatascraper/blob/master/docs/sources.md#testing-sources

// Utility functions

// e.g. `/coronadatascraper/src/shared/scrapers/USA/AK/tests` 🡒 `USA/AK`
const scrapersPath = join(__dirname, '..');
const scraperNameFromPath = s => s.replace(scrapersPath, '').replace('/tests', '');

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
      // dynamically import the scraper
      const scraperObj = require(join(testDir, '..', 'index.js')).default;
      const datedResults = glob(join(testDir, '*'), { onlyDirectories: true });

      for (const dateDir of datedResults) {
        const date = path.basename(dateDir);
        if (looksLike.isoDate(date)) {
          describe(date, () => {
            beforeAll(() => {
              // Read sample responses for this scraper and pass them to the mock `get` function.
              const sampleResponses = glob(join(dateDir, '*')).filter(p => !p.includes('expected'));
              for (const filePath of sampleResponses) {
                const fileName = path.basename(filePath);
                const source = { [fileName]: readFile(filePath).toString() };
                get.addSources(source);
              }
            });
            it(`returns expected data`, async () => {
              process.env.SCRAPE_DATE = date;
              const result = await runScraper(scraperObj);
              const expected = await readJSON(join(dateDir, 'expected.json'));
              if (result) expect(result.map(stripFeatures)).toEqual(expected.map(stripFeatures));
            });
          });
        }
      }

      // clean up environment vars
      afterEach(() => {
        delete process.env.SCRAPE_DATE;
      });
    });
  }
});
