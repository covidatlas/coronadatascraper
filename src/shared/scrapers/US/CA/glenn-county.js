import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';
import { DeprecatedError } from '../../../lib/errors.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Glenn County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  scraper: {
    '0': async function() {
      this.url = datetime.scrapeDateIsBefore('2020-03-16')
        ? 'https://www.countyofglenn.net/dept/health-human-services/public-health/welcome'
        : 'https://www.countyofglenn.net/dept/health-human-services/public-health/covid-19';

      const $ = await fetch.page(this, this.url, 'default');
      if (datetime.scrapeDateIsBefore('2020-03-17')) {
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
          .match(/Cases:.*(\d+)/)[1]
      );
      return { cases };
    },
    '2020-05-03': async function() {
      // Glenn County now displays their totals in an unscrapeable
      // image.  I looked around on their site and couldn't find a
      // scrapable number.  I emailed them May 3 asking them to add
      // scrapable text, esp for vision-impaired citizens. jz
      this.url = 'https://www.countyofglenn.net/dept/health-human-services/public-health/covid-19';
      await fetch.page(this, this.url, 'default');
      throw new DeprecatedError('Glenn Country reports their numbers in an unscrapeable image');
    },
    '2020-05-17': async function() {
      // Forward-dating a scraper so we can revisit this, if they update their site
      throw new Error('Check if Glenn County has updated their site');
    }
  }
};

export default scraper;
