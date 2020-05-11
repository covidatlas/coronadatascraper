/*
const imports = require('esm')(module);

const { generateTimeseries } = imports('../timeseries/index.js');
const argv = imports('./cli-args.js').default;

// Override whatever the user said, dump files.
argv.dumpRaw = true;
*/

throw new Error('Need to redo this code.');

/*
const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateTimeseries(argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
*/
