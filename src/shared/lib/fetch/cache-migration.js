import crypto from 'crypto';
import fsBuiltIn from 'fs';
import path from 'path';
import zlib from 'zlib';

import spacetime from 'spacetime';
import * as datetimeFormatting from '../datetime/iso/format.js';

/** Cache migration helpers. *******************************
 *
 * A set of functions to copy files in the cache to the new v1.0 cache
 * file format.
 *
 * These functions are only used if process.env.MIGRATE_CACHE_DIR is set.
 *
 * When there's a hit for an existing file in the cache, that file is
 * written to the process.env.MIGRATE_CACHE_DIR subdir in project
 * root, in the appropriate subdir with the appropriate filename.
 *
 * If a file with the same cache key already exists in the folder,
 * that's an error: we need each file in the directory to have
 * different cache keys.
 *
 * e.g.,
 * MIGRATE_CACHE_DIR=zz_test yarn start
 */

export function logCacheCall(scraper, date, url, filePath, cacheExists, type) {
  const cacheCheck = {
    scraperPath: scraper._path,
    date,
    requestedUrl: url,
    cacheFilePath: filePath,
    cacheFileExists: cacheExists,
    type
  };

  // Write data to aid in cache migration.
  const newData = `${JSON.stringify(cacheCheck, null, 2)},\n`;
  fsBuiltIn.appendFile(path.join(process.cwd(), 'log_cacheCalls.txt'), newData, err => {
    if (err) throw err;
  });
}

function newTopFolder(scraperPath) {
  const ret = scraperPath
    .replace(/^.*?src.shared.scrapers./, '')
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/\.js$/, '')
    .replace('-index', '');
  return ret;
}

function hashContent(thing, len = 64) {
  return crypto
    .createHash('sha256')
    .update(thing)
    .digest('hex')
    .substr(0, len);
}

/** Every file in the directory should have a distinct cache key.
 *
 * This is b/c the current system (in this project) should really only
 * have one "file type" (which the cache key represents) per date.
 * If not, throw an error.
 */
function checkCacheKeyCollision(cacheKey, destdir) {
  const d = destdir.replace(process.cwd(), '');
  console.log(`  Checking collision of key '${cacheKey}' in ${d}`);
  const files = fsBuiltIn.readdirSync(destdir);
  // console.log(`  All files: ${files}`);
  if (files.length === 0) return;
  const matches = files.filter(f => f.includes(cacheKey));
  if (matches.length === 0) {
    console.log('  No collision.');
    return;
  }
  const msg = `  KEY COLLISION, already have key '${cacheKey}' in ${d} (${matches})`;
  throw new Error(msg);
}

function checkCacheKey(s) {
  const check = /^[a-z]+$/;
  if (check.test(s) !== true) {
    throw new Error(`Bad cache key ${s}`);
  }
}

// Migrate the file to a temp folder.
// New format:
// crawler-cache/us-ca-xx-county/2020-04-12/2020-04-12t00_47_14.145z-default-344b7.html.gz
export function migrateFile(url, filePath, encoding, scraper, date, cacheKey, type) {
  console.log(`MIGRATING ${filePath}`);

  checkCacheKey(cacheKey);

  const topdir = newTopFolder(scraper._path);
  const formattedDate = datetimeFormatting.getYYYYMMDD(date);
  const dt = spacetime(formattedDate)
    .add(1, 'day')
    .format('iso-short');
  const destdir = path.join(process.cwd(), process.env.MIGRATE_CACHE_DIR, topdir, dt);
  fsBuiltIn.mkdirSync(destdir, { recursive: true });

  checkCacheKeyCollision(cacheKey, destdir);

  // Some items use "bad" types -- e.g. call 'fetch.fetch' with type = 'txt' ...
  // This breaks li importing, Li can only handle certain extensions.
  let useType = type;
  if (type === 'txt') useType = 'raw';
  const allowedTypes = ['csv', 'html', 'json', 'html', 'pdf', 'tsv', 'raw'];
  if (!allowedTypes.includes(useType)) throw new Error(`Bad type ${useType} for file ${filePath}`);

  const tm = `${dt}t04_00_00.000z`; // Default all migrated files to 9 pm PT (4a UTC)
  const content = fsBuiltIn.readFileSync(filePath, encoding);
  const sha = hashContent(content, 5);
  const fname = `${tm}-${cacheKey}-${sha}.${useType}.gz`;
  const destfile = path.join(destdir, fname);
  if (fsBuiltIn.existsSync(destfile)) {
    const msg = `${topdir}/${dt}/${fname} ALREADY EXISTS (called for ${url})`;
    throw new Error(msg);
  }

  const compressed = zlib.gzipSync(content);
  fsBuiltIn.writeFileSync(destfile, compressed);
  console.log(`  Migrated to: ${destfile.replace(process.cwd(), '')}`);
}
