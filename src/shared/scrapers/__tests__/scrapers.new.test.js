import each from 'jest-each';

import * as fs from '../../lib/fs.js';
import * as schema from '../../lib/schema.js';
import runScraper from '../../lib/run-scraper.js';

const noScrapersTest = () => test('no scrapers modified', () => console.log('No scrapers modified, skipping tests'));

describe('new scrapers', () => {
  beforeAll(() => {
    jest.setTimeout(300000);
  });

  afterAll(() => {
    jest.setTimeout(5000);
  });

  if (process.env.FILES_MODIFIED) {
    const scrapers = process.env.FILES_MODIFIED.split('\n').filter(filePath =>
      // Ignore any files or subdirectory in scrapers that starts with _
      filePath.match(/scrapers(?![^/])(?!.*\/_).*\.js$/gi)
    );

    if (scrapers.length > 0) {
      each(scrapers).test('when "%s" is called, it does not fail', async scraperPath => {
        if (await fs.exists(scraperPath)) {
          const location = (await import(scraperPath.replace('src/shared/scrapers', '../'))).default;

          await runScraper(location);
        }
      });
      each(scrapers).test('scraper "%s" follows schema', async scraperPath => {
        if (await fs.exists(scraperPath)) {
          const source = (await import(scraperPath.replace('src/shared/scrapers', '../'))).default;

          expect(schema.schemaHasErrors(source, schema.schemas.scraperSchema)).toBeFalsy();
        }
      });
    } else {
      noScrapersTest();
    }
  } else {
    noScrapersTest();
  }
});
