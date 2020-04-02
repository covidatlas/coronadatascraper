const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const getDateBounds = imports(
  join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'caching', 'new', '_get-date-bounds.js')
).default;

test('Set up', t => {
  t.plan(1);
  t.ok(getDateBounds, 'getDateBounds module exists');
});

test('Get date boundaries', t => {
  t.plan(6);

  // Remember, returned dates will get cast to a locale!
  const files = [
    '2020-03-25t04_00_00.000z-14f42.html',
    '2020-03-23t04_00_00.000z-fe738.html',
    '2020-03-26t04_00_00.000z-07645.html',
    '2020-03-28t04_00_00.000z-8a399.html',
    '2020-03-27t04_00_00.000z-2213b.html',
    '2020-03-24t04_00_00.000z-357e6.html'
  ];

  //
  let earliest = '2020-03-22';
  let latest = '2020-03-27';
  let result = getDateBounds(files);
  t.equal(result.earliest, earliest, `(Default) Returned earliest date cast to 'America/Los_Angeles': ${earliest}`);
  t.equal(result.latest, latest, `(Default) Returned latest date cast to 'America/Los_Angeles': ${latest}`);

  earliest = '2020-03-22';
  latest = '2020-03-27';
  let tz = 'Canada/Pacific';
  result = getDateBounds(files, tz);
  t.equal(result.earliest, earliest, `Returned date explicitly cast to '${tz}': ${earliest}`);
  t.equal(result.latest, latest, `Returned date explicitly cast to '${tz}': ${latest}`);

  earliest = '2020-03-23';
  latest = '2020-03-28';
  tz = 'Europe/London';
  result = getDateBounds(files, tz);
  t.equal(result.earliest, earliest, `Returned date explicitly cast to '${tz}': ${earliest}`);
  t.equal(result.latest, latest, `Returned date explicitly cast to '${tz}': ${latest}`);
});
