const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const exec = require('child_process').execSync;

const shared = join(process.cwd(), 'src', 'shared');
const lib = join(shared, 'lib');

const fs = imports(join(lib, 'fs.js'));
const schema = imports(join(lib, 'schema.js'));
const runScraper = imports('./run-scraper.js').default;

const { CI, PR } = process.env;
const command = CI && PR ? 'git diff --name-only origin/master' : 'git diff --name-only HEAD';
const result = exec(command);
const files = result.toString();
if (files) {
  const scrapers = files
    .split('\n')
    .filter(filePath =>
      // Ignore any files or subdirectory in scrapers that starts with _
      filePath.match(/scrapers(?![^/])(?!.*\/_).*\.js$/gi)
    )
    .filter(filePath => !filePath.startsWith('tests/'));

  if (scrapers.length > 0) {
    test('Test updated scrapers', async t => {
      t.plan(scrapers.length * 2);
      for (const scraperPath of scrapers) {
        if (await fs.exists(scraperPath)) {
          const scraper = imports(join(process.cwd(), scraperPath));
          await runScraper(scraper);
          const hasErrors = schema.schemaHasErrors(scraper.default, schema.schemas.scraperSchema);
          t.notOk(hasErrors, 'Scraper had no errors');
          t.pass('Scraper ran'); // Technically we don't need this test because the test would fail if the scraper did, but maybe someone will feel better
        }
      }
    });
  }
}
