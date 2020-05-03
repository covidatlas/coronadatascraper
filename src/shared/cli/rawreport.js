const imports = require('esm')(module);

const { generateReportsFromRawFiles } = imports('../index.js');
const argv = imports('./cli-args.js').default;
const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateReportsFromRawFiles(argv.date, argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
