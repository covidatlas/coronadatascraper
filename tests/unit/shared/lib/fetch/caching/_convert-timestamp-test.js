const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const convertTimestamp = imports(
  join(process.cwd(), 'src', 'shared', 'lib', 'fetch', 'caching', 'new', '_convert-timestamp.js')
).default;

test('Set up', t => {
  t.plan(1);
  t.ok(convertTimestamp, 'convertTimestamp module exists');
});

test('Get date boundaries', t => {
  t.plan(2);

  const iso = `2020-03-31T12:34:567Z`;
  const fs = `2020-03-31t12_34_567z`;
  t.equal(convertTimestamp.filenameToZ8601(fs), iso, 'Converted filename to 8601Z');
  t.equal(convertTimestamp.Z8601ToFilename(iso), fs, 'Converted 8601Z to filename');
});
