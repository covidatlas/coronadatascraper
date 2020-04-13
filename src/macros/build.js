const imports = require('esm')(module);

const lunr = imports('lunr');
const fs = imports('../shared/lib/fs.js');
const geography = imports('../views/lib/geography.js');

function buildLocationMap(locations) {
  const locationMap = {};
  for (const [id, location] of Object.entries(locations)) {
    const shortName = geography.getSlug(location);
    location.id = id;
    locationMap[shortName] = location;
  }
  return locationMap;
}

function getBarebonesLocation(location) {
  return {
    name: location.name
  };
}

function buildBarebonesLocations(locations) {
  const barebonesLocations = {};

  for (const [id, location] of Object.entries(locations)) {
    barebonesLocations[geography.getSlug(location)] = {
      id,
      ...getBarebonesLocation(location)
    };
  }

  return barebonesLocations;
}

function getSkinnyLocation(location) {
  return {
    name: location.name,
    level: location.level,
    city: location.city,
    county: location.county,
    state: location.state,
    country: location.country,
    featureId: location.featureId
  };
}

function buildSkinnyLocations(locations) {
  const skinnyLocations = {};

  for (const [id, location] of Object.entries(locations)) {
    skinnyLocations[geography.getSlug(location)] = {
      id,
      ...getSkinnyLocation(location)
    };
  }

  return skinnyLocations;
}

async function buildIndex(locations) {
  const index = lunr(function() {
    this.ref('slug');
    this.field('name');

    locations.forEach(function(location) {
      const slug = geography.getSlug(location);

      this.add({
        slug,
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
    fs.copyFile('dist/locations.json', 'src/http/get-api-locations-000location/dist/locations.json'),
    fs.copyFile('dist/timeseries.json', 'src/http/get-api-timeseries-000location/dist/timeseries.json'),
    fs.copyFile('dist/features.json', 'src/http/get-api-features-000location/dist/features.json'),

    fs.copyFile('dist/ratings.json', 'src/http/get-sources/dist/ratings.json'),
    fs.copyFile('dist/report.json', 'src/http/get-crosscheck/dist/report.json'),
    fs.copyFile('dist/timeseries.json', 'src/http/get-000location/dist/timeseries.json'),
    fs.copyFile('dist/features.json', 'src/http/get-000location/dist/features.json')
  ]);

  // Generate location map
  const locations = await fs.readJSON('dist/locations.json');
  const locationMap = buildLocationMap(locations);

  // Store location map for so many places
  await fs.writeJSON('src/http/get-000location/dist/location-map.json', locationMap);
  await fs.writeJSON('src/http/get-index/dist/location-map.json', locationMap);
  await fs.writeJSON('src/http/get-api-locations-000location/dist/location-map.json', locationMap);
  await fs.writeJSON('src/http/get-api-timeseries-000location/dist/location-map.json', locationMap);
  await fs.writeJSON('src/http/get-api-features-000location/dist/location-map.json', locationMap);

  // Generate barebones/skinny locations
  const barebonesLocations = buildBarebonesLocations(locations);
  await fs.writeJSON('src/http/get-api-search/dist/barebonesLocations.json', barebonesLocations);
  const skinnyLocations = buildSkinnyLocations(locations);
  await fs.writeJSON('src/http/get-api-timeseries-000location/dist/skinnyLocations.json', skinnyLocations);
  await fs.writeJSON('src/http/get-api-features-000location/dist/skinnyLocations.json', skinnyLocations);

  // Generate search index
  await buildIndex(locations);

  return cloudformation;
}

module.exports = build;
