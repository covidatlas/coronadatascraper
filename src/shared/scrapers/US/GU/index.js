import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-GU',
  country: 'iso1:US',
  url: 'http://dphss.guam.gov/2019-novel-coronavirus-2019-n-cov/',
  sources: [
    {
      name: 'Department of Public Health and Social Services',
      url: 'http://dphss.guam.gov',
      description: 'Guam health department'
    }
  ],
  type: 'table',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const $divCases = $('.et_pb_cta_2')
        .find('div:contains("Confirmed Positives")')
        .find('p:nth-child(3)');
      const $divDeaths = $('.et_pb_cta_3')
        .find('div:contains("Number of Deaths")')
        .find('p:nth-child(3)');
      const cases = parse.number($divCases[0].children[0].data);
      const deaths = parse.number($divDeaths[0].children[0].data);
      return {
        cases,
        deaths
      };
    },
    '2020-03-27': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError(`Guam stopped offering totals on their website, but there's a sweet coloring book`);
    }
  }
};

export default scraper;
