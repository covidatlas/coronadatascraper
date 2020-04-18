import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Stanislaus County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      return {
        cases: parse.number(
          $('.counter')
            .first()
            .text()
        )
      };
    },
    '2020-03-25': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      return {
        cases: parse.number(
          $('p:contains("Positive Cases")')
            .parent()
            .find('.counter')
            .last()
            .text()
        ),
        deaths: parse.number(
          $('p:contains("Related Deaths")')
            .parent()
            .find('.counter')
            .last()
            .text()
        )
      };
    }
  }
};

export default scraper;
