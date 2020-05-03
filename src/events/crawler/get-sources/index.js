import loadSources from './load-sources.js';

async function fetchSources(options) {
  return await loadSources(options);
}

export default fetchSources;
