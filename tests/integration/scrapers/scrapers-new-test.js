const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const exec = require('child_process').execSync;

const shared = join(process.cwd(), 'src', 'shared');
const lib = join(shared, 'lib');
const fs = imports(join(lib, 'fs.js'));
const schema = imports(join(lib, 'schema.js'));
const runScraper = imports(join(process.cwd(), 'src', 'events', 'crawler', 'scrape-data', 'run-scraper.js'));

const { CI, PR } = process.env;

const command = CI && PR ? 'git diff --name-only origin/master' : 'git diff --name-only HEAD';
const result = exec(command);
const files = result.toString();

// Ignore any files or subdirectory in scrapers that starts with _
const scraperPathRegex = /src.shared.scrapers(?![^/])(?!.*\/_).*\.js$/gi;
const scrapers = files
  .split('\n')
  .filter(filePath => filePath.match(scraperPathRegex))
  .filter(filePath => !filePath.startsWith('tests/'))
  .map(s => join(process.cwd(), s));

if (scrapers.length > 0) {
  test('Test updated scrapers', async t => {
    t.plan(scrapers.length * 2);
    for (const scraperPath of scrapers) {
      const scraperFilename = scraperPath.replace(/^.*?src.shared.scrapers/i, '');
      if (await fs.exists(scraperPath)) {
        const scraper = imports(scraperPath).default;
        await runScraper.runScraper(scraper);

        // Technically we don't need this test because the test would
        // fail if the scraper did, but maybe someone will feel better.
        t.pass(`Scraper ${scraperFilename} ran`);

        const hasErrors = schema.schemaHasErrors(scraper, schema.schemas.scraperSchema);
        t.notOk(hasErrors, `Scraper ${scraperFilename} had no errors`);
      }
    }
    t.end();
  });
} else {
  // console.log('scrapers-new-test: No scrapers changed');
}
