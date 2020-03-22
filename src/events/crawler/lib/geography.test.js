import each from 'jest-each';

import * as geography from './geography.js';

describe('Geography functions', () => {
  describe('toISO3166Alpha3', () => {
    const tests = [['France', 'FRA']];
    each(tests).test('when passed "%s", it returns %d', (str, expected) => {
      expect(geography.toISO3166Alpha3(str)).toBe(expected);
    });
  });

  describe('addEmptyRegions', () => {
    test('does the doings', () => {
      let counties = [
        {
          county: 'a',
          cases: 1
        }
      ];
      const countyNames = ['a', 'b', 'c'];
      counties = geography.addEmptyRegions(counties, countyNames, 'county');
      expect(counties).toHaveLength(3);
      expect(counties[0].county).toEqual('a');
      expect(counties[1].county).toEqual('b');
      expect(counties[2].county).toEqual('c');
    });
  });
});
