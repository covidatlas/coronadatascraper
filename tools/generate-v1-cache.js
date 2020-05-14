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
const fs = require('fs');

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
  .option('check', {
    alias: 'c',
    description: 'Only check, do not migrate',
    type: 'boolean'
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

// Convert eg 'US/TN/index.js' to 'us-tn', that's the Li key, and is the folder name.
function newTopFolder(scraperPath) {
  const ret = scraperPath
    .replace(/^.*?src.shared.scrapers./, '')
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/\.js$/, '')
    .replace('-index', '');
  return ret;
}

const scrapers = [
  'AT/index.js',
  'AU/ACT/index.js',
  'AU/aus-from-wa-health/index.js',
  'AU/index.js',
  'AU/NSW/index.js',
  'AU/NT/index.js',
  'AU/QLD/index.js',
  'AU/SA/index.js',
  'AU/TAS/index.js',
  'AU/VIC/index.js',
  'AU/WA/index.js',
  'BE/index.js',
  'BR/index.js',
  'CA/index.js',
  'CA/NS/index.js',
  'CH/index.js',
  'CY/index.js',
  'CZ/index.js',
  'DE/index.js',
  'EE/index.js',
  'ES/index.js',
  'FR/index.js',
  'GB/index.js',
  'GB/SCT/index.js',
  'ID/index.js',
  'IE/index.js',
  'IN/index.js',
  'IT/index.js',
  'jhu-usa.js',
  'jhu.js',
  'JP/index.js',
  'KR/index.js',
  'LT/index.js',
  'LV/index.js',
  'NL/index.js',
  'NZ/index.js',
  'PA/index.js',
  'PL/index.js',
  'PR/index.js',
  'RU/index.js',
  'SA/index.js',
  'SE/index.js',
  'SI/index.js',
  'TH/index.js',
  'TW/index.js',
  'UA/index.js',
  'US/AK/index.js',
  'US/AL/index.js',
  'US/AR/index.js',
  'US/AZ/index.js',
  'US/CA/alameda-county.js',
  'US/CA/butte-county.js',
  'US/CA/calaveras-county.js',
  'US/CA/colusa-county.js',
  'US/CA/contra-costa-county.js',
  'US/CA/del-norte-county.js',
  'US/CA/fresno-county.js',
  'US/CA/glenn-county.js',
  'US/CA/kern-county.js',
  'US/CA/kings-county/index.js',
  'US/CA/los-angeles-county.js',
  'US/CA/madera-county.js',
  'US/CA/marin-county.js',
  'US/CA/mendocino-county.js',
  'US/CA/merced-county.js',
  'US/CA/mercury-news.js',
  'US/CA/mono-county.js',
  'US/CA/monterey-county.js',
  'US/CA/orange-county.js',
  'US/CA/placer-county.js',
  'US/CA/riverside-county.js',
  'US/CA/sacramento-county.js',
  'US/CA/san-benito-county.js',
  'US/CA/san-bernardino-county.js',
  'US/CA/san-diego-county.js',
  'US/CA/san-francisco-county.js',
  'US/CA/san-joaquin-county.js',
  'US/CA/san-luis-obispo-county.js',
  'US/CA/san-mateo-county.js',
  'US/CA/santa-barbara-county.js',
  'US/CA/santa-clara-county.js',
  'US/CA/santa-cruz-county.js',
  'US/CA/shasta-county.js',
  'US/CA/solano-county.js',
  'US/CA/sonoma-county-argcgis.js',
  'US/CA/sonoma-county.js',
  'US/CA/stanislaus-county.js',
  'US/CA/ventura-county.js',
  'US/CA/yolo-county.js',
  'US/CO/index.js',
  'US/covidtracking.js',
  'US/CT/index.js',
  'US/DC/index.js',
  'US/DE/index.js',
  'US/FL/index.js',
  'US/GA/index.js',
  'US/GU/index.js',
  'US/HI/index.js',
  'US/IA/index.js',
  'US/ID/index.js',
  'US/IL/index.js',
  'US/IN/index.js',
  'US/KS/index.js',
  'US/KY/index.js',
  'US/LA/index.js',
  'US/MA/index.js',
  'US/MD/index.js',
  'US/ME/index.js',
  'US/MI/index.js',
  'US/MN/index.js',
  'US/MO/index.js',
  'US/MO/st-louis-county.js',
  'US/MS/index.js',
  'US/MT/index.js',
  'US/NC/index.js',
  'US/ND/index.js',
  'US/NE/index.js',
  'US/NH/index.js',
  'US/NJ/index.js',
  'US/NM/index.js',
  'US/NV/carson-city.js',
  'US/NV/clark-county.js',
  'US/NV/nye-county.js',
  'US/NV/washoe-county/index.js',
  'US/NY/index.js',
  'US/nyt-counties.js',
  'US/OH/index.js',
  'US/OK/index.js',
  'US/OR/index.js',
  'US/PA/index.js',
  'US/RI/index.js',
  'US/SC/index.js',
  'US/SD/index.js',
  'US/TN/index.js',
  'US/TX/index.js',
  'US/UT/index.js',
  'US/VA/index.js',
  'US/VT/index.js',
  'US/WA/index.js',
  'US/WI/index.js',
  'US/WV/index.js',
  'US/WY/index.js',
  'VI/index.js',
  'ZA/index.js'
];

const earliest = [];

function migrateDirs(dirs, argv) {
  console.log(`Migrating ${dirs.length} directories.`);
  dirs.forEach(d => {
    console.log('\n\n========================================');

    const toRemove = [];
    let msg = `Migrating ${d}, ${scrapers.length} scrapers left`;
    console.log(msg);

    if (scrapers.length === 0) {
      console.log('DONE!!!');
      console.log(JSON.stringify(earliest, null, 2));
      process.exit(0);
    }
      
    let cmd = `MIGRATE_CACHE_DIR=${argv.dest} yarn start --onlyUseCache -d ${d} --location ${scrapers.join(',')}`;
    console.log(`# Command: ${cmd}`);
    runCommand(cmd);

    scrapers.forEach(s => {
      const migDir = path.join(argv.dest, newTopFolder(s));
      console.log('Checking for ' + migDir);
      if (fs.existsSync(migDir)) {
        // the location was migrated for that date
        console.log(`Migrated ${s} on ${d}`);
        toRemove.push(s);
        earliest.push({ scraper: s, date: d });
      }
      else {
        // console.log(`NOT migrated: ${s}`);
      }
    });

    // Remove from the list, don't bother to check it again!
    toRemove.forEach(r => {
      if (scrapers.includes(r)) scrapers.splice(scrapers.indexOf(r), 1);
    });
  });

  const migrated = glob(path.join(argv.dest, '**', '*.*'), { onlyFiles: true });
  console.log('\n\nMigration complete.');
  console.log(`${migrated.length} files written to ${argv.dest}`);

}

function checkFolder(allfiles, d, errors) {
  function debug(h, s) {
    if (d !== 'the/id/date/you/are/checking') return;
    console.log('---------------------');
    console.log(h);
    console.log(s);
    console.log('---------------------');
  }

  debug(
    'filt',
    allfiles.filter(f => f.includes(d))
  );

  // Files in the folder
  const files = allfiles
    .filter(f => f.includes(`${path.sep}${d}`))
    .map(f => f.split(d))
    .map(a => a[a.length - 1]);
  debug('files', files);

  // The keys for the files (format: 'lotsofstuff-{cachekey}-{sha}.extension')
  let keys = files.map(f => f.split('-')).map(a => a[a.length - 2]);
  debug('keys', keys);

  // Ignore the 'intermediary files'
  const intermediaries = ['tmpindex', 'tempindex', 'tmpcsrf', 'arcorgid', 'arcgis'];
  keys = keys.filter(s => !intermediaries.includes(s));
  debug('filtered keys', keys);

  if (keys.length === 0) {
    errors.push(`${d}: No files??`);
  }

  const defaults = keys.filter(k => k === 'default');
  debug('defaults', defaults);
  if (keys.length === 1) {
    if (defaults.length !== 1) {
      const msg = `${d}: DEFAULT ERR, single file should have key 'default', got ${keys}`;
      errors.push(msg);
    }
  } else if (defaults.length > 0) {
    const msg = `${d}: DEFAULT ERR, no file in multifile dir should have key 'default', got ${keys.join(', ')}`;
    errors.push(msg);
  }
  // console.log(`   ${d} keys ok.`);
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

  folders.forEach(d => checkFolder(allfiles, d, errors));

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

if (!argv.check) {
  console.log('migrating');
  migrateDirs(dirs, argv);
}
checkDefaultCacheKeySpecs(argv.dest);
