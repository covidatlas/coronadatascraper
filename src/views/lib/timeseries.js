module.exports.filterTimeseriesByLocations = function(timeseries, locations) {
  if (!Array.isArray(locations)) {
    locations = [locations];
  }

  const subTimeseries = {};
  for (const date in timeseries) {
    const dateEntry = {};
    for (const location of locations) {
      dateEntry[location.id] = timeseries[date][`${location.id}`];
    }
    subTimeseries[date] = dateEntry;
  }

  return subTimeseries;
};
