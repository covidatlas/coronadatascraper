import path from 'path';
import hash from './_hash.js';

/**
 * Get the filename of the cache for the given URL
 * @param {*} url URL of the cached resource
 * @param {*} type type of the cached resource
 */
export default function getCachedFileName(url, type) {
  const urlHash = hash(url);
  const extension = type || path.extname(url).replace(/^\./, '') || 'txt';
  return `${urlHash}.${extension}`;
}
