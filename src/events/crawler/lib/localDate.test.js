import { parse } from './localDate.js';

describe('localDate', () => {
  describe('parse', () => {
    test('from JS Date', () => {
      const d = new Date('2020-03-16');
      expect(parse(d).toString()).toEqual('2020-03-16');
    });

    test('from ISO string', () => {
      const d = '2020-03-16';
      expect(parse(d).toString()).toEqual('2020-03-16');
    });
  });
});
