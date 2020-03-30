import {
  today,
  now,
  parse,
  getYYYYMMDD,
  getYYYYMD,
  getDDMMYYYY,
  getMDYYYY,
  getMDYY,
  getMonthDYYYY,
  dateIsBefore,
  dateIsBeforeOrEqualTo,
  scrapeDateIsBefore,
  scrapeDateIsAfter,
  scrapeDateIs,
  looksLike
} from '../datetime.js';

const mockDate = d => jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date(d).valueOf());

describe(`datetime (system timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone})`, () => {
  describe('looksLike', () => {
    describe('isoDate', () => {
      test('valid date', () => expect(looksLike.isoDate('2020-03-16')).toBe(true));
      test('invalid date but right form', () => expect(looksLike.isoDate('1234-99-52')).toBe(true));
      test('no padding', () => expect(looksLike.isoDate('2020-3-16')).toBe(false));
      test('two-digit year', () => expect(looksLike.isoDate('20-03-16')).toBe(false));
      test('etc', () => expect(looksLike.isoDate('pizza')).toBe(false));
    });

    describe('YYYYMD', () => {
      test('valid date', () => expect(looksLike.YYYYMD('2020-3-16')).toBe(true));
      test('invalid date but right form', () => expect(looksLike.YYYYMD('1234-9-52')).toBe(true));
      test('padding', () => expect(looksLike.YYYYMD('2020-03-16')).toBe(true));
      test('two-digit year', () => expect(looksLike.YYYYMD('20-03-16')).toBe(false));
      test('etc', () => expect(looksLike.YYYYMD('pizza')).toBe(false));
    });
  });

  describe('parse', () => {
    test('from JS Date', () => expect(parse(new Date('2020-03-16'))).toEqual('2020-03-16'));
    test('from ISO date', () => expect(parse('2020-03-16')).toEqual('2020-03-16'));
    test('from ISO datetime', () => expect(parse('2020-03-16T23:45:00Z')).toEqual('2020-03-16'));
    test('from unpadded ISO date', () => expect(parse('2020-3-1')).toEqual('2020-03-01'));
    test('from inconsistently padded ISO date', () => expect(parse('2020-3-01')).toEqual('2020-03-01'));
  });

  describe('today & now', () => {
    beforeEach(() => mockDate('2020-03-16T23:45Z'));

    describe('today.utc', () => {
      test('returns the date in UTC', () => expect(today.utc()).toEqual('2020-03-16'));
    });

    describe('today.at', () => {
      test('returns the date in Los Angeles', () => expect(today.at('America/Los_Angeles')).toEqual('2020-03-16'));
      test('returns the date in Sydney', () => expect(today.at('Australia/Sydney')).toEqual('2020-03-17')); // next day
    });

    describe('now.utc', () => {
      test('returns the time in UTC', () => expect(now.utc()).toEqual('2020-03-16T23:45'));
    });

    describe('now.at', () => {
      test('returns the time in Los Angeles', () => expect(now.at('America/Los_Angeles')).toEqual('2020-03-16T16:45')); // 7 hrs earlier
      test('returns the time in Australia', () => expect(now.at('Australia/Sydney')).toEqual('2020-03-17T10:45')); // 11 hrs later, next day
    });
  });

  describe('getYYYYMMDD', () => {
    test('from ISO date', () => expect(getYYYYMMDD('2020-03-16')).toBe('2020-03-16'));
    test('from unpadded ISO date', () => expect(getYYYYMMDD('2020-3-16')).toBe('2020-03-16'));
    test('from ISO datetime', () => expect(getYYYYMMDD('2020-03-16T00:00:00')).toBe('2020-03-16'));
    test('slash as separator', () => expect(getYYYYMMDD('2020-03-16', '/')).toBe('2020/03/16'));
    test('no separator', () => expect(getYYYYMMDD('2020-03-16', '')).toBe('20200316'));
  });

  describe('getYYYYMD', () => {
    test('from ISO date', () => expect(getYYYYMD('2020-03-16')).toBe('2020-3-16'));
    test('from ISO datetime', () => expect(getYYYYMD('2020-03-16T00:00:00')).toBe('2020-3-16'));
  });

  describe('getDDMMYYYY', () => {
    test('from ISO date', () => expect(getDDMMYYYY('2020-03-16')).toBe('16-03-2020'));
  });

  describe('getMDYYYY', () => {
    test('from ISO date', () => expect(getMDYYYY('2020-03-16')).toBe('3/16/2020'));
    test('dash as separator', () => expect(getMDYYYY('2020-03-16', '-')).toBe('3-16-2020'));
  });

  describe('getMDYY', () => {
    test('from ISO date', () => expect(getMDYY('2020-03-16')).toBe('3/16/20'));
  });

  describe('getMonthDYYYY', () => {
    test('from ISO date', () => expect(getMonthDYYYY('2020-03-16')).toBe('March_16_2020'));
    test(`doesn't pad date`, () => expect(getMonthDYYYY('2020-03-06')).toBe('March_6_2020'));
  });

  describe('dateIsBefore', () => {
    test('before', () => expect(dateIsBefore('2020-03-16', '2020-03-20')).toBe(true));
    test('same', () => expect(dateIsBefore('2020-03-16', '2020-03-16')).toBe(false));
    test('after', () => expect(dateIsBefore('2020-03-20', '2020-03-16')).toBe(false));
  });

  describe('dateIsBeforeOrEqualTo', () => {
    test('before', () => expect(dateIsBeforeOrEqualTo('2020-03-16', '2020-03-20')).toBe(true));
    test('same', () => expect(dateIsBeforeOrEqualTo('2020-03-16', '2020-03-16')).toBe(true));
    test('after', () => expect(dateIsBeforeOrEqualTo('2020-03-20', '2020-03-16')).toBe(false));
  });

  describe('scrape date', () => {
    beforeEach(() => {
      process.env.SCRAPE_DATE = '2020-3-16';
    });

    afterEach(() => {
      delete process.env.SCRAPE_DATE;
    });

    describe('scrapeDateIsBefore', () => {
      test('before', () => expect(scrapeDateIsBefore('2020-3-20')).toBe(true));
      test('same', () => expect(scrapeDateIsBefore('2020-3-16')).toBe(false));
      test('after', () => expect(scrapeDateIsBefore('2020-3-10')).toBe(false));
    });

    describe('scrapeDateIsAfter', () => {
      test('before', () => expect(scrapeDateIsAfter('2020-3-20')).toBe(false));
      test('same', () => expect(scrapeDateIsAfter('2020-3-16')).toBe(false));
      test('after', () => expect(scrapeDateIsAfter('2020-3-10')).toBe(true));
    });

    describe('scrapeDateIs', () => {
      test('before', () => expect(scrapeDateIs('2020-3-20')).toBe(false));
      test('same', () => expect(scrapeDateIs('2020-3-16')).toBe(true));
      test('after', () => expect(scrapeDateIs('2020-3-10')).toBe(false));
    });
  });
});
