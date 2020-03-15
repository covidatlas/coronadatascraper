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
      // Sunday, March 15, 2020 12:43:08 PM and Sunday, March 15, 2020 12:59:01 PM
      [1584301388000, 1584302341000, false],
      // Saturday, March 14, 2020 12:43:08 PM and Sunday, March 15, 2020 12:43:08 PM
      [1584214988000, 1584301388000, true],
      // Saturday, March 14, 2020 11:59:59 PM and Sunday, March 15, 2020 12:00:00 AM
      [1584255599000, 1584255600000, true],
      // Sunday, March 15, 2020 12:00:00 AM and Sunday, March 15, 2020 12:00:01 AM
      [1584255600000, 1584255601000, false]
    ];
    each(tests).test('when passed date %d and date %d, it returns %s', (a, b, expected) => {
      expect(datetime.isDateBefore(a, b)).toBe(expected);
    });
  });
});
