import loadSources from './load-sources.js';
import validateSources from './validate-sources.js';

const fetchSources = async args => loadSources(args).then(validateSources);

export default fetchSources;
