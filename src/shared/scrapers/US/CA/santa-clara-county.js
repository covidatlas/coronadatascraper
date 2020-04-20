import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Clara County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  url: 'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx',
  scraper: {
    '0': async function() {
      const $ = await fetch.page(this, this.url, 'default');
      const scriptData = $('script:contains("Total_Confirmed_Cases")')[0].children[0].data;
      const regExp = /\[.*\]/;
      const data = JSON.parse(regExp.exec(scriptData))[0];
      const cases = parse.number(data.Total_Confirmed_Cases);
      const deaths = parse.number(data.Deaths);
      return {
        cases,
        deaths
      };
    },
    '2020-04-15': async function() {
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Sunsetting county scraper, its PowerBI now');
    }
  }
};

export default scraper;
