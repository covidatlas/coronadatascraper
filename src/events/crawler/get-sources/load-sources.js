import fastGlob from 'fast-glob';
import path from 'path';
import join from '../../../shared/lib/join.js';
import log from '../../../shared/lib/log.js';
import * as geography from '../../../shared/lib/geography/index.js';

/** Check location inclusion, based on args. */
function includeLocation(location, options) {

  if (options.skip && geography.getName(location) === options.skip)
    return false;

    if (
      options.location &&
        path.basename(location._path, '.js') !== options.location &&
        geography.getName(location) !== options.location
    )
      return false;

    if (options.country && ![options.country, `iso1:${options.country}`].includes(location.country))
      return false;

    // select location based on country level id
    // for example "yarn start -i id3:AU-VIC"
    if (options.id && options.id !== countryLevels.getIdFromLocation(location))
      return false;

    return true;
}


export default async args => {
  log(`⏳ Fetching scrapers...`);
  const scrapers = join(__dirname, '..', '..', '..', 'shared', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([scrapers]);

  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Ignore any directory or file that starts with `_`
  filePaths = filePaths.filter(file => file.match(/scrapers(?![^/])(?!.*\/_).*\.js$/gi));

  // eslint-disable-next-line
  const sources = await Promise.all(
    filePaths.map(filePath => require(filePath)))
        .then(modules => [
          ...modules.map((module, index) => ({ _path: filePaths[index], ...module.default }))]);
  const filteredSources = sources.filter(m => includeLocation(m, args.options));

  if (filteredSources.length === 0) {
    log(`location filter returned 0 scrapers.  Please check docs/getting_started.`);
  } else if (filteredSources.length < sources.length) {
    log(`✅ Fetched ${sources.length} scrapers, filtered to ${filteredSources.length}.`);
  } else {
    log(`✅ Fetched ${sources.length} scrapers.`);
  }
  


  return { ...args, sources: filteredSources };
};
