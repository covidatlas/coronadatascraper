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

  folders.forEach(d => {
    // Files in the folder
    const files = allfiles
      .filter(f => f.includes(d))
      .map(f => f.split(d))
      .map(a => a[a.length - 1]);

    // Files that contain "default"
    const matches = files.filter(f => f.includes('default'));

    if (files.length === 0) {
      throw new Error(`No files in ${d} ??`);
    }

    if (files.length === 1) {
      if (matches.length !== 1) {
        const msg = `  DEFAULT CACHE KEY, single file should have key 'default' in ${d}`;
        throw new Error(msg);
      }
    } else if (matches.length > 0) {
      const msg = `  DEFAULT CACHE KEY, no file in multifile cache dir should have key 'default' in ${d}`;
      throw new Error(msg);
    }

    console.log(`   ${d} keys ok.`);
  });
}

checkDefaultCacheKeySpecs(argv.dest);
