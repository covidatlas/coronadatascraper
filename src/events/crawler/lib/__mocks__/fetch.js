let sources;
const _fetch = jest.requireActual('../fetch.js');

console.log(_fetch);

_fetch.fetch = async url => {
  const sourceKey = Object.keys(sources).find(key => url.endsWith(key));
  if (sourceKey === undefined)
    throw new Error(`You need to provide a mock source for ${url} using fetch.addMockSources().`);
  return sources[sourceKey];
};

_fetch.mockSources = s => {
  sources = s;
};

module.exports = _fetch;
