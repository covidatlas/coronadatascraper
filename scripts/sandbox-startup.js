const imports = require('esm')(module);

const fs = imports('../src/shared/lib/fs.js');

async function prepare() {
  console.log('🤹‍♀️ Preparing the sandbox...');

  await Promise.all([
    fs.ensureDir('src/http/get-sources/dist/'),
    fs.ensureDir('src/http/get-crosscheck/dist/'),
    fs.ensureDir('src/http/get-000location/dist/')
  ]);

  await Promise.all([
    fs.copyFile('dist/timeseries.json', 'public/timeseries.json'),
    fs.copyFile('dist/locations.json', 'public/locations.json'),
    fs.copyFile('dist/features.json', 'public/features.json'),
    fs.copyFile('dist/ratings.json', 'src/http/get-sources/dist/ratings.json'),
    fs.copyFile('dist/report.json', 'src/http/get-crosscheck/dist/report.json')
  ]);
}

module.exports = prepare;
