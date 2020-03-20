import each from 'jest-each';

import { runScraper } from './tasks/scrapeData.js';
import * as fs from './lib/fs.js';

const noScrapersTest = () => test('no scrapers modified', () => console.log('No scrapers modified, skipping tests'));

describe('scrappers', () => {
  if (process.env.FILES_MODIFIED) {
    const scrapers = process.env.FILES_MODIFIED.split('\n').filter(filePath => filePath.match(/^scrapers\//g));

    if (scrapers.length > 0) {
      each(scrapers).test('test "%s"', async scraperPath => {
        if (await fs.exists(scraperPath)) {
          const location = (await import(`./${scraperPath}`)).default;

          await runScraper(location);
        }
      });
    } else {
      noScrapersTest();
    }
  } else {
    noScrapersTest();
  }
});
