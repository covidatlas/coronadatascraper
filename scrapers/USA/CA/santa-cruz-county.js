import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Cruz County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'http://www.santacruzhealth.org/HSAHome/HSADivisions/PublicHealth/CommunicableDiseaseControl/Coronavirus.aspx',
  async scraper() {
    const $ = await fetch.page(this.url);
    const $h2 = $('p:contains("Total Confirmed Cases")').nextAll('h2');
    const cases = parse.number($h2.text());
    return { cases };
  }
};

export default scraper;
