import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as datetime from '../../../lib/datetime.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

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
    } else {
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
    }
    return {
      cases,
      tested
    };
  }
};

export default scraper;
