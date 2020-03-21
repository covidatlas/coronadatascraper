/**
 * This file contains the caching implementation. We provide caching to reduce strain on official data sources
 * and to store changes to each source on a day to day basis.
 */

import path from 'path';
import crypto from 'crypto';

import * as datetime from './datetime.js';
import * as fs from './fs.js';

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
 * Get the path of cache for the given URL at the given date
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 */
export const getCachedFilePath = (url, type, date = false) => {
  // This data probably has its own timeseries in it
  // Use local cache, assumed to be recent
  const cachePath = date === false ? TIMESERIES_CACHE_PATH : path.join(DEFAULT_CACHE_PATH, date);

  const urlHash = hash(url);
  const extension = type || path.extname(url) || 'txt';

  const filePath = path.join(cachePath, `${urlHash}.${extension}`);

  return filePath;
};

/**
  Get the cache for the following URL at a given date.

  If the date requested is before today, and no cache is available, we will be unable to fetch this URL, hence
  the function returns `RESOURCE_UNAVAILABLE`.

  If we are able to fetch this URL (because it is a timeseries or we are requesting today's data), the function
  returns `CACHE_MISS`.

  * @param {*} url URL of the cached resource
  * @param {*} type type of the cached resource
  * @param {*} date the date associated with this resource, or false if a timeseries data
*/
export const getCachedFile = async (url, type, date) => {
  const filePath = getCachedFilePath(url, type, date);

  if (await fs.exists(filePath)) {
    console.log('  ⚡️ Cache hit for %s from %s', url, filePath);
    return fs.readFile(filePath);
  }
  if (date && datetime.dateIsBefore(new Date(date), datetime.getDate())) {
    console.log('  ⚠️ Cannot go back in time to get %s, no cache present', url);
    return RESOURCE_UNAVAILABLE;
  }
  console.log('  🐢  Cache miss for %s at %s', url, filePath);
  return CACHE_MISS;
};

/**
 * Saves a file to cache, at the provided date
 *
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} data file data to be saved
 */
export const saveFileToCache = async (url, type, date, data) => {
  const filePath = getCachedFilePath(url, type, date);
  return fs.writeFile(filePath, data, { silent: true });
};
