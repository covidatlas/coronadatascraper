import * as fetch from '../../lib/fetch/index.js';
import * as parse from '../../lib/parse.js';
import datetime from '../../lib/datetime/index.js';

// import { features } from './features.json';

const scraper = {
  country: 'iso1:FR',
  timeseries: true,
  priority: 1,
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE);

    const datasets = await fetch.csv(
      'https://www.data.gouv.fr/fr/organizations/sante-publique-france/datasets-resources.csv',
      false,
      { delimiter: ';' }
    );

    const hopitalizedDataset = datasets.find(entry => entry.title.match(/donnees-hospitalieres-covid19-.*.csv/));
    const testedDataset = datasets.find(entry => entry.title.match(/donnees-tests-covid19-labo-quotidien-.*.csv/));

    let hopitalizedData = await fetch.csv(hopitalizedDataset.url, false, { delimiter: ';' });
    hopitalizedData = hopitalizedData.filter(item => item.sexe === '0');

    let testedData = await fetch.csv(testedDataset.url, false, { delimiter: ';' });
    testedData = testedData.filter(item => item.clage_covid === '0');

    const testedByDepartements = {};

    for (const item of testedData) {
      if (datetime.dateIsBeforeOrEqualTo(item.jour, date))
        testedByDepartements[item.dep] = parse.number(item.nb_test) + (testedByDepartements[item.dep] || 0);
    }

    const hospitalizedByDepartments = {};

    for (const item of hopitalizedData) {
      const prev = hospitalizedByDepartments[item.dep];
      if (prev) {
        const deltaDeaths = parse.number(item.dc) - prev.deaths;
        const deltaDischarged = parse.number(item.rad) - prev.discharged;
        const newHospitalized = parse.number(item.hosp) - prev.todayHospitalized + deltaDeaths + deltaDischarged;

        hospitalizedByDepartments[item.dep] = {
          todayHospitalized: parse.number(item.hosp),
          hospitalized: prev.hospitalized + newHospitalized,
          deaths: parse.number(item.dc),
          discharged: parse.number(item.rad)
        };
      } else {
        hospitalizedByDepartments[item.dep] = {
          todayHospitalized: parse.number(item.hosp),
          hospitalized: parse.number(item.hosp),
          deaths: parse.number(item.dc),
          discharged: parse.number(item.rad)
        };
      }
    }

    const departements = [];
    for (const dep of Object.keys(testedByDepartements)) {
      departements.push({
        county: dep,
        tested: testedByDepartements[dep],
        ...hospitalizedByDepartments[dep]
      });
    }

    return departements;
  }
};

export default scraper;
