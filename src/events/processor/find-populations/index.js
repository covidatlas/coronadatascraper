import { join, resolve } from 'path';
import reporter from '../../../shared/lib/error-reporter.js';
import * as fs from '../../../shared/lib/fs.js';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
import log from '../../../shared/lib/log.js';

const dataPath = join(__dirname, '..', 'vendor', 'population');

/*
  Read population data from a CSV with correct datatypes
*/
async function readPopulationFromCSV(csvPath) {
  const output = await fs.readCSV(resolve(dataPath, csvPath));
  const populationData = {};
  for (const item of output) {
    if (item.population) {
      populationData[item.name] = parseInt(item.population, 10);
    } else {
      throw new Error(`Invalid data in ${csvPath} for ${item.name}`);
    }
  }

  return populationData;
}

async function readPopulationData(featureCollection) {
  const populations = {
    byCity: {},
    byCounty: {
      USA: await readPopulationFromCSV(join(dataPath, 'population-usa-counties.csv')),
      GBR: await readPopulationFromCSV(join(dataPath, 'population-gbr-counties.csv'))
    },
    byState: {
      China: await readPopulationFromCSV(join(dataPath, 'population-china-admin-divisions.csv')),
      Australia: await readPopulationFromCSV(join(dataPath, 'population-australia-states.csv')),
      Canada: await readPopulationFromCSV(join(dataPath, 'population-canada-provinces.csv')),
      Italy: await readPopulationFromCSV(join(dataPath, 'population-italy-regions.csv')),
      USA: await readPopulationFromCSV(join(dataPath, 'population-usa-states-abbrev.csv')),
      Brazil: await readPopulationFromCSV(join(dataPath, 'population-brazil-states-abbrev.csv')),
      Spain: await readPopulationFromCSV(join(dataPath, 'population-ESP.csv'))
    },
    byCountry: {},
    supplemental: await readPopulationFromCSV(join(dataPath, 'population-supplemental.csv'))
  };

  populations.byState.CHN = populations.byState.China;
  populations.byState.CAN = populations.byState.Canada;
  populations.byState.ITA = populations.byState.Italy;
  populations.byState.AUS = populations.byState.Australia;
  populations.byState.BRA = populations.byState.Brazil;
  populations.byState.ESP = populations.byState.Spain;

  // Store data from features
  for (const feature of featureCollection.features) {
    if (feature.properties.pop_est) {
      populations.byCountry[feature.properties.name] = feature.properties.pop_est;
      if (feature.properties.name_en) {
        populations.byCountry[feature.properties.name_en] = feature.properties.pop_est;
      }
      if (feature.properties.abbrev) {
        populations.byCountry[feature.properties.abbrev.replace(/\./g, '')] = feature.properties.pop_est;
      }
    }
  }

  return populations;
}

const generatePopulations = async ({ locations, featureCollection, report, options, sourceRatings }) => {
  log('⏳ Getting population data...');

  const populations = await readPopulationData(featureCollection);

  async function getPopulation(location) {
    let population = null;

    const city = location.city && location.city.split(':').pop();
    const county = location.county && location.county.split(':').pop();
    const state = location.state && location.state.split(':').pop();
    const country = location.country && location.country.split(':').pop();

    if (city) {
      // Use either city by country or city by state
      let populationSource = populations.byCity[country];
      if (populationSource && populationSource[state]) {
        populationSource = populationSource[state];
      }
      if (populationSource && populationSource[state]) {
        population = populationSource[city];
      }
    } else if (county) {
      if (populations.byCounty[country]) {
        // Try counties
        const populationSource = populations.byCounty[country];
        const countyNameReplaced = county.replace('Parish', 'County');
        const countyNameJoined = `${county}, ${state}`;
        const countyNameReplacedJoined = `${countyNameReplaced}, ${state}`;

        population =
          populationSource[county] ||
          populationSource[countyNameReplaced] ||
          populationSource[countyNameJoined] ||
          populationSource[countyNameReplacedJoined];
      }
    } else if (state) {
      if (populations.byState[country] && populations.byState[country][state]) {
        // Try states
        population = populations.byState[country][state];
      }
    } else {
      // Try countries
      population = populations.byCountry[country];
    }

    if (!population) {
      population = populations.supplemental[city];
    }

    if (!population) {
      population = populations.supplemental[county];
    }

    if (!population) {
      population = populations.supplemental[state];
    }

    if (!population) {
      population = populations.supplemental[country];
    }

    if (!population) {
      if (location.featureId !== undefined) {
        const feature = featureCollection.features[location.featureId];
        if (feature.properties.pop_est) {
          population = feature.properties.pop_est;
        }
      }
    }

    return population;
  }

  const errors = [];

  let populationFound = 0;
  for (const location of locations) {
    if (location.population) {
      continue;
    }

    let population;

    // get data from id if present
    const clId = countryLevels.getIdFromLocation(location);
    if (clId) {
      population = await countryLevels.getPopulation(clId);
    } else {
      population = await getPopulation(location);
    }

    if (population) {
      location.population = population;
      populationFound++;
      if (location.area) {
        location.populationDensity = population / (location.area / 1000000);
      }
    } else {
      log.error('  ❌ %s: ?', geography.getName(location));
      errors.push(geography.getName(location));
      reporter.logError('population', 'missing population', '', 'low', location);
    }
  }
  log('✅ Found population data for %d out of %d locations', populationFound, Object.keys(locations).length);

  report.findPopulation = {
    numLocationsWithPopulation: populationFound,
    missingPopulations: errors
  };

  return { locations, featureCollection, report, options, sourceRatings };
};

export default generatePopulations;
