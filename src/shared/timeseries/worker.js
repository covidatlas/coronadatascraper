const imports = require('esm')(module);

const { scrapeToRawFiles, generateReportsFromCombinedRawFiles } = imports('../index.js');
const argv = imports('../cli/cli-args.js').default;

const clearAllTimeouts = imports('../utils/timeouts.js').default;

/** ALWAYS scrape to raw files, and combine with Li data, if any. */
scrapeToRawFiles(argv.date, argv)
  .then(() => generateReportsFromCombinedRawFiles(argv.date, argv))
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
