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
 * # Just all dates, just one location:
 * node ${this_file} --dest zz-migration  --location US/WA
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
const spacetime = require('spacetime');

const datetime = imports('../src/shared/lib/datetime').default;
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
  .option('location', {
    alias: 'l',
    description: 'Single location to migrate',
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
  if (argv.date === 'latest') {
    let latest = datetime.today.at('America/Los_Angeles');
    latest = spacetime(latest)
      .subtract(1, 'day')
      .format('iso-short');
    latest = datetime.getYYYYMD(latest);
    argv.date = latest;
  }
  dirs = dirs.filter(d => d === argv.date);
}

if (dirs.length === 0) {
  console.log(`No directory named ${argv.date} in coronadatascraper-cache.  Quitting`);
  process.exit();
}

function migrateDirs(dirs, argv) {
  console.log(`Migrating ${dirs.length} directories.`);
  dirs.forEach(d => {
    console.log('\n\n========================================');
    let msg = `Migrating ${d}`;
    let cmd = `MIGRATE_CACHE_DIR=${argv.dest} yarn start --onlyUseCache -d ${d}`;
    if (argv.location) {
      msg = `${msg} for location ${argv.location}`;
      cmd = `${cmd} --location ${argv.location}`;
    }
    console.log(msg);
    console.log(`# Command: ${cmd}`);
    runCommand(cmd);
  });

  const migrated = glob(path.join(argv.dest, '**', '*.*'), { onlyFiles: true });
  console.log('\n\nMigration complete.');
  console.log(`${migrated.length} files written to ${argv.dest}`);
}

// If a cache folder has multiple files, none of them should have
// cache key 'default'.  If it has one file, it must have cache key
// 'default'.
function checkDefaultCacheKeySpecs(destdir) {
  const fulldest = path.join(process.cwd(), destdir);
  console.log(`Checking default key specs in ${fulldest}`);
  const pattern = path.join(fulldest, '**').replace(/\\/, '/');

  const allfiles = glob(pattern);
  const folders = allfiles
    .map(f => f.replace(fulldest + path.sep, ''))
    .map(f => f.split(path.sep))
    .map(a => path.join(a[0], a[1]))
    .filter((f, index, self) => {
      return self.indexOf(f) === index;
    }); // uniques

  const errors = [];

  folders.forEach(d => {
    // Files in the folder
    const files = allfiles
      .filter(f => f.includes(d))
      .map(f => f.split(d))
      .map(a => a[a.length - 1]);

    // The keys for the files (format: 'lotsofstuff-{cachekey}-{sha}.extension')
    let keys = files.map(f => f.split('-')).map(a => a[a.length - 2]);

    // Ignore the 'intermediary files'
    const intermediaries = ['tmpindex', 'tempindex', 'tmpcsrf', 'arcorgid', 'arcgis'];
    keys = keys.filter(s => !intermediaries.includes(s));

    if (keys.length === 0) {
      errors.push(`${d}: No files??`);
    }

    const defaults = keys.filter(k => k === 'default');
    if (keys.length === 1) {
      if (defaults.length !== 1) {
        const msg = `${d}: DEFAULT CACHE KEY, single file should have key 'default', got ${keys}`;
        errors.push(msg);
      }
    } else if (defaults.length > 0) {
      const msg = `${d}: DEFAULT CACHE KEY, no file in multifile cache dir should have key 'default', got ${keys.join(
        ', '
      )}`;
      errors.push(msg);
    }

    console.log(`   ${d} keys ok.`);
  });

  if (errors.length > 0) {
    console.log('==================================================================');
    console.log('RAW ERRORS:');
    errors.forEach(e => console.log(e));

    console.log('==================================================================');
    const badScrapers = errors
      .map(s => s.split(path.sep)[0])
      .filter((f, index, self) => {
        return self.indexOf(f) === index;
      }); // uniques
    console.log('FIX SCRAPERS:');
    badScrapers.forEach(s => console.log(s));
  }
}

migrateDirs(dirs, argv);
checkDefaultCacheKeySpecs(argv.dest);
