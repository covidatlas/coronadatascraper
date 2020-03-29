/* eslint-disable import/prefer-default-export */
import sanitizeUrl from '../../sanitize-url.js';

/**
 * This function mocks the `get` function for testing. To use it, first pass an object of sources to
 * `get.addSources`.
 *
 * Example:
 *
 * ```js
 * // something.test.js
 *
 * import { get } from './lib/get.js';
 *
 * jest.mock('./lib/get.js');
 *
 * const sampleResponse = '<html>...</html>'
 * get.addSources({
 *  'www_source_com_covid19_data': sampleResponse
 * })
 * ```
 * Now if any subsequent code calls `get` (directly or indirectly) for the url
 * `https://www.source.com/covid19/data.html`, it will receive the value of `sampleResponse`.
 *
 * @param {*} url The URL passed to `get`.
 */
const mockGet = async url => {
  const keys = Object.keys(mockGet.sources);
  const urlKey = sanitizeUrl(url);
  const sourceKey = keys.find(key => key.startsWith(urlKey));
  if (sourceKey === undefined) {
    // console.log({ url, keys, sourceKey });
    throw new Error(`You need to provide a mock source for ${url} . The file should be called ${urlKey}`);
  }
  return mockGet.sources[sourceKey];
};

mockGet.sources = {};

mockGet.addSources = s => {
  mockGet.sources = { ...mockGet.sources, ...s };
};

export const get = mockGet;
