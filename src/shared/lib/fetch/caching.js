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
import * as datetimeFormatting from '../datetime/iso/format.js';
import * as fs from '../fs.js';
import * as cacheMigration from './cache-migration.js';
import log from '../log.js';

const DEFAULT_CACHE_PATH = 'coronadatascraper-cache';
const TIMESERIES_CACHE_PATH = 'cache';

export const CACHE_MISS = null;
export const RESOURCE_UNAVAILABLE = undefined;

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

  if (process.env.LOG_CACHE_CALLS) {
    cacheMigration.logCacheCall(scraper, date, url, filePath, cacheExists, type);
  }

  if (process.env.MIGRATE_CACHE_DIR && cacheExists && date !== false) {
    // Write file with new v1.0 filename to other location.
    // NOTE: We're not migrating the timeseries cache!
    cacheMigration.migrateFile(url, filePath, encoding, scraper, date, cacheKey, type);
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
