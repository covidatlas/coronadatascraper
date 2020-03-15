import path from 'path';
import * as fs from './lib/fs.js';
import * as transform from './lib/transform.js';

async function pivot() {
  let timeseriesData = await fs.readJSON('dist/timeseries.json');

  let { locations, timeseries } = transform.pivotTimeseries(timeseriesData);
  console.log('%d locations', locations.length);
  console.log('%d dates', Object.keys(timeseries).length);
  await fs.writeFile(path.join('dist', `timeseries-pivoted.json`), JSON.stringify(timeseries, null, 2));
  await fs.writeFile(path.join('dist', `locations.json`), JSON.stringify(locations, null, 2));
}

pivot();
