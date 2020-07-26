module.exports.levels = ['city', 'county', 'state', 'country'];

/** Get the full name of a location
 * @param {{ city: string?; county: string?; state: string?; country: string?; }} location
 */
module.exports.getName = location =>
  [location.city, location.county, location.state, location.country].filter(Boolean).join(', ');

const isCountry = (module.exports.isCountry = function(location) {
  return location && location.country && !location.state && !location.county && !location.city;
});

const isState = (module.exports.isState = function(location) {
  return location && location.state && !location.county && !location.city;
});

const isCounty = (module.exports.isCounty = function(location) {
  return location && location.county && !location.city;
});

const isCity = (module.exports.isCity = function(location) {
  return location && location.city;
});

module.exports.getLocationGranularityName = function(location) {
  if (isCountry(location)) {
    return 'country';
  }
  if (isState(location)) {
    return 'state';
  }
  if (isCounty(location)) {
    return 'county';
  }
  if (isCity(location)) {
    return 'city';
  }
  return 'none';
};

const getChildLocations = (module.exports.getChildLocations = function(location, locations) {
  // Find all its children
  return Object.values(locations)
    .filter(loc => loc.locationID !== location.locationID)
    .filter(loc => loc.locationID.startsWith(location.locationID));
});

const getParentLocation = (module.exports.getParentLocation = function(location, locations) {
  const parts = location.locationID.split('#');
  parts.pop(); // Remove the last element
  const parentLocID = parts.join('#');
  return Object.values(locations).find(loc => loc.locationID === parentLocID);
});

module.exports.getSiblingLocations = function(location, locations) {
  const parentLoc = getParentLocation(location, locations);
  if (!parentLoc) {
    console.log('Will not look for siblings of %s', location.name);
    // Ideally, we find adjacent countries
    // Since this is not yet handled, just return the location
    return [location];
  }

  const childLocs = getChildLocations(parentLoc, locations);
  return childLocs.filter(loc => loc.locationID !== location.locationID);
};
