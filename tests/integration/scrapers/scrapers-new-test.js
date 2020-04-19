const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const exec = require('child_process').execSync;
const fs = require('fs');

const shared = join(process.cwd(), 'src', 'shared');
const lib = join(shared, 'lib');

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
    .filter(filePath => !filePath.startsWith('tests/'))
    .filter(filePath => fs.existsSync(join(process.cwd(), filePath)));

  if (scrapers.length > 0) {
    for (const scraperPath of scrapers) {
      test(`Updated scraper ${scraperPath}`, async t => {
        try {
          const scraper = imports(join(process.cwd(), scraperPath));
          await runScraper(scraper);
          t.pass('Scraper ran');
          const hasErrors = schema.schemaHasErrors(scraper.default, schema.schemas.scraperSchema);
          t.notOk(hasErrors, 'Scraper had no errors');
        } catch (err) {
          t.fail(`Scraper failed with error: ${err}`);
        }
        t.end();
      });
    }
  }
}
