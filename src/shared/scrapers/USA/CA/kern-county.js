import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Kern County',
  state: 'CA',
  country: 'USA',
  url: 'https://kernpublichealth.com/2019-novel-coronavirus/',
  type: 'table',
  scraper: {
    '0': async function() {
      let $ = await fetch.headless(this.url);
      let cases = 0;
      let tested = 0;

      // Pull out and fetch the embedded iframe
      const frameURL = $('iframe').attr('src');
      console.log(frameURL);

      $ = await fetch.headless(frameURL);

      const getVal = function(title) {
        const val = parse.number(
          $(`div[title="${title}"]`)
            .next()
            .find('text')
            .find('title')
            .text()
        );
        return val;
      };

      cases += getVal('Positives Detected Among Kern Residents');
      cases += getVal('Positives Detected Among Non-Residents');

      tested += cases;
      tested += getVal('Negative Tests');
      tested += getVal('Pending Tests');

      return { cases, tested };
    },
    '2020-03-23': async function() {
      throw new Error('Kern County, CA now uses a PNG and PDF');
    }
  }
};

export default scraper;
