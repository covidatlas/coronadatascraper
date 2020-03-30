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
    '2020-3-23': async function() {
      const text = await fetch.png('https://phweb.kerncounty.com/images/PHBriefing/COVIDstats.png');
      const [
        positivesAmongKernResidents,
        positivesDetectedAmongNonResidents,
        deathsAmongKernResidents,
        numberofNegativeTests,
        numberofPendingTests,
        numberOfTotalTests
      ] = text
        .match(/\d+/g)
        .slice(0, 6)
        .map(x => parse.number(x));
      const calculatedTotalTests =
        positivesAmongKernResidents + positivesDetectedAmongNonResidents + numberofNegativeTests + numberofPendingTests;

      if (calculatedTotalTests === numberOfTotalTests) {
        return {
          cases: positivesAmongKernResidents + positivesDetectedAmongNonResidents,
          tested: numberOfTotalTests,
          deaths: deathsAmongKernResidents
        };
      }
      throw new Error("Data isn't internally consistent. PNG was likely changed.");
    }
  }
};

export default scraper;
