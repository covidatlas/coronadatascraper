import each from 'jest-each';

import { runScraper } from '../tasks/scrapeData.js';

const noScrapersTest = () => test('no scrapers modified', () => console.log('No scrapers modified, skipping tests'));

describe('scrappers', () => {
  if (process.env.FILES_MODIFIED) {
    const scrapers = process.env.FILES_MODIFIED.split('\n').filter(filePath => filePath.match(/^scrapers\//g));

    if (scrapers.length > 0) {
      each(scrapers).test('test "%s"', async scraperPath => {
        const location = (await import(`../${scraperPath}`)).default;

        runScraper(location);
      });
    } else {
      noScrapersTest();
    }
  } else {
    noScrapersTest();
  }
});
