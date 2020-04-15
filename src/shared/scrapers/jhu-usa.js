import fipsCodes from 'country-levels/fips.json';
import * as fetch from '../lib/fetch/index.js';
import * as parse from '../lib/parse.js';
import * as geography from '../lib/geography/index.js';
import * as transform from '../lib/transform.js';
import datetime from '../lib/datetime/index.js';
import maintainers from '../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)';

const scraper = {
  maintainers: [maintainers.lazd],
  url: 'https://github.com/CSSEGISandData/COVID-19',
  timeseries: true,
  priority: -1,
  country: 'iso1:US',
  aggregate: 'county',
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/'
    }
  ],
  _urls: {
    cases:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
    deaths:
      'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv'
  },
  scraper: {
    '0': async function() {
      const urls = this._urls;
      const cases = await fetch.csv(this, urls.cases, 'cases', false);
      const deaths = await fetch.csv(this, urls.deaths, 'deaths', false);

      let regions = [];

      let scrapeDate = process.env.SCRAPE_DATE ? new Date(`${process.env.SCRAPE_DATE} 12:00:00`) : new Date();
      let scrapeDateString = datetime.getMDYY(new Date(scrapeDate));
      const lastDateInTimeseries = new Date(`${Object.keys(cases[0]).pop()} 12:00:00`);
      const firstDateInTimeseries = new Date(`${Object.keys(cases[0])[4]} 12:00:00`);

      if (scrapeDate > lastDateInTimeseries) {
        console.error(
          `  🚨 timeseries for JHU-USA: SCRAPE_DATE ${datetime.getYYYYMD(
            scrapeDate
          )} is newer than last sample time ${datetime.getYYYYMD(lastDateInTimeseries)}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.getMDYY(scrapeDate);
      }

      if (scrapeDate < firstDateInTimeseries) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMD(scrapeDate)}`);
      }

      const stateLocations = {};
      for (let index = 0; index < cases.length; index++) {
        // Get location info
        const caseInfo = cases[index];
        const deathInfo = deaths[index];
        const fips = caseInfo.FIPS.replace(/\.0$/, '').padStart(5, '0');

        if (['00000', '88888', '99999'].includes(fips)) {
          console.warn('  ⚠️  Skipping incorrect FIPS code %s for %s', fips, caseInfo.Combined_Key);
          continue;
        }

        const location = {
          cases: parse.number(caseInfo[scrapeDateString] || 0),
          deaths: parse.number(deathInfo[scrapeDateString] || 0)
        };

        // Puerto Rico, Guam, etc.
        if (caseInfo.code3 !== '840') {
          location.country = `iso1:${caseInfo.iso2}`;
          regions.push(location);
        }

        if (caseInfo.Admin2.startsWith('Out of ')) {
          console.warn('  ⚠️  Skipping out of state data for %s', caseInfo.Combined_Key);
          continue;
        }

        if (caseInfo.Admin2 === 'Unassigned') {
          const stateCode = geography.usStates[parse.string(caseInfo.Province_State)];
          const stateClid = `iso2:US-${stateCode}`;
          location.state = stateClid;
          location.county = UNASSIGNED;

          regions.push(location);
          continue;
        }

        // Only include places we have data for
        const countryLevelIDInfo = fipsCodes[fips];
        if (!countryLevelIDInfo) {
          console.warn('  ⚠️  Skipping %s at (FIPS %s)', caseInfo.Combined_Key, fips);
          continue;
        }

        location.county = `fips:${fips}`;
        location.state = `iso2:${countryLevelIDInfo.state_code_iso}`;

        stateLocations[location.state] = stateLocations[location.state] || [];
        stateLocations[location.state].push(location);

        regions.push(location);
      }

      // Sum the whole country
      regions.push(transform.sumData(regions));

      // Sum individual states
      for (const [state, locations] of Object.entries(stateLocations)) {
        regions.push(transform.sumData(locations, { state }));
      }

      // remove unassigned counties once we have summed them up
      regions = regions.filter(r => r.county !== UNASSIGNED);

      if (regions.length === 0) {
        throw new Error(`Timeseries does not contain a sample for SCRAPE_DATE ${datetime.getYYYYMD(scrapeDate)}`);
      }

      return regions;
    }
  }
};

export default scraper;
