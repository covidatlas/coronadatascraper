/* eslint-disable global-require */
let timeseries = {};
try {
  // eslint-disable-next-line import/no-unresolved
  timeseries = require('../../../dist/timeseries-byLocation.json');
} catch (err) {
  console.error('Error loading location and timeseries data');
}
/* eslint-enable global-require */

const entries = Object.entries(timeseries);

export default entries;
