import each from 'jest-each';

import * as transform from './transform.js';

describe('Transform functions', () => {
  describe('toISO3166Alpha3', () => {
    const tests = [['France', 'FRA']];
    each(tests).test('when passed "%s", it returns %d', (str, expected) => {
      expect(transform.toISO3166Alpha3(str)).toBe(expected);
    });
  });
});
