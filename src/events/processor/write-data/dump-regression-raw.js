import path from 'path';
import * as fs from '../../../shared/lib/fs.js';

const writeRawRegression = async args => {
  if (!args.options.dumpRaw) return args;

  let suffix = '';
  if (args.options.outputSuffix !== undefined) {
    suffix = args.options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  const d = args.options.writeTo;
  await fs.ensureDir(d);

  const data = args.locations;
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
    'hospitalized_current',
    'icu',
    'icu_current',
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

  return args;
};

export default writeRawRegression;
