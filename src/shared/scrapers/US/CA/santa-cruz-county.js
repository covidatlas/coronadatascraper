import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Cruz County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.santacruzhealth.org/HSAHome/HSADivisions/PublicHealth/CommunicableDiseaseControl/Coronavirus.aspx',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $h2 = $('p:contains("Total Confirmed Cases")').nextAll('h2');
      if ($h2.html() === null) {
        throw new Error('H2 not found');
      }
      const cases = parse.number($h2.text());
      return { cases };
    },
    '2020-04-15': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Moved to Tableau');
    }
  }
};

export default scraper;
