import rootCas from 'ssl-root-cas/latest.js';

import * as fs from './lib/fs.js';

import scrapeData from './tasks/scrapeData.js';
import findFeatures from './tasks/findFeatures.js';
import findPopulations from './tasks/findPopulations.js';
import writeData from './tasks/writeData.js';

async function generate(date, options = { findFeatures: true, findPopulations: true, writeData: true, skip: null, only: null }) {
  if (date) {
    process.env.SCRAPE_DATE = date;
  } else {
    delete process.env.SCRAPE_DATE;
  }

  // Add SSL certificates for sources that use non-standard ones
  const files = await fs.readFiles('./ssl');
  for (const file of files) {
    rootCas.addFile(`./ssl/${file}`);
  }

  rootCas.inject();

  // JSON used for reporting
  const report = {
    date
  };

  const output = await scrapeData({ report, options })
    .then(options.findFeatures !== false && findFeatures)
    .then(options.findPopulations !== false && findPopulations)
    .then(options.writeData !== false && writeData);

  return output;
}

export default generate;
