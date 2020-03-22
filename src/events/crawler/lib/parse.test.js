import each from 'jest-each';

import * as parse from './parse.js';

describe('Parse functions', () => {
  describe('number', () => {
    const tests = [
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
    each(tests).test('when passed "%s", it returns %d', (str, expected) => {
      expect(parse.number(str)).toBe(expected);
    });
  });

  describe('float', () => {
    const tests = [
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
    each(tests).test('when passed "%s", it returns %d', (str, expected) => {
      expect(parse.float(str)).toBe(expected);
    });
  });

  describe('string', () => {
    const tests = [
      ['', ''],
      ['should not change', 'should not change'],
      ['0', '0'],
      ['****test', 'test'],
      ['this is some text\nsecond line', 'this is some text second line'],
      ['this  some test', 'this some test'],
      ['this is padded text          ', 'this is padded text'],
      ['        this is padded text', 'this is padded text']
    ];
    each(tests).test('when passed "%s", it returns "%s"', (str, expected) => {
      expect(parse.string(str)).toBe(expected);
    });
  });
});
