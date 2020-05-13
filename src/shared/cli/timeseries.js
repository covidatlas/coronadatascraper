const imports = require('esm')(module);

const generateLiFiles = imports('../../../tools/generate-li-dist-raw-files.js').default;
const { generateTimeseries, writeFiles } = imports('../timeseries/index.js');
const argv = imports('./cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateLiFiles(argv);

generateTimeseries(argv)
  .then(result => writeFiles(argv, result.timeseriesByLocation, result.featureCollection))
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
