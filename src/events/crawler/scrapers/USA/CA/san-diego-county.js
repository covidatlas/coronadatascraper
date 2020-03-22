import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'San Diego County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html',
  async scraper() {
    const $ = await fetch.page(this.url);
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
  }
};

export default scraper;
