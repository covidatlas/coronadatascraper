const imports = require('esm')(module);

const path = imports('path');
const fs = imports('fs');
const datetime = imports('../src/shared/lib/datetime/index.js').default;

const { execSync } = imports('child_process');

// Utils /////////////////////////////////////////

function runCommand(cmd) {
  // inherit dumps io to stdout
  execSync(cmd, { stdio: 'inherit' });
}

// ////////////////////

const today = datetime.today.utc();
console.log(today);

const distFolder = path.join(process.cwd(), 'dist');
console.log(distFolder);
fs.rmdirSync(distFolder, { recursive: true });
fs.mkdirSync(distFolder);

console.log('============================================================');

runCommand('yarn start');
runCommand(`yarn timeseries -d ${today} -e ${today}`);

console.log('============================================================');

const reportPath = path.join(distFolder, 'report.json');
// eslint-disable-next-line import/no-dynamic-require
const errs = require(reportPath).scrape.errors;

console.log('\nErrors:');
const realErrors = errs.filter(e => !/Deprecated/.test(e.err)).map(e => `${e.name} ... ${e.err}`);
console.log(realErrors);

console.log('------------------------------------------------------------');
console.log('\nDeprecated:');
const deprecated = errs.filter(e => /Deprecated/.test(e.err));
console.log(deprecated.map(e => e.name));

console.log('============================================================');
runCommand('yarn dev');
