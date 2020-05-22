const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');
const fastGlob = require('fast-glob');
const fs = require('fs');

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

const scraperCodeFiles = allJs.map(f => {
  const content = fs.readFileSync(f, 'utf-8');
  const m = content.match(/fetch\..*/g);
  return {
    shortName: f.replace(scraperRoot, '').trim(),
    importsFetch: /fetch.*?index.js/.test(content),
    fetchLines: m
  };
});

function validateCodingConventions(t, lin) {
  // Having the fetch all one line helps with code instrumentation
  // (regex search-and-replace).
  // disabled, no longer need this check, not regexing any more.
  // t.ok(lin.endsWith(');'), `"${lin}" ends with ');'`);

  // Some places have fetch() within a larger expression, e.g.:
  // const casesData = (await fetch.csv(this.url, false)).filter(...);
  // Can't have that!
  /*
  const fetchCheck = lin.match(/fetch.*?\(.*?\)(.*?);/);
  if (fetchCheck) {
    const afterParens = fetchCheck[1];
    t.equal('', afterParens.trim(), 'Should be nothing after the first closing parens');
  } else {
    t.fail(`Doesn't follow convention`);
  }
  */

  // Each call should have the scraper object, the URL, and the
  // "cache key".
  // console.log(lin);
  const fetchArgs = lin
    .trim()
    .replace(/.*\(/, '')
    .replace(/\);$/, '')
    .split(',')
    .map(s => s.trim());
  const n = fetchArgs.length;
  if (n < 3) {
    t.fail(`Expected >=3 args to fetch (scraper, url, cacheKey), got ${n}`);
    return;
  }

  const first = fetchArgs[0];

  // First arg: Most scrapers can pass 'this', but some scrapers
  // use helper functions, and so must pass 'obj'.
  t.ok(first === 'this' || first === 'obj', 'first arg is this or obj');

  // Third arg: If not ArcGIS, third arg must be be cache key.
  // ArcGIS calls don't have a "cache key", as they're intermediate steps only.
  // const third = fetchArgs[2];
  //
  // DISABLED THIS CHECK.
  // NOTE: can't check this, b/c some scrapers use variables as the cache key
  // (e.g. when fetching multiple times for counties, see US/VA/index.js).
  // const apos = "'";
  // const ckmsg = `third arg (${third}) is cache key, must be string`;
  // if (!lin.match(/getArcGIS/)) {
  //   t.ok(third.startsWith(apos) && third.endsWith(apos), ckmsg);
}

const checkFiles = scraperCodeFiles.filter(scf => scf.importsFetch);

checkFiles.forEach(scf => {
  scf.fetchLines.forEach(lin => {
    const testname = `${scf.shortName} fetch coding conventions (line "${lin}")`;
    test(testname, async t => {
      try {
        validateCodingConventions(t, lin);
      } catch (err) {
        t.fail(err);
      } finally {
        t.end();
      }
    });
  });
});
