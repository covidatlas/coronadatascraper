import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as datetime from '../../../lib/datetime.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Glenn County',
  state: 'CA',
  country: 'USA',
  maintainers: [maintainers.jbencina],
  async scraper() {
    if (datetime.scrapeDateIsBefore('2020-3-16')) {
      this.url = 'https://www.countyofglenn.net/dept/health-human-services/public-health/welcome';
    } else {
      this.url = 'https://www.countyofglenn.net/dept/health-human-services/public-health/covid-19';
    }
    const $ = await fetch.page(this.url);
    if (datetime.scrapeDateIsBefore('2020-3-17')) {
      const cases = parse.number(
        $('font:contains("Glenn County COVID-19 Cases")')
          .first()
          .text()
          .match(/Cases: (\d+)/)[1]
      );
      return { cases };
    }
    const cases = parse.number(
      $('span:contains("Glenn County COVID-19 Cases")')
        .first()
        .text()
        .match(/Cases: (\d+)/)[1]
    );
    return { cases };
  }
};

export default scraper;
