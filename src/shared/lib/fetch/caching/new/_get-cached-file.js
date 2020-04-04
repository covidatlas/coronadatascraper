import fastGlob from 'fast-glob';
import datetime from '../../../datetime/index.js';
import * as fs from '../../../fs.js';
import getDateBounds from './_get-date-bounds.js';
import getLocalDateFromFilename from './_get-local-date-from-filename.js';
import hash from './_hash.js';
import join from '../../../join.js';
import log from '../../../log.js';
import sorter from './_sorter.js';

export const CACHE_MISS = null;
export const RESOURCE_UNAVAILABLE = undefined;

const local = !process.env.NODE_ENV || process.env.NODE_ENV === 'testing';

/**
 * Get the cache for the following URL at a given date
 *
 * If the date requested is before today and no cache is available, we can't get the URL, so return `RESOURCE_UNAVAILABLE`.
 *
 * If we're able to fetch this URL (because it's a timeseries or we are requesting today's data), the function returns `CACHE_MISS`.
 *
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} encoding for the resource to access, default to utf-8
 * @param {*} tz IANA timezone string for the locale requesting the cache
 */
export default async function getCachedFile(url, type, date, encoding = 'utf8', tz) {
  // FIXME date normalization needs to be locale-aware; right now the locale is assumed US/PT
  if (date === false) date = datetime.cast(); // For timeseries, set it to now US/PT
  date = datetime.getYYYYMMDD(date);

  if (local) {
    const folder = hash(url);

    const cachePath = join(process.cwd(), 'crawler-cache', folder);
    let folders = await fs.getFilesInDir(cachePath);

    /**
     * All cache data is saved with a 8601Z timestamp
     *   In order to match the date requested to the timestamp, we must re-cast it to the locale in question
     *   FIXME that can't happen yet, as we need tz to live in the scraper
     */
    if (folders.length) {
      // Sort from earliest to latest
      folders = sorter(folders);

      /**
       * Gather yesterday (UTC+), today, and tomorrow (UTC-)
       */
      let files = [];
      const today = folders.findIndex(f => f === date);
      const cacheDirs = [today - 1, today, today + 1];
      for (const cacheDir of cacheDirs) {
        try {
          const result = await fs.getFilesInDir(join(cachePath, folders[cacheDir]));
          files = files.concat(result);
          // eslint-disable-next-line
        } catch (err) { /* noop */ }
      }

      /**
       * If date is earlier than we have cached, bail
       */
      const { earliest /* latest */ } = getDateBounds(files);
      if (datetime.dateIsBefore(date, earliest)) {
        log('  ⚠️ Sorry McFly, we cannot go back in time to get %s, no cache present', url);
        return RESOURCE_UNAVAILABLE;
      }
      /*
      // Fix this soon: it won't work until we can cast the requested date to today for the locale in question, otherwise we'll get false positives on future
      if (datetime.dateIsAfter(date, latest)) {
        log('  ⚠️ Sorry, %s is in the future; without increasing gravity we cannot speed up time to get %s', date, url);
        return RESOURCE_UNAVAILABLE;
      }
      */

      // Filter files that match date when locale-cast from UTC
      files = files.filter(filename => {
        const castDate = getLocalDateFromFilename(filename, tz);
        return castDate === date;
      });

      if (!files.length) {
        log('  🐢  Cache miss for %s at %s', url);
        return CACHE_MISS;
      }

      // We may have multiple files for this day; choose the last one
      // TODO we may want to do more here, including:
      // - analysis of contents (e.g. stale files, etc.)
      // - attempting to scrape this file, and if it doesn't work, trying a previous scrape from the same day?
      const file = files[files.length - 1];
      const dir = file.substr(0, 10);
      const filePath = join(cachePath, dir, file);

      if (fs.exists(filePath)) {
        log('  ⚡️ Cache hit for %s from %s', url, filePath);
        return fs.readFile(filePath, encoding);
      }
      throw Error('Unknown file cache reading error');
    }
    log('  🐢  Cache miss for %s at %s', url);
    return CACHE_MISS;
  }
  // TODO build S3 integration here
  throw Error('Not ready for AWS yet');
}
