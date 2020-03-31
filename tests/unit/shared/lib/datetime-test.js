const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const datetime = imports(join(process.cwd(), 'src', 'shared', 'lib', 'datetime.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(datetime, 'datetime exists');
});

test('Datetime functions', t => {
  t.plan(1);
  process.env.SCRAPE_DATE = '2020-3-15';
  t.ok(datetime.scrapeDateIs('2020-3-15'), 'Datetime process.env.SCRAPE_DATE produces the correct scrape date');
  delete process.env.SCRAPE_DATE;
});
