const imports = require('esm')(module);

const lunr = imports('lunr');
const fs = imports('../shared/lib/fs.js');

function locationFullName(location) {
  const parts = [location.cityName, location.countyName, location.stateName, location.countryName];
  return parts.filter(s => s).join(', ');
}

function buildLocationMap(locations) {
  const locationMap = {};
  locations.forEach((location, index) => {
    location.id = index;
    location.name = locationFullName(location);
    location.featureID = location.locationID;
    locationMap[location.slug] = location;
  });
  return locationMap;
}

function buildBarebonesLocationMap(locations) {
  const locationMap = {};
  locations.forEach((location, index) => {
    locationMap[location.slug] = {
      id: index,
      locationID: location.locationID,
      featureID: location.locationID,
      name: locationFullName(location)
    };
  });
  return locationMap;
}

function getSkinnyLocation(location) {
  return {
    name: locationFullName(location),
    level: location.level,
    city: location.cityName,
    county: location.countyName,
    state: location.stateName,
    country: location.countryName,
    featureID: location.locationID,
    locationID: location.locationID
  };
}

function buildSkinnyLocationMap(locations) {
  const locationMap = {};
  locations.forEach((location, index) => {
    locationMap[location.slug] = {
      id: index,
      ...getSkinnyLocation(location)
    };
  });

  return locationMap;
}

async function buildIndex(locations) {
  const index = lunr(function() {
    this.ref('slug');
    this.field('name');
    locations.forEach(function(location) {
      this.add({
        slug: location.slug,
        ...getSkinnyLocation(location)
      });
    }, this);
  });

  await fs.ensureDir('src/http/get-api-search/dist/');
  await fs.writeJSON('src/http/get-api-search/dist/search.json', index);
}

async function build(arc, cloudformation) {
  console.log('🤹‍♀️ Preparing Lambdae...');

  // Destroy proxy at root so we can take that over in `get /:location`
  if (cloudformation) {
    try {
      delete cloudformation.Resources.CovidAtlas.Properties.DefinitionBody.paths['/{proxy+}'];
    } catch (err) {
      console.log('Could not destroy root proxy config, deployment may fail');
    }
  }

  await Promise.all([
    fs.ensureDir('src/http/get-sources/dist/'),
    fs.ensureDir('src/http/get-crosscheck/dist/'),
    fs.ensureDir('src/http/get-000location/dist/')
  ]);

  await Promise.all([
    fs.copyFile('dist/timeseries.json', 'src/http/get-api-timeseries-000location/dist/timeseries.json'),
    fs.copyFile('dist/timeseries.json', 'src/http/get-000location/dist/timeseries.json'),
    fs.copyFile('dist/timeseries.json', 'src/http/get-embed-000location/dist/timeseries.json'),
    fs.copyFile('dist/features.json', 'src/http/get-api-features-000location/dist/features.json'),

    fs.copyFile('dist/ratings.json', 'src/http/get-000location/dist/ratings.json'),
    fs.copyFile('dist/report.json', 'src/http/get-000location/dist/report.json'),

    fs.copyFile('dist/ratings.json', 'src/http/get-sources/dist/ratings.json'),
    fs.copyFile('dist/report.json', 'src/http/get-crosscheck/dist/report.json')
  ]);

  const locations = await fs.readJSON('dist/locations.json');

  // Generate full location map
  const locationMap = buildLocationMap(locations);
  await fs.writeJSON('src/http/get-embed-000location/dist/location-map.json', locationMap, { space: 0 });
  await fs.writeJSON('src/http/get-000location/dist/location-map.json', locationMap, { space: 0 });
  await fs.writeJSON('src/http/get-api-locations-000location/dist/location-map.json', locationMap, { space: 0 });

  // Generate barebones map
  const locationMapBarebones = buildBarebonesLocationMap(locations);
  await fs.writeJSON('src/http/get-api-search/dist/location-map-barebones.json', locationMapBarebones, { space: 0 });

  // Generate skinny map
  const locationMapSkinny = buildSkinnyLocationMap(locations);
  await fs.writeJSON('src/http/get-api-timeseries-000location/dist/location-map-skinny.json', locationMapSkinny, {
    space: 0
  });
  await fs.writeJSON('src/http/get-api-features-000location/dist/location-map-skinny.json', locationMapSkinny, {
    space: 0
  });
  await fs.writeJSON('src/http/get-api-timeseries-000location/dist/location-map-skinny.json', locationMapSkinny, {
    space: 0
  });
  await fs.writeJSON('src/http/get-api-features-000location/dist/location-map-skinny.json', locationMapSkinny, {
    space: 0
  });

  // Generate search index
  await buildIndex(locations);

  return cloudformation;
}

module.exports = build;
