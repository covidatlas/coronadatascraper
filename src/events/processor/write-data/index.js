import path from 'path';
import * as fs from '../../../shared/lib/fs.js';
import * as stringify from './stringify.js';
import reporter from '../../../shared/lib/error-reporter.js';

export default async function writeData(locations, featureCollection, ratings, report, options) {
  let suffix = '';
  if (options.outputSuffix !== undefined) {
    suffix = options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  const d = options.writeTo;
  await fs.ensureDir(d);

  const { join } = path;

  await fs.writeFile(join(d, `data${suffix}.json`), JSON.stringify(locations, null, 2));

  await fs.writeCSV(join(d, `data${suffix}.csv`), stringify.csvForDay(locations));

  await fs.writeJSON(join(d, `features${suffix}.json`), featureCollection, { space: 0 });

  await fs.writeJSON(join(d, 'report.json'), report, { space: 2 });

  await fs.writeJSON(join(d, 'ratings.json'), ratings, { space: 2 });

  await fs.writeCSV(join(d, 'reports', 'crawler-report.csv'), reporter.getCSV());

  return { locations, featureCollection, report, options };
};
