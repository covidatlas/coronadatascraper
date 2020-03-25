import loadSources from './loadSources.js';
import validateSources from './validateSources.js';

const fetchSources = async args => loadSources(args).then(validateSources);

export default fetchSources;
