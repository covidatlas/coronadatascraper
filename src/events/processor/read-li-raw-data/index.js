import path from 'path';
import fs from 'fs';

/** Read generated raw files from dist-raw. */
const rawDirectory = path.join(__dirname, '..', '..', '..', '..', 'dist-raw-li');

/** Get filenames. */
function rawFilenames(options) {
  let suffix = '';
  if (options.outputSuffix !== undefined) {
    suffix = options.outputSuffix;
  } else if (process.env.SCRAPE_DATE) {
    suffix = `-${process.env.SCRAPE_DATE}`;
  }

  return {
    // The sources scraped.
    sourcesPath: path.join(rawDirectory, `raw-li-sources${suffix}.json`),

    // The full raw data of all scraped locations.
    locationsPath: path.join(rawDirectory, `raw-li-locations${suffix}.json`)
  };
}

/** Reconstitute data from old raw JSON files.  Bump the priority of li sources way up! */
export default function loadRawPriorityAdjusted(options) {
  function readJson(f) {
    if (!f) throw new Error('null file path');
    if (!fs.existsSync(f)) {
      console.log(`No file at ${f}, returning empty array.`);
      return [];
    }
    const rawdata = fs.readFileSync(f);
    console.log(`Loading ${f.replace(rawDirectory, '')}`);
    return JSON.parse(rawdata);
  }

  const raws = rawFilenames(options);
  const liSources = readJson(raws.sourcesPath);
  const liLocations = readJson(raws.locationsPath);

  liLocations.forEach(loc => {
    loc.priority = 100 + (loc.priority || 0);
  });

  return { liSources, liLocations };
}
