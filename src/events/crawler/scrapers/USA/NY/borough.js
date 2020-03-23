import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';

const borough = async () => {
  const boroughs = [];
  const boroughNames = ['Bronx', 'Brooklyn', 'Manhattan', 'Queens', 'Staten Island'];
  const url = 'https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary.pdf';
  const pdfScrape = await fetch.pdf(url);

  boroughNames.forEach(name => {
    const valIndex = pdfScrape.findIndex(ele => ele.text === name);

    boroughs.push({
      borough: name,
      cases: parse.number(pdfScrape[valIndex + 1].text.match(/(\d*)/)[1])
    });
  });

  return boroughs;
};

export default borough;
