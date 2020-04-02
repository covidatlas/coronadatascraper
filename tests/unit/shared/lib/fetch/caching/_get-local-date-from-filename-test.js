const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const getLocalDateFromFilename = imports(
  join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'caching', 'new', '_get-local-date-from-filename.js')
).default;

test('Set up', t => {
  t.plan(1);
  t.ok(getLocalDateFromFilename, 'getLocalDateFromFilename module exists');
});

test('Get timestamp', t => {
  t.plan(3);
  const filename = '2020-03-27t04_00_00.000z-19bb8.html';

  let date = '2020-03-26';
  t.equal(getLocalDateFromFilename(filename), date, `(Default) Returned date cast to 'America/Los_Angeles': ${date}`);

  let tz = 'Canada/Pacific';
  t.equal(getLocalDateFromFilename(filename, tz), date, `Returned date explicitly cast to '${tz}': ${date}`);

  tz = 'Europe/London';
  date = '2020-03-27';
  t.equal(getLocalDateFromFilename(filename, tz), date, `Returned date cast to '${tz}': ${date}`);
});
