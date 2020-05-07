const imports = require('esm')(module);

const path = imports('path');
const reportPath = path.join(process.cwd(), 'dist', 'report.json');

// eslint-disable-next-line import/no-dynamic-require
const errs = require(reportPath).scrape.errors;

console.log('\nErrors:');
const realErrors = errs.filter(e => !/Deprecated/.test(e.err)).map(e => `${e.name} ... ${e.err}`);
console.log(realErrors);

console.log('------------------------------------------------------------');
console.log('\nDeprecated:');
const deprecated = errs.filter(e => /Deprecated/.test(e.err));
console.log(deprecated.map(e => e.name));
