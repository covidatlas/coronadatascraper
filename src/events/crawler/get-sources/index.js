import loadSources from './load-sources.js';
import validateSources from './validate-sources.js';

async function fetchSources(options) {
  const sources = await loadSources(options);
  const errors = validateSources(sources);
  return { sources, validationErrors: errors };
}

export default fetchSources;
