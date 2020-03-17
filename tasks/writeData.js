import path from 'path';
import * as fs from '../lib/fs.js';
import * as stringify from '../lib/stringify.js';

const writeData = async ({ locations, featureCollection, report, options }) => {
  let date = process.env['SCRAPE_DATE'] ? '-' + process.env['SCRAPE_DATE'] : '';

  await fs.ensureDir('dist');

  await fs.writeFile(path.join('dist', `data${date}.json`), JSON.stringify(locations, null, 2));

  await fs.writeCSV(path.join('dist', `data${date}.csv`), stringify.csvForDay(locations));

  await fs.writeJSON(path.join('dist', `features${date}.json`), featureCollection);

  await fs.writeJSON('dist/report.json', report);

  return { locations, featureCollection, report, options };
};

export default writeData;
