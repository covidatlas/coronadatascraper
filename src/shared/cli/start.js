const imports = require('esm')(module);

const generateLiFiles = imports('../../../tools/generate-li-dist-raw-files.js').default;
const { scrapeToRawFiles, generateReportsFromCombinedRawFiles } = imports('../index.js');
const argv = imports('./cli-args.js').default;
const clearAllTimeouts = imports('../utils/timeouts.js').default;

generateLiFiles(argv);

scrapeToRawFiles(argv.date, argv)
  .then(() => generateReportsFromCombinedRawFiles(argv.date, argv))
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });
