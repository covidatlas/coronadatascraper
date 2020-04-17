/**
 *
 * Helper script to run through all of the dates in
 * coronadatascraper-cache, generating reports, and as a side effect
 * copying all cache hits to the v1.0 cache directory structure and
 * filename format.
 *
 * Usage (with optional log redirection):
 * node ${this_file} --dest folder  [--date foldername]  >> yourlogfile.txt 2>&1
 *
 *
 * Sample calls:
 *
 * # All cache folders in coronadatascraper-cache:
 * node ${this_file} --dest zz-migration
 *
 * # Just one date in coronadatascraper-cache:
 * node ${this_file} --dest zz-migration  --date 2020-4-13
 *
 *
 * If you get an error "Error:   KEY COLLISION", this means that a migration
 * has attempted to write the same "source name"/"cache key" for a given date
 * to a given output directory.
 *
 */

const imports = require('esm')(module);
const path = require('path');
const glob = require('fast-glob').sync;

const yargs = imports('yargs');

const { execSync } = imports('child_process');

// Utils /////////////////////////////////////////

function runCommand(cmd) {
  // inherit dumps io to stdout
  execSync(cmd, { stdio: 'inherit' });
}

function getFolders() {
  const ret = glob(path.join('coronadatascraper-cache', '**'), { onlyDirectories: true });
  return ret.map(s => s.replace(/coronadatascraper-cache./, ''));
}

// Entry point /////////////////////////////////////////

const { argv } = yargs
  .option('dest', {
    alias: 'd',
    description: 'Destination folder',
    type: 'string'
  })
  .option('date', {
    alias: 'f',
    description: 'Single date in coronadatascraper-cache to migrate',
    type: 'string'
  })
  .demand(['dest'], 'Please specify output dir')
  .version(false)
  .help();

const allFolders = getFolders();

let dirs = allFolders;
if (argv.date) {
  dirs = dirs.filter(d => d === argv.date);
}

if (dirs.length === 0) {
  console.log(`No directory named ${argv.date} in coronadatascraper-cache.  Quitting`);
  process.exit();
}

console.log(`Migrating ${dirs.length} directories.`);
dirs.forEach(d => {
  console.log('\n\n========================================');
  console.log(`Migrating ${d}`);
  const cmd = `MIGRATE_CACHE_DIR=${argv.dest} yarn start --onlyUseCache -d ${d}`;
  console.log(`# Command: ${cmd}`);
  runCommand(cmd);
});

const migrated = glob(path.join(argv.dest, '**', '*.*'), { onlyFiles: true });
console.log('\n\nMigration complete.');
console.log(`${migrated.length} files written to ${argv.dest}`);
