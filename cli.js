const imports = require('esm')(module);

const generate = imports('./index.js').default;
const argv = imports('./lib/cliArgs.js').default;

generate(argv.date, argv);
