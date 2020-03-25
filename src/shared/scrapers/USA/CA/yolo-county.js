import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as datetime from '../../../lib/datetime.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Yolo County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  url:
    'https://www.yolocounty.org/health-human-services/adults/communicable-disease-investigation-and-control/novel-coronavirus-2019',
  async scraper() {
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-03-17')) {
      const $h3 = $('h3:contains("confirmed case")');
      const matches = $h3.text().match(/there are (\d+) confirmed cases? in Yolo/);
      return { cases: parse.number(matches[1]) };
    }
    const $h3 = $('h3:contains("confirmed case")');
    const matches = $h3.text().match(/(\d+) confirmed case/);
    return { cases: parse.number(matches[1]) };
  }
};

export default scraper;
