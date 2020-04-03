const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const fastGlob = require('fast-glob');
const path = require('path');
const shared = join(process.cwd(), 'src', 'shared');
const lib = join(shared, 'lib');
const schema = imports(join(lib, 'schema.js'));
const fs = imports(join(lib, 'fs.js'));

const scraperRoot = join(shared, 'scrapers');

// Ignore any files or subdirectory in scrapers that starts with _
const ignoreUnderscoreFiles = /(\/|\\)_/

const scraperFiles =  fastGlob.sync(join(scraperRoot, '**', '*.js'))
   .filter(f => !ignoreUnderscoreFiles.test(f));

const scrapers = scraperFiles.map(f => {
  const scraperName = f.replace(scraperRoot, '');
  const scraperObj = imports(f).default;
  return {
    name: scraperName,
    scraperObj
  };
});


test('srapers-all-test: all scraper schema', async t => {
  t.plan(scrapers.length);
  for (const s of scrapers) {
    const hasErrors = schema.schemaHasErrors(s.scraperObj, schema.schemas.scraperSchema);
    t.notOk(hasErrors, `${s.name} schema ok`);
  }
  t.end();
});

