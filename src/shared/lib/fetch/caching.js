/* eslint-disable no-unused-vars */

/**
 * This file contains the caching implementation. We provide caching to reduce strain on official data sources
 * and to store changes to each source on a day to day basis.
 */

import path from 'path';
import crypto from 'crypto';
import fsBuiltIn from 'fs';

import join from '../join.js';
import datetime from '../datetime/index.js';
import * as fs from '../fs.js';
import log from '../log.js';

const DEFAULT_CACHE_PATH = 'coronadatascraper-cache';
const TIMESERIES_CACHE_PATH = 'cache';

export const CACHE_MISS = null;
export const RESOURCE_UNAVAILABLE = undefined;

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

// Migrate the file to a temp folder.
// New format:
// crawler-cache/us-ca-xx-county/2020-04-12/2020-04-12t00_47_14.145z-default-344b7.html
function migrateFile(url, filePath, encoding, scraper, date, cacheKey, type) {
  console.log(`Migrating ${filePath}`);
  const content = fsBuiltIn.readFileSync(filePath, encoding);
  const sha = hashContent(content, 5);
  const topdir = newTopFolder(scraper._path);
  const dt = datetime.old.getYYYYMMDD(date);
  const tm = `${dt}t21_00_00.000z`;
  const destdir = join(process.cwd(), process.env.MIGRATE_CACHE_DIR, topdir, dt);
  const fname = `${tm}-${cacheKey}-${sha}.${type}`;

  fsBuiltIn.mkdirSync(destdir, { recursive: true });

  const destfile = join(destdir, fname);
  checkCacheKeyCollision(cacheKey, destdir);
  if (fsBuiltIn.existsSync(destfile)) {
    const msg = `${topdir}/${dt}/${fname} ALREADY EXISTS (called for ${url})`;
    throw new Error(msg);
  }

  console.log(`Migrating ${filePath} to ${destfile.replace(process.cwd(), '')}`);
  fsBuiltIn.copyFileSync(filePath, destfile);

  // TODO ZIP THE FILE.
}

/* End cache migration helpers */

/**
  MD5 hash a given string
*/
const hash = str => {
  return crypto
    .createHash('md5')
    .update(str)
    .digest('hex');
};

/**
 * Get the filename of the cache for the given URL
 * @param {string} url URL of the cached resource
 * @param {string} type type of the cached resource
 */
export const getCachedFileName = (url, type) => {
  const urlHash = hash(url);
  const extension = type || path.extname(url).replace(/^\./, '') || 'txt';
  return `${urlHash}.${extension}`;
};

/**
 * Get the path of cache for the given URL at the given date
 * @param {string} url URL of the cached resource
 * @param {string} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 */
export const getCachedFilePath = (scraper, url, type, date = false) => {
  // FIXME when we roll out new TZ support!
  if (date) date = datetime.old.getYYYYMD(date);
  let cachePath = date === false ? TIMESERIES_CACHE_PATH : join(DEFAULT_CACHE_PATH, date);
  // Rewire cache path for testing
  if (process.env.OVERRIDE_CACHE_PATH) cachePath = process.env.OVERRIDE_CACHE_PATH;
  return join(cachePath, getCachedFileName(url, type));
};

/**
  Get the cache for the following URL at a given date.

  If the date requested is before today, and no cache is available, we will be unable to fetch this URL, hence
  the function returns `RESOURCE_UNAVAILABLE`.

  If we are able to fetch this URL (because it is a timeseries or we are requesting today's data), the function
  returns `CACHE_MISS`.

  * @param {*} scraper the scraper requesting the file
  * @param {string} url URL of the cached resource
  * @param {string} type type of the cached resource
  * @param {*} date the date associated with this resource, or false if a timeseries data
  * @param {string} encoding for the resource to access, default to utf-8
*/
export const getCachedFile = async (scraper, url, cacheKey, type, date, encoding = 'utf8') => {
  if (scraper === undefined || scraper === null) throw new Error(`Undefined scraper, trying to hit ${url}`);

  const filePath = getCachedFilePath(scraper, url, type, date);

  const cacheExists = await fs.exists(filePath);
  if (cacheExists) {
    log('  ⚡️ Cache hit for %s from %s', url, filePath);
  }

  // Logging cache calls if LOG_CACHE_CALLS is set.
  if (process.env.LOG_CACHE_CALLS) {
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
    fsBuiltIn.appendFile(join(process.cwd(), 'log_cacheCalls.txt'), newData, err => {
      if (err) throw err;
    });
  }

  // If we're doing a cache migration, write the file (with
  // appropriate filename) to the other location.
  // Final format is:
  if (process.env.MIGRATE_CACHE_DIR && cacheExists) {
    migrateFile(url, filePath, encoding, scraper, date, cacheKey, type);
  }

  if (cacheExists) {
    return fs.readFile(filePath, encoding);
  }
  if (date && datetime.dateIsBefore(date, datetime.old.getDate())) {
    log('  ⚠️ Cannot go back in time to get %s, no cache present', url, filePath);
    return RESOURCE_UNAVAILABLE;
  }
  const shortName = (scraper._path || 'unknown').replace(/^.*scrapers/, '');
  log('  🐢  Cache miss for scraper: %s; url: %s; filepath: %s', shortName, url, filePath);
  return CACHE_MISS;
};

/**
 * Saves a file to cache, at the provided date
 *
 * @param {string} url URL of the cached resource
 * @param {string} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} data file data to be saved
 */
export const saveFileToCache = async (scraper, url, type, date, data) => {
  const filePath = getCachedFilePath(scraper, url, type, date);
  return fs.writeFile(filePath, data, { silent: true });
};
