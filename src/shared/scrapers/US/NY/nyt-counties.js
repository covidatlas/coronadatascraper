// Fork of US/nyt-counties.js, filtered on US-NY.

import template from '../nyt-counties.js';

const scraper = {
  ...template,
  state: 'iso2:US-NY',
  priority: 1
};

export default scraper;
