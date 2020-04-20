const imports = require('esm')(module);
const { join } = require('path');
const test = require('tape');

const stringDiff = imports(join(process.cwd(), 'src', 'shared', 'lib', 'diffing', 'string-diff.js')).default;

let lhs = '';
let rhs = '';

function diffShouldBe(t, expected) {
  t.deepEqual(stringDiff(lhs, rhs), expected);
  t.end();
}

test('same string is no diff', t => {
  const s = 'Hello there!';
  lhs = s;
  rhs = s;
  diffShouldBe(t, { column: null, left: '', right: '' });
});

test('different string', t => {
  lhs = 'Here is 1 string';
  rhs = 'Here is 2 string';
  diffShouldBe(t, { column: 9, left: '1', right: '2' });
});

test('different first char', t => {
  lhs = 'Ball';
  rhs = 'Fall';
  diffShouldBe(t, { column: 1, left: 'B', right: 'F' });
});

test('shorter left', t => {
  lhs = 'Here is';
  rhs = 'Here is 2 string';
  diffShouldBe(t, { column: 8, left: '(end-of-string)', right: ' ' });
});

test('shorter right', t => {
  lhs = 'Here is 1 string';
  rhs = 'Here is 1 ';
  diffShouldBe(t, { column: 11, left: 's', right: '(end-of-string)' });
});

test('empty right', t => {
  lhs = 'Here is 1 string';
  rhs = '';
  diffShouldBe(t, { column: 1, left: 'H', right: '(end-of-string)' });
});

test('either null throws', t => {
  lhs = 'Here is 1 string';
  rhs = null;
  t.throws(() => stringDiff(lhs, rhs));
  t.end();
});
