import fastGlob from 'fast-glob';
import { basename } from 'path';
import join from '../../../shared/lib/join.js';
import log from '../../../shared/lib/log.js';

export default async args => {
  log(`⏳ Fetching scrapers...`);
  const scrapers = join(__dirname, '..', '..', '..', 'shared', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([scrapers]);
  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Enable shared code files in the scrapers directory w/o treating them
  // as scrapers. See #196.
  filePaths = filePaths.filter(file => !basename(file).startsWith('_'));

  // eslint-disable-next-line
  const sources = await Promise.all(filePaths.map(filePath => require(filePath))).then(modules => [
    ...modules.map((module, index) => ({ _path: filePaths[index], ...module.default }))
  ]);
  log(`✅ Fetched ${sources.length} scrapers!`);

  return { ...args, sources };
};
