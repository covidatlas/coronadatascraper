import fastGlob from 'fast-glob';
import path from 'path';
import convert from './_convert-timestamp.js';
import log from '../../../log.js';
import * as fs from '../../../fs.js';
import join from '../../../join.js';
import datetime from '../../../datetime/index.js';
import hash from './_hash.js';

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
 */
export default async function getCachedFile(url, type, date, encoding = 'utf8', tz) {
  const folder = hash(url);

  if (local) {
    const cachePath = join(process.cwd(), 'crawler-cache', folder);
    let files = await fastGlob([join(cachePath, '**')]);

    /**
     * All cache data is saved with a 8601Z timestamp
     *   In order to match the date requested to the timestamp, we must re-cast it to the locale in question
     *   FIXME that can't happen yet, as we need geo-tz to live in the scraper
     */
    if (files.length) {
      // Re-cast the UTC filenames to the requested date
      files = files.filter(file => {
        // Extract the file from the path
        file = path.basename(file);

        // Strip out the extension
        file = file.replace(path.extname(file), '');

        // Strip out the contents sha
        file = file.substr(0, file.length - 6);

        // Pull out the timestamp
        const ts = convert.filenameToZ8601(file);

        // Re-cast it from UTC to the source's timezone
        const castDate = datetime.cast(ts, tz);
        return castDate === date;
      });

      if (!files.length) {
        log('  ⚠️ Cannot go back in time to get %s, no cache present', url);
        return RESOURCE_UNAVAILABLE;
      }

      // We may have multiple files for this day; choose the latest one
      // TODO we may want to do some analysis here re. stale files, etc.
      files = files.sort((a, b) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });
      const filePath = files[files.length - 1];

      log('  ⚡️ Cache hit for %s from %s', url, filePath);
      return fs.readFile(filePath, encoding);
    }
    log('  🐢  Cache miss for %s at %s', url);
    return CACHE_MISS;
  }
  // TODO build S3 integration here
  throw Error('Not ready for AWS yet');
}
