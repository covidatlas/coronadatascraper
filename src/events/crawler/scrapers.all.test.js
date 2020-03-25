/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require  */
/* eslint-disable no-use-before-define */

import { sync as glob } from 'fast-glob';
import { readFileSync as readFile } from 'fs';
import path, { join as _join } from 'path';
import { readJSON } from './lib/fs.js';
import { get } from './lib/get.js';

jest.mock('./lib/get.js');

/**
This suite automatically tests a scraper's results against its test cases. 

To add test cases to a scraper:
- Add a `tests` folder
- Add a sample response from the target url. 
- Add a file named


*/
describe('all scrapers', () => {
  const join = (...args) => _join(...args).replace(/\\/g, '/');

  const datedResultsRegex = /expected.(\d{4}-\d{2}-\d{2}).json/i;
  const getDateFromPath = path => datedResultsRegex.exec(path, '$1')[1];
  const scraperNameFromPath = s => s.replace(scrapersDir, '').replace('/tests', '');

  const stripFeatures = d => {
    delete d.feature;
    return d;
  };

  const scrapersDir = join(__dirname, './scrapers/');
  const testDirs = glob(join(scrapersDir, '**/tests'), { onlyDirectories: true });

  for (const testDir of testDirs) {
    const scraperName = scraperNameFromPath(testDir);

    describe(`scraper: ${scraperName}`, () => {
      const testInputs = glob(join(testDir, '*')).filter(p => !p.includes('expected'));

      for (const filePath of testInputs) {
        const fileName = path.basename(filePath);
        const source = { [fileName]: readFile(path.resolve(__dirname, filePath)).toString() };
        get.setSources(source);
      }

      const scraperObj = require(join(testDir, '..', 'index.js')).default;

      it('returns latest data', async () => {
        const expectedPath = join(testDir, 'expected.json');
        let result = await scraperObj.scraper();
        result = result.map(stripFeatures);
        const expected = await readJSON(expectedPath);
        expect(result).toEqual(expected);
      });

      const datedResults = glob(join(testDir, 'expected.*.json'));

      for (const expectedPath of datedResults) {
        const date = getDateFromPath(expectedPath);

        it('returns data for a specific date', async () => {
          process.env.SCRAPE_DATE = date;
          let result = await scraperObj.scraper();
          result = result.map(stripFeatures);
          const expected = await readJSON(expectedPath);
          expect(result).toEqual(expected);
        });
      }

      afterEach(() => {
        delete process.env.SCRAPE_DATE;
      });
    });
  }
});
