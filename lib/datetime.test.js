import each from 'jest-each';

import * as datetime from './datetime';

describe('Datetime functions', () => {
  describe('getDate', () => {
    test('When called, it returns a number', () => {
      expect(typeof datetime.getDate() === 'number').toBeTruthy();
    });

    test('When called, returns the current time in milliseconds', () => {
      expect(Math.round(datetime.getDate() / 1000)).toBe(Math.round(Date.now() / 1000));
    });
  });

  describe('getYYYYMMDD', () => {
    const tests = [
      [1582299098000, undefined, '2020-02-21'],
      [1585299098000, undefined, '2020-03-27'],
      [1582299098000, '', '20200221'],
      [1582299098000, '/', '2020/02/21'],
      [-1000, undefined, '1969-12-31']
    ];
    each(tests).test('when passed date %d and delimiter "%s", it returns "%s"', (date, sep, expected) => {
      expect(datetime.getYYYYMMDD(date, sep)).toBe(expected);
    });
  });

  describe('isDateBefore', () => {
    const tests = [
      [1582299098000, 1582299098000, false],
      [1582299098000, 1585299098000, true],
      [1584299041000, 1584299541000, false],
      [1584230399000, 1584230410000, true],
      [1584230400000, 1584230410000, false]
    ];
    each(tests).test('when passed date %d and date %d, it returns %s', (a, b, expected) => {
      expect(datetime.isDateBefore(a, b)).toBe(expected);
    });
  });
});
