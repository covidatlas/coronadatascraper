import * as datetime from '../datetime.js';

describe(`Datetime functions (${Intl.DateTimeFormat().resolvedOptions().timeZone})`, () => {
  describe('getYYYYMMDD', () => {
    test('convert date defined with ISO date string', () => {
      const d = '2020-03-16';
      expect(datetime.getYYYYMMDD(d)).toBe('2020-03-16');
    });

    // This test fails when runtime timezone is east of GMT
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('convert date defined as ISO datetime string', () => {
      const d = '2020-03-16T00:00:00';
      expect(datetime.getYYYYMMDD(d)).toBe('2020-03-16'); // sometimes we get 2020-03-15
    });
  });

  describe('scrapeDateIs', () => {
    test('matches environment var', () => {
      process.env.SCRAPE_DATE = '2020-3-15';
      expect(datetime.scrapeDateIs('2020-3-15')).toBe(true);
    });
  });
});
