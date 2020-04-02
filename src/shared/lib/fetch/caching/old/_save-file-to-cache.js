import * as fs from '../../../fs.js';
import getCachedFilePath from './_get-cached-file-path.js';

/**
 * Saves a file to cache, at the provided date
 *
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} data file data to be saved
 */
export default function saveFileToCache(url, type, date, data) {
  const filePath = getCachedFilePath(url, type, date);
  return fs.writeFile(filePath, data, { silent: true });
}
