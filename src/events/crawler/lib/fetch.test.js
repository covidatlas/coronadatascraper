import * as mockFs from './__test_utils__/fs.js';

import * as fetch from './fetch.js';
import * as caching from './caching.js';

describe('Fetching', () => {
  beforeAll(() => {
    jest.setTimeout(30000);
  });

  afterAll(() => {
    jest.setTimeout(5000);
  });

  describe('fetch', () => {
    test('when fetching an example url, we get the correct data back', async () => {
      const key = 'foo1';
      const value = 'bar1';

      mockFs.mock({});

      const body = await fetch.fetch(`https://postman-echo.com/get?${key}=${value}`, 'json');

      const jsonBody = JSON.parse(body);

      expect(jsonBody.args[key]).toBe(value);

      mockFs.restore();
    });

    test('when fetching a URL in cache, we get the cached version', async () => {
      const wrongKey = 'foo1';
      const wrongValue = 'bar1';

      const key = 'foo2';
      const value = 'bar2';

      const url = `https://postman-echo.com/get?${wrongKey}=${wrongValue}`;
      const type = 'json';
      const date = false;

      // Simulate a cached version of this file
      mockFs.mock({
        [caching.getCachedFilePath(url, type, date)]: `{"args": {"${key}": "${value}"}}`
      });

      const body = await fetch.fetch(url, type, date);

      const jsonBody = JSON.parse(body);

      expect(jsonBody.args[key]).toBe(value);

      mockFs.restore();
    });

    test('when fetching a URL in cache with alwaysRun=true, we fetch a new version', async () => {
      const wrongKey = 'foo1';
      const wrongValue = 'bar1';

      const key = 'foo2';
      const value = 'bar2';

      const url = `https://postman-echo.com/get?${key}=${value}`;
      const type = 'json';
      const date = false;

      // Simulate a cached version of this file
      mockFs.mock({
        [caching.getCachedFilePath(url, type, date)]: `{"args": {"${wrongKey}": "${wrongValue}"}}`
      });

      const body = await fetch.fetch(url, type, date, { alwaysRun: true });

      const jsonBody = JSON.parse(body);

      expect(jsonBody.args[key]).toBe(value);

      mockFs.restore();
    });

    test('when fetching a URL with disableSSL=true, fetching should work', async () => {
      const key = 'foo2';
      const value = 'bar2';

      const url = `https://postman-echo.com/get?${key}=${value}`;
      const type = 'json';
      const date = false;

      // Simulate a cached version of this file
      mockFs.mock({});

      const body = await fetch.fetch(url, type, date, { alwaysRun: true, disableSSL: true });

      const jsonBody = JSON.parse(body);

      expect(jsonBody.args[key]).toBe(value);

      mockFs.restore();
    });
  });

  describe('headless', () => {
    test('when fetching an example url, we get the correct data back', async () => {
      const key = 'foo1';
      const value = 'bar1';

      mockFs.restore();
      const body = (
        await fetch.headless(`https://postman-echo.com/get?${key}=${value}`, 'json', { alwaysRun: true })
      ).text();

      const jsonBody = JSON.parse(body);

      expect(jsonBody.args[key]).toBe(value);
    });
  });
});
