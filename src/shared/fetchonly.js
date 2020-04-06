/** TEMP SCRIPT ONLY.
 * Registered in package.json, usage:
 * yarn fetchOnly --date '2020-03-28' --onlyUseCache
 */

const imports = require('esm')(module);

const argv = imports('./cli/cli-args.js').default;
const clearAllTimeouts = imports('./utils/timeouts.js').default;
const fetchSources = imports('../events/crawler/get-sources/index.js').default;
const scrapeData = imports('../events/crawler/scrape-data/index.js').default;
const datetime = imports('./lib/datetime/index.js').default;

/** Fetch and scrape the data only.
 * temp file to extract data only.
 */
async function fetchAndScrape(date, options = {}) {
  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  // JSON used for reporting
  const report = {
    date: date || datetime.getYYYYMD()
  };

  // Crawler
  const output = await fetchSources({ date, report, options }).then(scrapeData);
  return output;
}

fetchAndScrape(argv.date, argv)
  .then(clearAllTimeouts)
  .catch(e => {
    clearAllTimeouts();
    throw e;
  });

console.log('REMOVE THIS WHEN CACHE MIGRATED');
