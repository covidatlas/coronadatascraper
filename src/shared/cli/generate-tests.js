const imports = require('esm')(module);

const argv = imports('./cli-args.js').default;
const generate = imports('../generate-tests.js').default;

generate(argv);
