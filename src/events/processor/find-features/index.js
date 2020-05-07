import { join } from 'path';
import reporter from '../../../shared/lib/error-reporter.js';
import * as fs from '../../../shared/lib/fs.js';
import * as countryLevels from '../../../shared/lib/geography/country-levels.js';
import * as geography from '../../../shared/lib/geography/index.js';
import * as turf from '../../../shared/lib/geography/turf.js';
import log from '../../../shared/lib/log.js';
import espGeoJson from '../vendor/esp.json';

const DEBUG = false;

function cleanProps(obj) {
  if (obj.wikipedia === -99) {
    delete obj.wikipedia;
  }

  for (const prop in obj) {
    if (typeof obj[prop] === 'string' && obj[prop].trim() === '') {
      delete obj[prop];
    }
  }

  return obj;
}

function takeOnlyProps(obj, props) {
  const newObj = {};
  for (const prop of props) {
    if (typeof obj[prop] !== 'undefined') {
      newObj[prop] = obj[prop];
    }
  }
  return newObj;
}

function normalizeProps(obj) {
  const newObj = {};
  for (const prop in obj) {
    newObj[prop.toLowerCase()] = obj[prop];
  }
  return newObj;
}

const props = [
  'name',
  'name_en',
  'abbrev',
  'region',
  'admin',
  'postal',
  'gu_a3',
  'adm0_a3',
  'geonunit',
  'pop_est',
  'pop_year',
  'gdp_md_est',
  'gdp_year',
  'iso_a2',
  'iso_3166_2',
  'type_en',
  'wikipedia'
];

const locationTransforms = {
  // ��
  'Hong Kong': location => {
    location.country = 'HKG';
    delete location.state;
  },

  Macau: location => {
    location.country = 'MAC';
    delete location.state;
  },

  // Why is this in Denmark?
  'Faroe Islands': location => {
    location.country = 'FRO';
    delete location.state;
  }
};

function cleanFeatures(set) {
  for (const feature of set.features) {
    feature.properties = cleanProps(takeOnlyProps(normalizeProps(feature.properties), props));
  }
}

function matchFeature(props, featuresData) {
  for (const featureData of featuresData) {
    for (const feature of featureData.features) {
      let found = true;
      Object.keys(props).forEach(key => {
        if (feature.properties[key] !== props[key]) {
          found = false;
        }
      });

      if (found) {
        return feature;
      }
    }
  }
  return undefined;
}

/**
 * @param {string?} locationItem
 * @param {{ properties: { name: string?; name_en: string?; region: string?; }; }} feature
 */
function locationPropertyMatchesFeature(locationItem, feature) {
  return (
    locationItem &&
    [feature.properties.name, feature.properties.name_en, feature.properties.region].some(
      toMatch => toMatch === locationItem
    )
  );
}

const generateFeatures = ({ locations, report, options, sourceRatings }) => {
  const featureCollection = {
    type: 'FeatureCollection',
    features: []
  };

  let foundCount = 0;

  function storeFeature(feature, location) {
    feature.properties = feature.properties || {};

    let index = featureCollection.features.indexOf(feature);
    if (index === -1) {
      index = featureCollection.features.push(feature) - 1;
      if (feature.properties && feature.properties.geonunit) {
        feature.properties.shortName = feature.properties.name;
        feature.properties.name = `${feature.properties.name}, ${feature.properties.geonunit}`;
      }
    }

    // Store coordinates and area on location
    if (feature.geometry) {
      location.coordinates = turf.center(feature).geometry.coordinates;
      location.area = turf.area(feature.geometry);
    }

    if (DEBUG) {
      console.log('Storing %s in %s', location.name, feature.properties.name);
    }

    if (!location.feature) {
      // unless the location comes with its own feature
      // if it has an id, we use it
      const clId = countryLevels.getIdFromLocation(location);
      if (clId) {
        index = clId;
        location.tz = [countryLevels.getTimezone(clId)];
      }
    }

    feature.properties.id = index;
    location.featureId = index;
    foundCount++;
  }

  return new Promise(async resolve => {
    log('⏳ Generating features...');

    const usCountyData = await fs.readJSON(join(__dirname, '..', '..', '..', 'shared', 'vendor', 'usa-counties.json'));
    const countryData = await fs.readJSON(join(__dirname, '..', 'vendor', 'world-countries.json'));
    const itaRegionsData = await fs.readJSON(join(__dirname, '..', 'vendor', 'ita-regions.json'));
    const provinceData = await fs.readJSON(join(__dirname, '..', 'vendor', 'world-states-provinces.json'));

    provinceData.features = itaRegionsData.features.concat(provinceData.features);

    // Clean and normalize data first
    cleanFeatures(countryData);
    cleanFeatures(provinceData);

    const errors = [];

    const featuresData = [provinceData, usCountyData, countryData];

    locationLoop: for (const location of locations) {
      let found = false;

      // const city = location.city && location.city.split(':').pop();
      const county = location.county && location.county.split(':').pop();
      const state = location.state && location.state.split(':').pop();
      const country = location.country && location.country.split(':').pop();

      // Apply transforms
      if (locationTransforms[state]) {
        locationTransforms[state](location);
      }

      // If the location already comes with its own feature, store it
      if (location.feature) {
        found = true;
        if (Array.isArray(location.feature)) {
          location.feature.forEach(feature => storeFeature(feature, location));
        } else {
          storeFeature(location.feature, location);
        }
        delete location.feature;
        continue;
      }

      // use countryLevel's getFeature if id is present
      const clId = countryLevels.getIdFromLocation(location);
      if (clId) {
        const feature = await countryLevels.getFeature(clId);
        storeFeature(feature, location);
        continue;
      }

      let point;
      if (location.coordinates) {
        point = turf.point(location.coordinates);
      }

      if (location._featureId) {
        const feature = matchFeature(location._featureId, featuresData);
        if (feature) {
          found = true;
          storeFeature(feature, location);
          delete location.feature;
          continue;
        }
      }

      // Breaks France
      if (country === 'REU' || country === 'MTQ' || country === 'GUF') {
        log.warn('  ⚠️  Skipping %s because it breaks France', geography.getName(location));
        continue;
      }

      if (county === '(unassigned)') {
        log("  ℹ️  Skipping %s because it's unassigned", geography.getName(location));
        continue;
      }

      if (state || county) {
        if (country === 'US') {
          if (county) {
            // Find county
            for (const feature of usCountyData.features) {
              if (!county) {
                continue;
              }
              if (
                feature.properties.name === `${county.replace('County', 'Parish')}, ${state}` ||
                feature.properties.name === `${county.replace('Parish', 'County')}, ${state}`
              ) {
                found = true;
                storeFeature(feature, location);
                continue locationLoop;
              }
              if (point && feature.geometry) {
                const poly = turf.feature(feature.geometry);
                if (turf.booleanPointInPolygon(point, poly)) {
                  found = true;
                  storeFeature(feature, location);
                  continue locationLoop;
                }
              }
            }
          } else if (state) {
            for (const feature of provinceData.features) {
              if (state === feature.properties.postal && feature.properties.iso_a2 === 'US') {
                found = true;
                storeFeature(feature, location);
                continue locationLoop;
              }
            }
          }
        } else if (country === 'ES') {
          const feature = espGeoJson.features.find(d => d.properties.name === state);
          if (feature) {
            found = true;
            storeFeature(feature, location);
          }
        } else {
          // Check if the location exists within our provinces
          for (const feature of provinceData.features) {
            const countryMatches = country === feature.properties.gu_a3 || country === feature.properties.iso_a2;
            const stateMatches = locationPropertyMatchesFeature(state, feature);
            const countyMatches = locationPropertyMatchesFeature(county, feature);
            if (countryMatches && (stateMatches || countyMatches)) {
              found = true;
              storeFeature(feature, location);
              break;
            }

            if (point && feature.geometry) {
              const poly = turf.feature(feature.geometry);
              if (turf.booleanPointInPolygon(point, poly)) {
                found = true;
                storeFeature(feature, location);
                break;
              }
            }

            // Match alternate names
            // No known location, but might be useful in the future
            if (feature.properties.alt && feature.properties.alt.split('|').includes(state)) {
              found = true;
              storeFeature(feature, location);
              break;
            }
            if (feature.properties.region === state && feature.properties.admin === country) {
              found = true;
              storeFeature(feature, location);
              break;
            }
          }
        }
      } else {
        // Check if the location exists within our countries
        for (const feature of countryData.features) {
          // Find by full name
          if (
            country === feature.properties.adm0_a3 ||
            country === feature.properties.iso_a2 ||
            country === feature.properties.gu_a3
          ) {
            found = true;
            storeFeature(feature, location);
            break;
          }

          // Find by abbreviation
          if (feature.properties.abbrev && feature.properties.abbrev.replace(/\./g, '') === country) {
            found = true;
            storeFeature(feature, location);
            break;
          }

          if (point && feature.geometry) {
            const poly = turf.feature(feature.geometry);

            if (turf.booleanPointInPolygon(point, poly)) {
              found = true;
              storeFeature(feature, location);
              break;
            }
          }
        }

        // Check by province as a last resort
        if (!found) {
          // Check within provinces
          for (const feature of provinceData.features) {
            if (country === feature.properties.name) {
              found = true;
              storeFeature(feature, location);
              break;
            }

            // Find by geonunit
            if (feature.properties.geonunit === country) {
              found = true;
              storeFeature(feature, location);
              break;
            }

            if (point && feature.geometry) {
              const poly = turf.feature(feature.geometry);

              if (turf.booleanPointInPolygon(point, poly)) {
                found = true;
                storeFeature(feature, location);
                break;
              }
            }
          }
        }
      }

      if (!found) {
        log.error('  ❌ Could not find location %s', geography.getName(location));
        errors.push(geography.getName(location));
        reporter.logError('locations', 'missing location', '', 'low', location);
      }
    }

    log(
      '✅ Found features for %d out of %d regions for a total of %d features',
      foundCount,
      Object.keys(locations).length,
      featureCollection.features.length
    );

    report.findFeatures = {
      numFeaturesFound: foundCount,
      missingFeatures: errors
    };

    resolve({ locations, featureCollection, report, options, sourceRatings });
  });
};

export default generateFeatures;
