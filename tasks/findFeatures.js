import * as turf from '@turf/turf';
import * as fs from '../lib/fs.js';
import * as transform from '../lib/transform.js';
import espGeoJson from '../coronavirus-data-sources/geojson/ESP.json';
import * as geography from '../lib/geography.js';

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
  // eslint-disable-next-line guard-for-in
  for (const prop in obj) {
    newObj[prop.toLowerCase()] = obj[prop];
  }
  return newObj;
}

const props = ['name', 'name_en', 'abbrev', 'region', 'admin', 'postal', 'gu_a3', 'adm0_a3', 'geonunit', 'pop_est', 'pop_year', 'gdp_md_est', 'gdp_year', 'iso_a2', 'iso_3166_2', 'type_en', 'wikipedia'];

const locationTransforms = {
  // 🇭🇰
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

const generateFeatures = ({ locations, report, options, sourceRatings }) => {
  const featureCollection = {
    type: 'FeatureCollection',
    features: []
  };

  let foundCount = 0;

  function storeFeature(feature, location) {
    let index = featureCollection.features.indexOf(feature);
    if (index === -1) {
      index = featureCollection.features.push(feature) - 1;
      if (feature.properties.geonunit) {
        feature.properties.shortName = feature.properties.name;
        feature.properties.name = `${feature.properties.name}, ${feature.properties.geonunit}`;
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

  return new Promise(async resolve => {
    console.log('⏳ Generating features...');

    const countryData = await fs.readJSON('./coronavirus-data-sources/geojson/world-countries.json');
    const usCountyData = await fs.readJSON('./coronavirus-data-sources/geojson/usa-counties.json');
    const itaRegionsData = await fs.readJSON('./coronavirus-data-sources/geojson/ita-regions.json');
    const provinceData = await fs.readJSON('./coronavirus-data-sources/geojson/world-states-provinces.json');

    provinceData.features = itaRegionsData.features.concat(provinceData.features);

    // Clean and normalize data first
    cleanFeatures(countryData);
    cleanFeatures(provinceData);

    const errors = [];

    locationLoop: for (const location of locations) {
      let found = false;
      let point;
      if (location.coordinates) {
        point = turf.point(location.coordinates);
      }

      // Breaks France
      if (location.country === 'REU' || location.country === 'MTQ' || location.country === 'GUF') {
        console.warn('  ⚠️  Skipping %s because it breaks France', geography.getName(location));
        continue;
      }

      if (location.county === '(unassigned)') {
        console.warn("  ⚠️  Skipping %s because it's unassigned", geography.getName(location));
        continue;
      }

      // Apply transforms
      if (locationTransforms[location.state]) {
        locationTransforms[location.state](location);
      }

      if (location.state || location.county) {
        if (location.country === 'USA') {
          if (location.county) {
            // Find county
            for (const feature of usCountyData.features) {
              if (!location.county) {
                continue;
              }
              if (feature.properties.name === `${location.county.replace('Parish', 'County')}, ${location.state}`) {
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
          } else if (location.state) {
            for (const feature of provinceData.features) {
              if (location.state === feature.properties.postal && feature.properties.adm0_a3 === 'USA') {
                found = true;
                storeFeature(feature, location);
                continue locationLoop;
              }
            }
          }
        } else if (location.country === 'ESP') {
          const feature = espGeoJson.features.find(d => d.properties.name === location.state);
          if (feature) {
            found = true;
            storeFeature(feature, location);
          }
        } else {
          // Check if the location exists within our provinces
          for (const feature of provinceData.features) {
            const countryMatches = location.country === feature.properties.gu_a3 || location.country === feature.properties.adm0_a3;
            const stateMatches = location.state && (location.state === feature.properties.name || location.state === feature.properties.name_en || location.state === feature.properties.region);
            const countyMatches = location.county && (location.county === feature.properties.name || location.county === feature.properties.name_en || location.county === feature.properties.region);
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
        }
      } else {
        // Check if the location exists within our countries
        for (const feature of countryData.features) {
          // Find by full name
          if (location.country === feature.properties.adm0_a3 || location.country === feature.properties.gu_a3) {
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
        console.error('  ❌ Could not find location %s', geography.getName(location));
        errors.push(geography.getName(location));
      }
    }

    console.log('✅ Found features for %d out of %d regions for a total of %d features', foundCount, Object.keys(locations).length, featureCollection.features.length);

    report.findFeatures = {
      numFeaturesFound: foundCount,
      missingFeatures: errors
    };

    resolve({ locations, featureCollection, report, options, sourceRatings });
  });
};

export default generateFeatures;
