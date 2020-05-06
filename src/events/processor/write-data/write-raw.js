import path from 'path';
import fs from 'fs';

import reporter from '../../../shared/lib/error-reporter.js';

/** Save and read generated raw files from dist-raw. */
const rawDirectory = path.join(__dirname, '..', '..', '..', '..', 'dist-raw');

/** Get filenames. */
function rawFilenames(options) {
  let suffix = '';
  if (options.outputSuffix !== undefined) {
    suffix = options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  return {
    // All keys present in the locations file (for debugging/interest)
    locationsKeysPath: path.join(rawDirectory, `raw-locations-keys${suffix}.json`),

    // All keys present in the sources file (for debugging/interest)
    sourcesKeysPath: path.join(rawDirectory, `raw-sources-keys${suffix}.json`),

    // The sources scraped.
    sourcesPath: path.join(rawDirectory, `raw-sources${suffix}.json`),

    // The full raw data of all scraped locations.
    locationsPath: path.join(rawDirectory, `raw-locations${suffix}.json`),

    // the error-reporter errors.
    errorReporterErrorsPath: path.join(rawDirectory, `raw-error-reporter${suffix}.json`),

    // A brief version raw-full, pulling out interesting fields.
    locationsBriefPath: path.join(rawDirectory, `raw-locations-brief${suffix}.json`),

    // The "report.json" accumulated during all report generation.
    reportPath: path.join(rawDirectory, `raw-report${suffix}.json`)
  };
}

export async function writeRaw(sources, locations, report, options) {
  if (!options.dumpRaw) return;

  const {
    errorReporterErrorsPath,
    locationsKeysPath,
    sourcesKeysPath,
    sourcesPath,
    locationsBriefPath,
    locationsPath,
    reportPath
  } = rawFilenames(options);

  if (!fs.existsSync(rawDirectory)) fs.mkdirSync(rawDirectory);

  function writeJson(f, data) {
    fs.writeFileSync(f, JSON.stringify(data, null, 2));
  }

  writeJson(errorReporterErrorsPath, reporter.getErrors());
  writeJson(sourcesPath, sources);
  writeJson(locationsPath, locations);
  writeJson(reportPath, report);

  const keyCollector = arr =>
    arr.reduce((hsh, val) => {
      return { ...hsh, ...val };
    }, {});
  writeJson(locationsKeysPath, Object.keys(keyCollector(locations)));
  writeJson(sourcesKeysPath, Object.keys(keyCollector(sources)));

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

  const output = locations.map(d => {
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
  writeJson(locationsBriefPath, output);
}

/** Reconstitute locations and report from old raw JSON files. */
export function loadRaw(options) {
  function readJson(f) {
    if (!f) throw new Error('null file path');
    if (!fs.existsSync(f)) throw new Error(`Missing raw file ${f}`);
    const rawdata = fs.readFileSync(f);
    return JSON.parse(rawdata);
  }

  const raws = rawFilenames(options);

  reporter.setErrors(readJson(raws.errorReporterErrorsPath));

  return {
    sources: readJson(raws.sourcesPath),
    locations: readJson(raws.locationsPath),
    report: readJson(raws.reportPath)
  };
}
