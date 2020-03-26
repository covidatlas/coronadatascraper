import { today, now, parse } from './isoDate.js';

const setMockDate = d => jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date(d).valueOf());

describe('localDate', () => {
  describe('today.here', () => {
    it('returns the current date in the current timezone', () => {
      setMockDate('2020-03-16');
      expect(today.here()).toEqual('2020-03-16');
    });
  });

  describe('today.at', () => {
    it('returns the current date in Australia', () => {
      setMockDate('2020-03-16T23:45Z');
      expect(today.at('Australia/Sydney')).toEqual('2020-03-17'); // next day
    });
  });

  describe('now.here', () => {
    it('returns the current time in the current timezone', () => {
      setMockDate('2020-03-16T23:45');
      expect(now.here()).toEqual('2020-03-16T23:45');
    });
  });

  describe('now.at', () => {
    it('returns the current time in Australia', () => {
      setMockDate('2020-03-16T23:45');
      expect(now.at('Australia/Sydney')).toEqual('2020-03-17T09:45'); // 10 hrs later, next day
    });
  });

  describe('parse', () => {
    it('accepts a JS Date', () => {
      const d = new Date('2020-03-16');
      expect(parse(d).toString()).toEqual('2020-03-16');
    });

    it('accepts an ISO date string', () => {
      const d = '2020-03-16';
      expect(parse(d).toString()).toEqual('2020-03-16');
    });

    it('accepts an ISO datetime string', () => {
      const d = '2020-03-16T23:45:00Z';
      expect(parse(d).toString()).toEqual('2020-03-16');
    });
  });
});
