import getCachedFilePath from './_get-cached-file-path.js';
import log from '../../../log.js';
import * as fs from '../../../fs.js';
import datetime from '../../../datetime/index.js';

export const CACHE_MISS = null;
export const RESOURCE_UNAVAILABLE = undefined;

/**
  Get the cache for the following URL at a given date.

  If the date requested is before today, and no cache is available, we will be unable to fetch this URL, hence
  the function returns `RESOURCE_UNAVAILABLE`.

  If we are able to fetch this URL (because it is a timeseries or we are requesting today's data), the function
  returns `CACHE_MISS`.

  * @param {*} url URL of the cached resource
  * @param {*} type type of the cached resource
  * @param {*} date the date associated with this resource, or false if a timeseries data
  * @param {*} encoding for the resource to access, default to utf-8
*/
export default async function getCachedFile(url, type, date, encoding = 'utf8') {
  const filePath = getCachedFilePath(url, type, date);

  if (await fs.exists(filePath)) {
    log('  ⚡️ Cache hit for %s from %s', url, filePath);
    return fs.readFile(filePath, encoding);
  }
  if (date && datetime.dateIsBefore(date, datetime.old.getDate())) {
    log('  ⚠️ Cannot go back in time to get %s, no cache present', url, filePath);
    return RESOURCE_UNAVAILABLE;
  }
  log('  🐢  Cache miss for %s at %s', url, filePath);
  return CACHE_MISS;
}
