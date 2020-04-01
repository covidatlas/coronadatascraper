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
