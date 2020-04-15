import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Ventura County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  type: 'paragraph',
  maintainers: [maintainers.jbencina, maintainers.tyleraustin],
  scraper: {
    '0': async function() {
      this.url = 'https://www.ventura.org/covid19/';
      const $ = await fetch.headless(this, this.url, 'default');
      let cases = 0;
      let tested = 0;

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
      return { cases, tested };
    },

    '2020-03-16': async function() {
      this.url = 'https://www.ventura.org/covid19/';
      const $ = await fetch.headless(this, this.url, 'default');
      let cases = 0;
      let tested = 0;

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
      return { cases, tested };
    },

    '2020-03-18': async function() {
      this.url = 'https://www.ventura.org/covid19/';
      const $ = await fetch.page(this, this.url, 'default');

      const cases = parse.number(
        $('td:contains("COVID-19 Cases")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );

      return { cases };
    },

    '2020-03-19': async function() {
      this.url = 'https://www.vcemergency.com';
      const $ = await fetch.page(this, this.url, 'default');

      const cases = parse.number(
        $('td:contains("COVID-19 Cases")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );
      const deaths = parse.number(
        $('td:contains("Death")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );

      return { cases, deaths };
    },

    '2020-03-25': async function() {
      this.url = 'https://www.vcemergency.com';
      const $ = await fetch.page(this, this.url, 'default');

      const cases = parse.number(
        $('td:contains("Positive Cases")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );
      const deaths = parse.number(
        $('td:contains("Death")')
          .closest('table')
          .find('td')
          .first()
          .text()
      );

      return { cases, deaths };
    },

    '2020-03-26': async function() {
      this.url = 'https://www.vcemergency.com';
      const $ = await fetch.page(this, this.url, 'default');

      const positiveCases = $('td:contains("Positive Cases")').closest('tr');
      if (positiveCases.text() !== 'Positive Cases') {
        throw new Error('Unexpected table layout/labels');
      }
      if (
        positiveCases
          .next()
          .next()
          .text() !== 'Deaths'
      ) {
        throw new Error('Unexpected table layout/labels');
      }

      const cases = parse.number(positiveCases.prev().text());
      const deaths = parse.number(positiveCases.next().text());

      return { cases, deaths };
    },

    '2020-03-30': async function() {
      this.url = 'https://www.vcemergency.com';
      const $ = await fetch.page(this, this.url, 'default');
      const cases = parse.number(
        $('td:contains("TOTAL CASES")')
          .first()
          .next()
          .text()
      );
      const deaths = parse.number(
        $('td:contains("DEATHS")')
          .first()
          .next()
          .text()
      );
      const recovered = parse.number(
        $('td:contains("Recovered Cases")')
          .first()
          .next()
          .text()
      );
      const tested = parse.number(
        $('td:contains("People Tested")')
          .first()
          .next()
          .text()
      );

      const hospitalized = parse.number(
        $('td:contains("Hospitalized")')
          .first()
          .next()
          .text()
      );

      return {
        cases,
        deaths,
        recovered,
        tested,
        hospitalized
      };
    }
  }
};

export default scraper;
