import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Diego County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
  scraper: {
    '0': async function scraper() {
      const $ = await fetch.page(this, this.url, 'default');
      let cases = 0;
      $('td:contains("Positive (confirmed cases)")')
        .nextAll('td')
        .each((index, td) => {
          cases += parse.number($(td).text());
        });
      $('td:contains("Presumptive Positive")')
        .nextAll('td')
        .each((index, td) => {
          cases += parse.number($(td).text());
        });
      return {
        cases,
        tested: parse.number(
          $('td:contains("Total Tested")')
            .next('td')
            .text()
        )
      };
    },
    '2020-03-15': async function scraper() {
      const $ = await fetch.page(this, this.url, 'default');
      const cases = parse.number(
        $('td:contains("Total Positives")')
          .next()
          .text()
      );
      const deaths = parse.number(
        $('td:contains("Deaths")')
          .next()
          .text()
      );
      return {
        cases,
        deaths
      };
    }
  }
};

export default scraper;
