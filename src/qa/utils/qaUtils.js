export const eachLocation = (t, locations, fcn) =>
  locations.forEach(location => t.test(`l>${location[0]}`, t => fcn(t, ...location)));

export const eachDate = (t, location, fcn) =>
  Object.entries(location.dates || {}).forEach(entry => t.test(`d>${entry[0]}`, t => fcn(t, ...entry)));
