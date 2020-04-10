let timeseries = {};
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  timeseries = require('../../../dist/timeseries-byLocation.json');
} catch (err) {
  console.error('Error loading location and timeseries data');
}

const entries = Object.entries(timeseries);

export default entries;
