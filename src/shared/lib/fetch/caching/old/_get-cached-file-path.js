import getCachedFileName from './_get-cached-file-name.js';
import datetime from '../../../datetime/index.js';
import join from '../../../join.js';

const DEFAULT_CACHE_PATH = 'coronadatascraper-cache';
const TIMESERIES_CACHE_PATH = 'cache';

/**
 * Get the path of cache for the given URL at the given date
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 */
export default function getCachedFilePath(url, type, date = false) {
  // FIXME when we roll out new TZ support!
  if (date) date = datetime.old.getYYYYMD(date);
  let cachePath = date === false ? TIMESERIES_CACHE_PATH : join(DEFAULT_CACHE_PATH, date);
  // Rewire cache path for testing
  if (process.env.OVERRIDE_CACHE_PATH) cachePath = process.env.OVERRIDE_CACHE_PATH;
  return join(cachePath, getCachedFileName(url, type));
}
