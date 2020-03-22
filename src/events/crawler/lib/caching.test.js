import each from 'jest-each';
import * as mockFs from './__test_utils__/fs.js';

import * as caching from './caching.js';
import * as datetime from './datetime.js';
import * as fs from './fs.js';

describe('caching', () => {
  describe('getCachedFilePath', () => {
    each([
      ['2020-03-01', /coronadatascraper-cache\/2020-03-01\/.*/],
      ['2020-02-03', /coronadatascraper-cache\/2020-02-03\/.*/],
      [false, /cache\/.*/]
    ]).test('when given date "%s", it returns the directory "%s"', (date, expected) => {
      expect(caching.getCachedFilePath('http://example.com', 'json', date)).toMatch(expected);
    });

    each([
      ['json', /.json$/g],
      ['csv', /.csv$/g],
      ['txt', /.txt$/g],
      ['html', /.html$/g]
    ]).test('when given extension "%s", it is present in the the cached file path', (ext, expected) => {
      expect(caching.getCachedFilePath('http://example.com', ext, '2020-03-16')).toMatch(expected);
    });

    each([
      ['https://example.com/somefile', 'html', false],
      ['https://example.com/testing', 'csv', '2020-03-06']
    ]).test('when given same parameters, we get the same output', (host, ext, date) => {
      expect(caching.getCachedFilePath(host, ext, date)).toBe(caching.getCachedFilePath(host, ext, date));
    });
  });

  describe('getCachedFile', () => {
    each([
      ['https://example.com/somefile', 'html', false],
      ['https://example.com/testing', 'csv', '2020-03-06']
    ]).test('when given a file that has been cached, it returns the file', async (host, ext, date) => {
      const fileContent = 'a test file';

      // Create a mock file system with the expected cached file
      mockFs.mock({
        [caching.getCachedFilePath(host, ext, date)]: fileContent
      });

      const outputFile = await caching.getCachedFile(host, ext, date);

      expect(outputFile).toBe(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });

    each([
      ['https://example.com/somefile', 'html', false],
      // For this example, we request a file for today. A cache miss for a file before today has a different behavior
      ['https://example.com/testing', 'csv', datetime.getYYYYMD()]
    ]).test(
      'when given a file that has been not been cached for today, it returns CACHE_MISS',
      async (host, ext, date) => {
        const outputFile = await caching.getCachedFile(host, ext, date);
        expect(outputFile).toBe(caching.CACHE_MISS);
      }
    );

    each([
      // For this example, we request a file for a day before today, meaning the resource cannot be fetched if not cached
      ['https://example.com/somefile', 'html', '2019-5-16'],
      ['https://example.com/testing', 'csv', '2020-1-2']
    ]).test(
      'when given a file that has been not been cached with a date before today, it returns RESOURCE_UNAVAILABLE',
      async (host, ext, date) => {
        const outputFile = await caching.getCachedFile(host, ext, date);
        expect(outputFile).toBe(caching.RESOURCE_UNAVAILABLE);
      }
    );
  });

  describe('saveFileToCache', () => {
    each([
      ['https://example.com/somefile', 'html', false],
      // For this example, we request a file for today. A cache miss for a file before today has a different behavior
      ['https://example.com/testing', 'csv', '2020-1-2']
    ]).test('when given a file, it saves it to cache', async (host, ext, date) => {
      const fileContent = 'a test file';

      // Create a mock file system with the expected cached file
      mockFs.mock({});

      await caching.saveFileToCache(host, ext, date, fileContent);

      const expectedFileContent = await fs.readFile(caching.getCachedFilePath(host, ext, date));

      expect(expectedFileContent).toBe(fileContent);

      // Don't forget to restore!
      mockFs.restore();
    });
  });
});
