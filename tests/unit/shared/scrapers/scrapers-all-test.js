const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const fastGlob = require('fast-glob');

const shared = join(process.cwd(), 'src', 'shared');
const lib = join(shared, 'lib');
const schema = imports(join(lib, 'schema.js'));

const scraperRoot = join(shared, 'scrapers');

const allJs = fastGlob.sync(join(scraperRoot, '**', '*.js'));

// Ignore any files or subdirectory in scrapers that starts with _
const ignoreUnderscoreFiles = /(\/|\\)_/;
const scraperFiles = allJs.filter(f => !ignoreUnderscoreFiles.test(f));

const scrapers = scraperFiles.map(f => {
  return {
    name: f.replace(scraperRoot, ''),
    scraperObj: imports(f).default
  };
});

test('scrapers-all-test: all scraper schema', async t => {
  t.plan(scrapers.length);
  for (const s of scrapers) {
    const hasErrors = schema.schemaHasErrors(s.scraperObj, schema.schemas.scraperSchema);
    t.notOk(hasErrors, `${s.name} schema ok`);
  }
  t.end();
});
