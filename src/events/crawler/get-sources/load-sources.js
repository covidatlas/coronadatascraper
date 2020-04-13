import fastGlob from 'fast-glob';
import join from '../../../shared/lib/join.js';
import log from '../../../shared/lib/log.js';

/** Check location inclusion, based on command-line options.
 * (*) location - the location
 * (*) opts - options
 */
function includeLocation(location, opts) {
  const relpath = location._path.replace(/.*?src.shared.scrapers./, '');

  if (opts.skip && relpath.startsWith(opts.skip)) return false;

  if (opts.location && !relpath.startsWith(opts.location)) return false;

  return true;
}

export default async args => {
  log(`⏳ Fetching scrapers...`);
  const scrapers = join(__dirname, '..', '..', '..', 'shared', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([scrapers]);

  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Ignore any directory or file that starts with `_`
  filePaths = filePaths.filter(file => file.match(/scrapers(?![^/])(?!.*\/_).*\.js$/gi));

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const sources = await Promise.all(filePaths.map(filePath => require(filePath))).then(modules => [
    ...modules.map((module, index) => ({ _path: filePaths[index], ...module.default }))
  ]);

  // Sorting sources by path for generated report file determinism.
  const sortSources = (a, b) => {
    if (a._path > b._path) return 1;
    if (b._path > a._path) return -1;
    return 0;
  };

  const filteredSources = sources.filter(m => includeLocation(m, args.options)).sort(sortSources);

  if (filteredSources.length === 0) {
    log(`location filter returned 0 scrapers.  Please check docs/getting_started.`);
  } else if (filteredSources.length < sources.length) {
    log(`✅ Fetched ${sources.length} scrapers, filtered to ${filteredSources.length}.`);
  } else {
    log(`✅ Fetched ${sources.length} scrapers.`);
  }

  return { ...args, sources: filteredSources };
};
