const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const geography = imports(join(process.cwd(), 'src', 'shared', 'lib', 'geography', 'index.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(geography, 'geography exists');
});

test('Geography functions', t => {
  t.plan(4);
  let counties = [
    {
      county: 'a',
      cases: 1
    }
  ];
  const countyNames = ['a', 'b', 'c'];
  counties = geography.addEmptyRegions(counties, countyNames, 'county');
  t.equal(counties.length, 3, 'addEmptyRegions added correct number of counties');
  t.equal(counties[0].county, 'a', 'region matches');
  t.equal(counties[1].county, 'b', 'region matches');
  t.equal(counties[2].county, 'c', 'region matches');
});
