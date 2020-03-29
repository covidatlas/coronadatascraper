const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const transform = imports(join(process.cwd(), 'src', 'shared', 'lib', 'transform.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(transform, 'transform exists');
});

test('Transform functions', t => {
  const list = [
    ['Saint-Barthélemy', 'saint-barthelemy'],
    ['La Réunion', 'la reunion']
  ];
  t.plan(list.length);
  list.forEach((item, i) => {
    t.equal(transform.normalizeString(item[0]), list[i][1], `${item[0]} parsed to ${list[i][1]}`);
  });
});
