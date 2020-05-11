const imports = require('esm')(module);

const { generateTimeseries, writeFiles } = imports('../timeseries/index.js');
const argv = imports('./cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateTimeseries(argv)
  .then(result => writeFiles(argv, result.timeseriesByLocation, result.featureCollection))
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
