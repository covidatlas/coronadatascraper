const imports = require('esm')(module);

const generate = imports('./tasks/index.js').default;
const argv = imports('./lib/cliArgs.js').default;

const clearAllTimeouts = imports('./utils/timeouts.js').default;

generate(argv.date, argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
