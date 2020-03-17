// eslint-disable-next-line import/extensions
import rootCas from 'ssl-root-cas/latest.js';

// SSL Root Cas requires us to run this function once to fetch
// certificates
rootCas.inject();
