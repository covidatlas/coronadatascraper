const imports = require('esm')(module);

const { generate, scrapeToRawFiles } = imports('../index.js');
const argv = imports('../cli/cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

let callMethod = generate;
if (argv.runMethod === 'scrapeToRawFiles') {
  callMethod = scrapeToRawFiles;
}

callMethod(argv.date, argv)
  .then(data => {
    if (data && process.send) {
      // Send data back to the parent process
      process.send(data);
    }
  })
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
