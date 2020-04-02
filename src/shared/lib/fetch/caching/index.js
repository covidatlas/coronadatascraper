/**
 * This is the caching library entry
 * We provide caching to reduce strain on official data sources and to store changes to each source on a day to day basis.
 */
import getCachedFileOld from './old/_get-cached-file.js';
import saveFileToCacheOld from './old/_save-file-to-cache.js';

import getCachedFileNew from './new/_get-cached-file.js';
import saveFileToCacheNew from './new/_save-file-to-cache.js';

const getCachedFile = process.env.NEW_CACHE ? getCachedFileNew : getCachedFileOld;
const saveFileToCache = process.env.NEW_CACHE ? saveFileToCacheNew : saveFileToCacheOld;

export const CACHE_MISS = null;
export const RESOURCE_UNAVAILABLE = undefined;

export { getCachedFile, saveFileToCache };
