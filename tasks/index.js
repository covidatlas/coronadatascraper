import fetchSources from './fetchSources.js';
import scrapeData from './scrapeData/index.js';
import findFeatures from './findFeatures.js';
import findPopulations from './findPopulations.js';
import writeData from './writeData.js';

import * as datetime from '../lib/datetime.js';

async function generate(date, options = { findFeatures: true, findPopulations: true, writeData: true, skip: null, location: null }) {
  if (!date && process.env.SCRAPE_DATE) {
    date = process.env.SCRAPE_DATE;
  } else if (!date) {
    date = datetime.getYYYYMD();
    process.env.SCRAPE_DATE = date;
  } else {
    process.env.SCRAPE_DATE = date;
  }

  // JSON used for reporting
  const report = {
    date
  };

  const output = await fetchSources({ date, report, options })
    .then(scrapeData)
    .then(findFeatures)
    .then(findPopulations)
    .then(options.writeData !== false && writeData);

  return output;
}

export default generate;
