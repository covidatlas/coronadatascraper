const imports = require('esm')(module);

const generate = imports('../index.js').default;
const argv = imports('./cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

generate(argv.date, argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
