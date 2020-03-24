/* eslint-disable import/prefer-default-export */

import path from 'path';

const mock = async url => {
  const ext = path.extname(url);
  const urlKey = path.basename(url, ext);
  const sourceKey = Object.keys(mock.sources).find(key => urlKey.endsWith(key));
  if (sourceKey === undefined)
    throw new Error(`You need to provide a mock source for ${url} using fetch.addMockSources().`);
  return mock.sources[sourceKey];
};

mock.sources = {};

mock.setSources = s => {
  mock.sources = {
    ...mock.sources,
    ...s
  };
};

export const get = mock;
