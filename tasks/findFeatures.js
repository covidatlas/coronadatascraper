import path from 'path';

import turf from '@turf/turf';

import * as fs from '../lib/fs.js';
import * as transform from '../lib/transform.js';

const DEBUG = false;

function cleanProps(obj) {
  if (obj.wikipedia === -99) {
    delete obj.wikipedia;
  }

  for (let prop in obj) {
    if (typeof obj[prop] === 'string' && obj[prop].trim() === '') {
      delete obj[prop];
    }
  }

  return obj;
}

function takeOnlyProps(obj, props) {
  let newObj = {};
  for (let prop of props) {
    if (typeof obj[prop] !== 'undefined') {
      newObj[prop] = obj[prop];
    }
  }
  return newObj;
}

function normalizeProps(obj) {
  let newObj = {};
  for (let prop in obj) {
    newObj[prop.toLowerCase()] = obj[prop];
  }
  return newObj;
}

let props = ['name', 'name_en', 'abbrev', 'region', 'admin', 'postal', 'gu_a3', 'geonunit', 'pop_est', 'pop_year', 'gdp_md_est', 'gdp_year', 'iso_a2', 'iso_3166_2', 'type_en', 'wikipedia'];

const locationTransforms = {
  // Correct missing county
  'Island, WA': location => {
    location.state = 'Island County, WA';
  },

  // 🇭🇰
  'Hong Kong': location => {
    location.country = 'Hong Kong';
    delete location.state;
  },

  // Why is this in Denmark?
  'Faroe Islands': location => {
    location.country = 'Faroe Islands';
    delete location.state;
  },

  // Why is it UK, United Kingdom?
  UK: location => {
    delete location.state;
  }
};

function cleanFeatures(set) {
  for (let feature of set.features) {
    feature.properties = cleanProps(takeOnlyProps(normalizeProps(feature.properties), props));
  }
}

const generateFeatures = ({ locations, report }) => {
  function storeFeature(feature, location) {
    let index = featureCollection.features.indexOf(feature);
    if (index === -1) {
      index = featureCollection.features.push(feature) - 1;
      if (feature.properties.geonunit) {
        feature.properties.shortName = feature.properties.name;
        feature.properties.name = feature.properties.name + ', ' + feature.properties.geonunit;
      }
    }

    // Store coordinates on location
    if (feature.geometry) {
      location.coordinates = turf.center(feature).geometry.coordinates;
    }

    if (DEBUG) {
      console.log('Storing %s in %s', location.name, feature.properties.name);
    }

    feature.properties.id = index;
    location.featureId = index;
    foundCount++;
  }

  let foundCount = 0;
  let featureCollection = {
    type: 'FeatureCollection',
    features: []
  };

  return new Promise(async (resolve, reject) => {
    console.log('⏳ Generating features...');

    const usStates = await fs.readJSON('./coronavirus-data-sources/lib/us-states.json');
    const countryData = await fs.readJSON('./coronavirus-data-sources/geojson/world-countries.json');
    const usCountyData = await fs.readJSON('./coronavirus-data-sources/geojson/usa-counties.json');
    const provinceData = await fs.readJSON('./coronavirus-data-sources/geojson/world-states-provinces.json');

    // Clean and normalize data first
    cleanFeatures(countryData);
    cleanFeatures(provinceData);

    const errors = [];

    locationLoop: for (let location of locations) {
      let found = false;
      let point;
      if (location.coordinates) {
        point = turf.point(location.coordinates);
      }

      // Breaks France
      if (location.country === 'REU' ||
          location.country === 'MTQ' ||
          location.country === 'GUF') {
        console.warn('  ⚠️  Skipping %s because it breaks France', transform.getName(location));
        continue;
      }

      if (location.county === '(unassigned)') {
        console.warn('  ⚠️  Skipping %s because it\'s unassigned',  transform.getName(location));
        continue;
      }

      // Apply transforms
      if (locationTransforms[location.state]) {
        locationTransforms[location.state](location);
      }

      if (location.state) {
        if (location.country === 'USA') {
          if (location.county) {
            // Find county
            for (let feature of usCountyData.features) {
              if (!location.county) {
                continue;
              }

              if (feature.properties.name === location.county.replace('Parish', 'County') + ', ' + location.state) {
                found = true;
                storeFeature(feature, location);
                continue locationLoop;
              }
              if (point && feature.geometry) {
                let poly = turf.feature(feature.geometry);
                if (turf.booleanPointInPolygon(point, poly)) {
                  found = true;
                  storeFeature(feature, location);
                  continue locationLoop;
                }
              }
            }
          } else if (location.state) {
            for (let feature of provinceData.features) {
              if (location.state === feature.properties.postal) {
                found = true;
                storeFeature(feature, location);
                continue locationLoop;
              }
            }
          }
        }

        // Check if the location exists within our provinces
        for (let feature of provinceData.features) {
          if (location.country === feature.properties.gu_a3 && (location.state === feature.properties.name || location.state === feature.properties.name_en || location.state === feature.properties.region)) {
            found = true;
            storeFeature(feature, location);
            break;
          }

          if (point && feature.geometry) {
            let poly = turf.feature(feature.geometry);
            if (turf.booleanPointInPolygon(point, poly)) {
              found = true;
              storeFeature(feature, location);
              break;
            }
          }

          // Match alternate names
          // No known location, but might be useful in the future
          if (feature.properties.alt && feature.properties.alt.split('|').indexOf(location.state) !== -1) {
            found = true;
            storeFeature(feature, location);
            break;
          }
          if (feature.properties.region === location.state && feature.properties.admin === location.country) {
            found = true;
            storeFeature(feature, location);
            break;
          }
        }
      } else {
        // Check if the location exists within our countries
        for (let feature of countryData.features) {
          // Find by full name
          if (location.country === feature.properties.name) {
            found = true;
            storeFeature(feature, location);
            break;
          }

          // Find by abbreviation
          if (feature.properties.abbrev && feature.properties.abbrev.replace(/\./g, '') === location.country) {
            found = true;
            storeFeature(feature, location);
            break;
          }

          if (point && feature.geometry) {
            let poly = turf.feature(feature.geometry);

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
          for (let feature of provinceData.features) {
            if (location.country === feature.properties.name) {
              found = true;
              storeFeature(feature, location);
              break;
            }

            // Find by geonunit
            if (feature.properties.geonunit === location.country) {
              found = true;
              storeFeature(feature, location);
              break;
            }

            if (point && feature.geometry) {
              let poly = turf.feature(feature.geometry);

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
        console.error('  ❌ Could not find location %s', transform.getName(location));
        errors.push(transform.getName(location));
      }
    }

    console.log('✅ Found features for %d out of %d regions for a total of %d features', foundCount, Object.keys(locations).length, featureCollection.features.length);

    report['findFeatures'] = {
      numFeaturesFound: foundCount,
      missingFeatures: errors
    };

    resolve({ locations, featureCollection, report });
  });
};

export default generateFeatures;
