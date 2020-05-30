import assert from 'assert';

import iso1Codes from 'country-levels/iso1.json';
import iso2Codes from 'country-levels/iso2.json';

import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import * as transform from '../../lib/transform.js';
import maintainers from '../../lib/maintainers.js';
import datetime from '../../lib/datetime/index.js';

import departementsToCountry from './departements-to-country.json';
import departementsToRegion from './departements-to-region.json';

const scraper = {
  country: 'iso1:FR',
  timeseries: true,
  url: 'https://www.data.gouv.fr/fr/organizations/sante-publique-france/datasets-resources.csv',
  sources: [
    {
      description: 'Santé publique France is the French national agency of public health.',
      name: 'Santé publique France',
      url: 'https://www.santepubliquefrance.fr/'
    }
  ],
  maintainers: [maintainers.qgolsteyn],
  priority: 1,
  /*
   * NOTE: No cases data is available for France at the regional level. This scraper instead focuses
   * on capturing hospitalized, deaths, and testing data regionally.
   */
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    // The latest datasets are posted in this CSV, which is updated daily
    const datasets = await fetch.csv(this, this.url, 'index', false, { delimiter: ';' });

    // We grab the latest relevant dataset URLs
    const hopitalizedDataset = datasets.find(entry => entry.title.match(/donnees-hospitalieres-covid19-.*.csv/));
    const testedDataset = datasets.find(entry => entry.title.match(/donnees-tests-covid19-labo-quotidien-.*.csv/));

    let hopitalizedData = await fetch.csv(this, hopitalizedDataset.url, 'hospitalized', false, { delimiter: ';' });

    // Hospitalized data is broken down by gender, we are only interested in all genders
    hopitalizedData = hopitalizedData.filter(item => item.sexe === '0');

    // Sort by date to ensure accurate cummulative count
    hopitalizedData = hopitalizedData.sort((a, b) => a.jour - b.jour);

    let testedData = await fetch.csv(this, testedDataset.url, 'tested', false, { delimiter: ';' });

    // Testing data is broken down by age group, we are only interested in all age groups
    testedData = testedData.filter(item => item.clage_covid === '0');

    // Sort by date to ensure accurate cummulative count
    testedData = testedData.sort((a, b) => a.jour - b.jour);

    const testedByDepartements = {};

    // Capture cumulative testing data, as the testing data is for the day only
    for (const item of testedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.jour, date))
        testedByDepartements[item.dep] = parse.number(item.nb_test) + (testedByDepartements[item.dep] || 0);
    }

    const hospitalizedByDepartments = {};

    // Discharged and deaths are cummulative, while hospitalized is current
    // We can calculate new patients with this formula:
    // new_patients = n_current_patients - n_yesterdays_patients + n__todays_discharged_patient + n_todays_deaths
    // We then sum the number of new_patients to get a cummulative number
    for (const item of hopitalizedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.jour, date)) {
        const prev = hospitalizedByDepartments[item.dep];
        if (prev) {
          // Get the number of new discharged and deaths
          const deltaDeaths = parse.number(item.dc) - prev.deaths;
          const deltaDischarged = parse.number(item.rad) - prev.discharged;

          // Calculate new patients for today according to formula above
          const newHospitalized = parse.number(item.hosp) - prev.todayHospitalized + deltaDeaths + deltaDischarged;

          hospitalizedByDepartments[item.dep] = {
            // Store today's number to calculate formula above
            todayHospitalized: parse.number(item.hosp),
            // Sum number of new hospitalization
            hospitalized_current: prev.hospitalized + newHospitalized,
            deaths: parse.number(item.dc),
            discharged: parse.number(item.rad)
          };
        } else {
          // First day with info for this departement
          hospitalizedByDepartments[item.dep] = {
            todayHospitalized: parse.number(item.hosp),
            hospitalized_current: parse.number(item.hosp),
            deaths: parse.number(item.dc),
            discharged: parse.number(item.rad)
          };
        }
      }
    }

    const overseas = [];
    const regions = {};
    const departements = [];

    for (const dep of Object.keys(testedByDepartements)) {
      if (departementsToCountry[dep]) {
        // Overseas territories have their own country code
        // We treat them as country to follow standard set by Johns Hopkins dataset
        overseas.push({
          country: departementsToCountry[dep],
          tested: testedByDepartements[dep],
          ...hospitalizedByDepartments[dep]
        });
      } else {
        // Other departements are in Metropolitan France
        const item = {
          country: 'iso1:FX', // ISO1 code for Metropolitan France
          county: `iso2:FR-${dep}`,
          state: departementsToRegion[dep],
          tested: testedByDepartements[dep],
          ...hospitalizedByDepartments[dep]
        };

        // Add to a region dictionary to perform aggregation later
        const regionArr = regions[departementsToRegion[dep]] || [];
        regionArr.push(item);
        regions[departementsToRegion[dep]] = regionArr;

        departements.push(item);
      }
    }

    assert(departements.length === 96, 'Invalid number of départements');
    assert(Object.keys(regions).length === 13, 'Invalid number of metropolitan régions');
    assert(overseas.length === 5, 'Invalid number of overseas territories');

    const data = [];

    data.push(...overseas);

    data.push(...departements);

    // We aggregate by region
    for (const reg of Object.keys(regions)) {
      data.push(
        transform.sumData(regions[reg], {
          country: 'iso1:FX', // ISO1 code for Metropolitan France
          state: reg
        })
      );
    }

    // And for all of Metropolitan France
    data.push(transform.sumData(departements, { country: 'iso1:FX' }));

    // Make sure all ISO codes exist
    for (const item of data) {
      assert(iso1Codes[item.country.replace('iso1:', '')], `Missing iso1 code for country ${item.country}`);
      assert(!item.state || iso2Codes[item.state.replace('iso2:', '')], `Missing iso2 code for région ${item.state}`);
      assert(
        !item.county || iso2Codes[item.county.replace('iso2:', '')],
        `Missing iso2 code for département ${item.county}`
      );
    }

    return data;
  }
};

export default scraper;
