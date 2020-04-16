import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Mono County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://monocovid19-monomammoth.hub.arcgis.com/',
  scraper: {
    '0': async function() {
      const $ = await fetch.headless(this.url);
      const cases = parse.number(
        $('h4:contains("POSITIVE")')
          .first()
          .parent()
          .next('h3')
          .text()
      );
      return { cases };
    },
    '2020-03-19': async function() {
      const $ = await fetch.headless(this.url);
      const cases = parse.number(
        $('h4:contains("POSITIVECASES")')
          .first()
          .parent()
          .find('h3')
          .first()
          .text()
      );
      const tested = parse.number(
        $('h4:contains("TESTSGIVEN")')
          .first()
          .parent()
          .find('h3')
          .first()
          .text()
      );
      return {
        cases,
        tested
      };
    }
  }
};

export default scraper;
