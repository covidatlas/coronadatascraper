const imports = require('esm')(module);

const { generateTimeseries } = imports('../timeseries/index.js');
const argv = imports('./cli-args.js').default;

// Override whatever the user said, dump files.
argv.dumpRaw = true;

/** The timeseries code execs child processes to generate files, so we
 * need to tell that child process what parts of the code to run.
 * This is messy but we should do away with this code in the future
 * anyway. */
argv.runMethod = 'scrapeToRawFiles';

const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateTimeseries(argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
