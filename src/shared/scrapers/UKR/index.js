import * as fetch from '../../lib/fetch/index.js';
import datetime from '../../lib/datetime/index.js';
import maintainers from '../../lib/maintainers.js';
import { NotImplemented } from '../../lib/errors.js';
import log from '../../lib/log.js';

const scraper = {
  country: 'UKR',
  sources: [
    {
      url: 'put url here for government agency',
      name: 'name of agency',
      description: 'some sort of description'
    }
  ],
  // Ukraine's URL needs to have the date on it. So this will actually be
  // changed by the code below.
  url: 'https://api-covid19.rnbo.gov.ua/data?to=', // append this with YYYY-MM-DD
  type: 'json',
  aggregate: 'state',
  maintainers: [maintainers.you], // create an entry in maintainers.js
  scraper: {
    '0': async function() {
      // We need to generate the URL with the date we want to scrape.
      let date = process.env.SCRAPE_DATE;
      // but we need to be sure that it's in the right format.
      date = datetime.getYYYYMMDD(date);
      // Let's see what we've done so far?
      // Note the angled single quote, which allows easy formatting:
      // always use log and not console.log.
      //
      // These types of messages are for development only; you'd go remove them
      // all after.
      log(`The date is ${date}`);
      // confirmed, it's what we want:
      this.url += date;
      // Use functions from the fetch module, which does all the caching for you.
      log(`Gonna fetch from ${this.url}`);
      const data = await fetch.json(this.url);
      // I personally like to check that this isn't empty, otherwise the console
      // may have a cryptic error message like "$ is not a function"
      // (you'll see that one often);
      if (data === null) {
        // I personally prepend log messages I will keep in the final version and
        // error messages with the location of the scraper.
        throw new Error(`UKR: failed to fetch data from ${this.url}.`);
      }
      // Here's where you'd parse the data and return what it needs to have.
      // But we won't do anything.
      throw new NotImplemented(`UKR scraper is cache-only for this date.`);
    }
  }
};
export default scraper;
