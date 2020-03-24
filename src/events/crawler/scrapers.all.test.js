/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */

import { sync as glob } from 'fast-glob';
import { readFileSync as readFile } from 'fs';
import path, { join as _join } from 'path';
import { readJSON } from './lib/fs.js';
import { get } from './lib/get.js';

jest.mock('./lib/get.js');

const join = (...args) => _join(...args).replace(/\\/g, '/');

const stripFeatures = d => {
  delete d.feature;
  return d;
};

const scrapersDir = join(__dirname, './scrapers/');
const scraperNameFromPath = s => s.replace(scrapersDir, '').replace('/tests', '');

const testDirs = glob(join(scrapersDir, '**/tests'), { onlyDirectories: true });

describe('all scrapers', () => {
  const testScraper = async (s, expectedPath) => {
    let result = await s.scraper();
    result = result.map(stripFeatures);
    const expected = await readJSON(expectedPath);
    expect(result).toEqual(expected);
  };

  for (const testDir of testDirs) {
    const scraperName = scraperNameFromPath(testDir);

    describe(`scraper: ${scraperName}`, () => {
      const testInputs = glob(join(testDir, '*')).filter(p => !p.includes('expected'));

      for (const filePath of testInputs) {
        const fileName = path.basename(filePath, path.extname(filePath));
        const source = { [fileName]: readFile(path.resolve(__dirname, filePath)).toString() };
        get.setSources(source);
      }

      const scraper = require(join(testDir, '..', 'index.js')).default;

      it('returns latest data', async () => {
        const expectedPath = join(testDir, 'expected.json');
        await testScraper(scraper, expectedPath);
      });

      const datedResultsRegex = /expected.(\d{4}-\d{2}-\d{2}).json/i;
      const datedResults = glob(join(testDir, 'expected.*.json'));

      for (const expectedPath of datedResults) {
        const date = datedResultsRegex.exec(expectedPath, '$1')[1];

        it('returns data for a specific date', async () => {
          process.env.SCRAPE_DATE = date;
          await testScraper(scraper, expectedPath);
        });
      }

      afterEach(() => {
        delete process.env.SCRAPE_DATE;
      });
    });
  }
});
