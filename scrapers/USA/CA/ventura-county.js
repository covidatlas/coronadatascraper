import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as datetime from '../../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Ventura County',
  state: 'CA',
  country: 'USA',
  url: 'https://www.ventura.org/covid19/',
  type: 'paragraph',
  async scraper() {
    const $ = await fetch.headless(this.url);
    let cases = 0;
    let tested = 0;
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      cases += parse.number(
        $('.count-subject:contains("Positive travel-related case")')
          .closest('.hb-counter')
          .find('.count-number')
          .attr('data-from')
      );
      cases += parse.number(
        $('.count-subject:contains("Presumptive Positive")')
          .closest('.hb-counter')
          .find('.count-number')
          .attr('data-from')
      );
      tested = parse.number(
        $('.count-subject:contains("People tested")')
          .closest('.hb-counter')
          .find('.count-number')
          .attr('data-from')
      );
    } else if (datetime.scrapeDateIsBefore('2020-3-18')) {
      cases += parse.number(
        $('td:contains("Positive cases")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );
      cases += parse.number(
        $('td:contains("Presumptive positive")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );

      tested = parse.number(
        $('td:contains("People tested")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );
    } else {
      cases += parse.number(
        $('tr.trFirstRow')
          .find('td')
          .first()
          .text()
      );
    }
    return {
      cases,
      tested
    };
  }
};

export default scraper;
