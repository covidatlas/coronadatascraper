import path from 'path';
import * as fs from '../../../shared/lib/fs.js';

export default async function writeRaw(locations, report, options) {
  if (!options.dumpRaw) return;

  let suffix = '';
  if (options.outputSuffix !== undefined) {
    suffix = options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  const d = options.writeTo;
  await fs.ensureDir(d);

  const data = locations;
  const keyCollector = data.reduce((hsh, val) => {
    return { ...hsh, ...val };
  }, {});
  await fs.writeJSON(path.join(d, `raw-keys${suffix}.json`), Object.keys(keyCollector), { space: 2 });

  // Only pull out a subset of the data for each location.  Since
  // some scrapers put 'null' or 'undefined' for data, do a check to
  // see if the given key is in the returned set of keys.
  const useKeys = [
    '_path',
    'active',
    'aggregate',
    'cases',
    'certValidation',
    'city',
    'country',
    'county',
    'date',
    'deaths',
    'discard',
    'discharged',
    'hospitalized',
    'icu',
    'population',
    'priority',
    'recoverd',
    'recovered',
    'state',
    'tested',
    'tests',
    'timeseries',
    'todayHospitalized'
  ];

  const output = data.map(d => {
    // console.log(`Pruning ${d}`);
    // console.log(`Keys for it: ${Object.keys(d)}`);
    const pruned = {};
    for (const k of Object.keys(d)) {
      // console.log(`  Checking key: ${k}`)
      if (useKeys.includes(k)) {
        // console.log(`  Found key: ${k}`)
        pruned[k] = d[k];
      }
    }
    return pruned;
  });
  await fs.writeJSON(path.join(d, `raw${suffix}.json`), output, { space: 2 });

  await fs.writeJSON(path.join(d, `raw-full${suffix}.json`), data, { space: 2 });

  await fs.writeJSON(path.join(d, `raw-report${suffix}.json`), report, { space: 2 });
}
