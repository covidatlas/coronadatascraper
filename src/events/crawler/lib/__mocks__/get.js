/* eslint-disable import/prefer-default-export */
import sanitizeUrl from '../__test_utils__/sanitizeUrl.js';

/**
 * This function mocks the `get` function for testing. To use it, first pass an object of sources to `get.setSources`.
 * If the given test suite only makes one call to `get`, you can just
 * @param {*} url The URL passed to `get`.
 */
const mockGet = async url => {
  const keys = Object.keys(mockGet.sources);
  const urlKey = sanitizeUrl(url);
  const sourceKey = keys.find(key => key.startsWith(urlKey));
  if (sourceKey === undefined) {
    console.log({ url, keys, sourceKey });
    throw new Error(`You need to provide a mock source for ${url}. The file should be called ${urlKey}`);
  }
  return mockGet.sources[sourceKey];
};

mockGet.sources = {};

mockGet.setSources = s => {
  mockGet.sources = { ...mockGet.sources, ...s };
};

export const get = mockGet;
