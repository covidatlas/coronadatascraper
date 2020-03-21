import * as datetime from './datetime.js';

describe('Datetime functions', () => {
  describe('scrapeDateIs', () => {
    test('matches environment var', () => {
      process.env.SCRAPE_DATE = '2020-3-15';
      expect(datetime.scrapeDateIs('2020-3-15')).toBe(true);
    });
  });
});
