import path from 'path';
import * as fs from '../lib/fs.js';

const writeData = async ({ locations, report, sourceRatings, options }) => {
  let suffix = '';
  if (options.outputSuffix !== undefined) {
    suffix = options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  await fs.writeFile(path.join('dist', `data${suffix}.json`), JSON.stringify(locations, null, 2));

  await fs.writeJSON('dist/ratings.json', sourceRatings);

  await fs.writeJSON('dist/report.json', report);

  return { locations, report, options };
};

export default writeData;
