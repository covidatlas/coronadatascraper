const imports = require('esm')(module);

const generate = imports('./tasks/index.js').default;
const argv = imports('./lib/cliArgs.js').default;

generate(argv.date, argv).catch(e => {
  throw e;
});
