import { join } from 'path';
import * as fs from '../../../fs.js';
import hash from './_hash.js';
import convert from './_convert-timestamp.js';

const local = !process.env.NODE_ENV || process.env.NODE_ENV === 'testing';

/**
 * Saves a file to cache, at the provided date
 *
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 * @param {*} date the date associated with this resource, or false if a timeseries data
 * @param {*} data file data to be saved
 */
export default async function saveFileToCache(url, type, date, data) {
  if (local) {
    const base = 'crawler-cache';
    const dir = join(base, hash(url));
    const contents = hash(data, 5);
    const time = convert.Z8601ToFilename(new Date().toISOString());
    const filePath = join(dir, `${time}-${contents}.${type}`);
    return fs.writeFile(filePath, data, { ensureDir: true, silent: true });
  }
  // TODO build S3 integration here
  throw Error('Not ready for AWS yet');
}
