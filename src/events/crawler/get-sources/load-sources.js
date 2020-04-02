import path from 'path';
import fastGlob from 'fast-glob';
import join from '../../../shared/lib/join.js';
import log from '../../../shared/lib/log.js';
import * as geography from '../../../shared/lib/geography/index.js';

export default async args => {
  const { options } = args;

  /**
   * Get everything in scraperland
   */
  log(`⏳ Fetching scrapers...`);
  const files = join(__dirname, '..', '..', '..', 'shared', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([files]);
  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Enable shared code files in the scrapers directory w/o treating them as scrapers. See #196.
  const filterFiles = file => {
    const parts = file.split('/');
    return !parts.some(part => part.startsWith('_'));
  };
  filePaths = filePaths.filter(filterFiles);

  // Prob doesn't need to be a Promise.all as we aren't actually executing yet, but jic...
  // eslint-disable-next-line
  let scrapers = await Promise.all(filePaths.map(filePath => require(filePath)));
  scrapers = scrapers.map((module, index) => {
    return {
      _path: filePaths[index],
      ...module.default
    };
  });

  log(`✅ Fetched ${scrapers.length} scrapers`);

  // Filter out unnecessary sources to reduce noise
  const sources = [];
  for (const location of scrapers) {
    if (options.skip && geography.getName(location) === options.skip) {
      continue;
    }
    if (
      options.location &&
      path.basename(location._path, '.js') !== options.location &&
      geography.getName(location) !== options.location
    ) {
      continue;
    }
    sources.push(location);
  }

  if (!sources.length) throw Error('No scrapers found!');

  log(`✅ Using ${sources.length} of ${scrapers.length} scrapers`);

  return { ...args, sources };
};
