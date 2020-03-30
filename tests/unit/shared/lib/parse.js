const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const parse = imports(join(process.cwd(), 'src', 'shared', 'lib', 'parse.js'));

test('Module exists', t => {
  t.plan(1);
  t.ok(parse, 'parse exists');
});

test('Parse numbers', t => {
  const list = [
    ['', 0],
    ['0', 0],
    ['1', 1],
    ['-1', -1],
    ['10', 10],
    ['1.1', 11],
    ['-1.1', -11],
    ['25abc', 25],
    ['as-12asdasd', -12]
  ];
  t.plan(list.length);
  list.forEach((item, i) => {
    t.equal(parse.number(item[0]), list[i][1], `${item[0]} parsed to ${list[i][1]}`);
  });
});

test('Parse floats', t => {
  const list = [
    ['', 0],
    ['0', 0],
    ['1', 1],
    ['-1', -1],
    ['10', 10],
    ['1.1', 1.1],
    ['-1.1', -1.1],
    ['25abc', 25],
    ['as-12asdasd', -12]
  ];
  t.plan(list.length);
  list.forEach((item, i) => {
    t.equal(parse.float(item[0]), list[i][1], `${item[0]} parsed to ${list[i][1]}`);
  });
});

test('Parse strings', t => {
  const list = [
    ['', ''],
    ['should not change', 'should not change'],
    ['0', '0'],
    ['****test', 'test'],
    ['this is some text\nsecond line', 'this is some text second line'],
    ['this  some test', 'this some test'],
    ['this is padded text          ', 'this is padded text'],
    ['        this is padded text', 'this is padded text']
  ];
  t.plan(list.length);
  list.forEach((item, i) => {
    t.equal(parse.string(item[0]), list[i][1], `${item[0]} parsed to ${list[i][1]}`);
  });
});
