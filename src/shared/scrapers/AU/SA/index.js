import assert from 'assert';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';
import getSchemaKeyFromHeading from '../../../utils/get-schema-key-from-heading.js';
import maintainers from '../../../lib/maintainers.js';

const schemaKeysByHeadingFragment = {
  'confirmed case': 'cases',
  deaths: 'deaths',
  icu: 'hospitalized',
  'cases cleared': 'recovered'
};

const firstUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia';
const secondUrl =
  'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/conditions/infectious+diseases/covid+2019/latest+updates/covid-19+cases+in+south+australia';

// They changed their URL without a redirect on 2020-04-22.
const getUrl = () => {
  const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);
  const isBeforeOrEqual = datetime.dateIsBeforeOrEqualTo(date, '2020-04-21');
  return isBeforeOrEqual ? firstUrl : secondUrl;
};

const scraper = {
  country: 'iso1:AU',
  maintainers: [maintainers.camjc],
  priority: 2,
  sources: [
    {
      description: 'SA Government Health Department',
      name: 'SA Health',
      url: 'https://www.sahealth.sa.gov.au'
    }
  ],
  state: 'iso2:AU-SA',
  type: 'table',
  url: secondUrl,
  scraper: {
    '0': async function() {
      this.url = firstUrl;
      const $ = await fetch.page(this, this.url, 'default');
      const paragraph = $('.middle-column p:first-of-type').text();
      const { casesString } = paragraph.match(/been (?<casesString>\d+) confirmed cases/).groups;
      this.type = 'paragraph';
      return {
        cases: parse.number(casesString)
      };
    },
    '2020-03-27': async function() {
      this.url = getUrl();
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('table:first-of-type');
      assert($table, 'no table found');

      const $trs = $table.find('tbody > tr');
      const data = {};
      $trs
        .filter((_index, tr) => Boolean($(tr).find('td').length)) // Had `th` inside `tbody`, now they are inside `thead`. This suits both.
        .each((_index, tr) => {
          const $tr = $(tr);
          const key = getSchemaKeyFromHeading({
            heading: $tr.find('td:first-child').text(),
            schemaKeysByHeadingFragment
          });
          if (key) {
            data[key] = parse.number($tr.find('td:last-child').text());
          }
        });
      assert(data.cases > 0, 'Cases is not reasonable');
      return data;
    }
  }
};

export default scraper;
