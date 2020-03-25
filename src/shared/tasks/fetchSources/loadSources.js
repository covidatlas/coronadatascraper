import fastGlob from 'fast-glob';
import { basename } from 'path';
import join from '../../lib/join.js';

export default async args => {
  console.log(`⏳ Fetching scrapers`);
  const scrapers = join(__dirname, '..', '..', 'scrapers', '**', '*.js');
  let filePaths = await fastGlob([scrapers]);
  filePaths = filePaths.filter(file => !file.endsWith('.test.js'));

  // Enable shared code files in the scrapers directory w/o treating them
  // as scrapers. See #196.
  filePaths = filePaths.filter(file => !basename(file).startsWith('_'));

  const sources = await Promise.all(filePaths.map(filePath => import(filePath))).then(modules => [
    ...modules.map((module, index) => ({ _path: filePaths[index], ...module.default }))
  ]);
  console.log(`✅ Fetched ${sources.length} scrapers!`);

  return { ...args, sources };
};
