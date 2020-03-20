import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Clara County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url: 'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx',
  async scraper() {
    const $ = await fetch.page(this.url);
    const scriptData = $('script:contains("Total_Confirmed_Cases")')[0].children[0].data;
    const regExp = /\[.*\]/;
    const data = JSON.parse(regExp.exec(scriptData))[0];
    const cases = parse.number(data.Total_Confirmed_Cases);
    const deaths = parse.number(data.Deaths);
    return {
      cases,
      deaths
    };
  }
};

export default scraper;
