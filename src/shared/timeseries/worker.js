const imports = require('esm')(module);

const generate = imports('../index.js').default;
const argv = imports('../cli/cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

generate(argv.date, argv)
  .then(data => {
    if (process.send) {
      // Send data back to the parent process
      process.send(data);
    }
  })
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
