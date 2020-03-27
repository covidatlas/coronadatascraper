const imports = require('esm')(module);
const arc = require('@architect/functions');

const fetchSources = imports('./get-sources/index.js').default;
const scrapeData = imports('./scrape-data/index.js').default;
const rateSources = imports('./rate-sources/index.js').default; // TODO move into metadata ops (or somewhere else)

/**
 * AWS entry - WIP!
 */
async function crawler(event) {
  let { options } = event;
  const { date } = event;

  options = { findFeatures: true, findPopulations: true, writeData: true, ...options };

  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  // JSON used for reporting
  const report = {
    date
  };

  const payload = await fetchSources({ date, report, options })
    .then(scrapeData)
    .then(rateSources);

  arc.events.publish({
    name: 'processor',
    payload
  });
}

exports.handler = arc.events.subscribe(crawler);
