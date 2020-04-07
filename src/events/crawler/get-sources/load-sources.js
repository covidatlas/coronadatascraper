import fastGlob from 'fast-glob';
import join from '../../../shared/lib/join.js';
import log from '../../../shared/lib/log.js';

export default async args => {
  log(`⏳ Fetching scrapers...`);
  const scrapers = join(__dirname, '..', '..', '..', 'shared', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([scrapers]);

  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Ignore any directory or file that starts with `_`
  filePaths = filePaths.filter(file => file.match(/scrapers(?![^/])(?!.*\/_).*\.js$/gi));

  // eslint-disable-next-line
  const sources = await Promise.all(filePaths.map(filePath => require(filePath))).then(modules => [
    ...modules.map((module, index) => ({ _path: filePaths[index], ...module.default }))
  ]);
  log(`✅ Fetched ${sources.length} scrapers!`);

  return { ...args, sources };
};
