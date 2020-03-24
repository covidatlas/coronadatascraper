/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */

import { sync as glob } from 'fast-glob';
import path, { join as _join } from 'path';
import * as fetch from './lib/fetch.js';
import { readFile, readJSON } from './lib/fs.js';

jest.mock('./lib/fetch.js');

const join = (...args) => _join(...args).replace(/\\/g, '/');

describe('all scrapers', () => {
  const scrapersDir = join(__dirname, './scrapers/');

  const testDirs = glob(join(scrapersDir, '**/tests'), { onlyDirectories: true });

  const scraperNameFromPath = s => s.replace(scrapersDir, '').replace('/tests', '');

  for (const testDir of testDirs) {
    const testInputs = glob(join(testDir, '*')).filter(p => !p.includes('expected'));

    for (const filePath of testInputs) {
      const fileName = path.basename(filePath);
      fetch.mockSources({ [fileName]: readFile(path.resolve(__dirname, filePath)) });
    }

    const scraperName = scraperNameFromPath(testDir);

    describe(`scraper: ${scraperName}`, () => {
      const s = require(join(testDir, '..', 'index.js')).default;
      it('scrapes latest', async () => {
        const result = await s.scraper();
        const expectedPath = join(testDir, 'expected.json');
        expect(result).toEqual(await readJSON(expectedPath));
      });

      // xxx('scrapes a specific date', async () => {
      //   process.env.SCRAPE_DATE = '2020-03-16';
      //   const result = await ESP.scraper();
      //   expect(result).toEqual(require('./scrapers/ESP/tests/expected.2020-03-16.json'));
      // });

      afterEach(() => {
        delete process.env.SCRAPE_DATE;
      });
    });
  }
});
