# Data fields

## All files

The following fields are available in all files for each geographical entity:

* `name` - the full name of the geographical entity being represented
* `city` - the name of the city
* `county` - county or parish or the appropriate name of the administrative subdivision below the level of state or equivalent
* `state` - state, province or region depending on jurisdiction. In general, the first administrative subdivision below the level of country
* `country` - the human readable country name
* `level` - one of `city`, `county`, `state`, `country`. Provided in order to facilitate filtering

In addition, ISO IDs are provided for each location. See the [`country-levels`](https://github.com/hyperknot/country-levels) project for details.

* `countryId` - [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) ID of the country country, i.e. `iso1:US` for US
* `stateId` - [ISO 3166-2](https://en.wikipedia.org/wiki/ISO_3166-2) ID of the state/province, i.e. `iso2:US-NY` for New York, US
* `countyId` - local ID of the county/region (i.e. `fips:36005` for Bronx County, New York, US)

In general, whenever the record is about administrative subdivisions of a level, you'll find all larger levels are non-empty. However, there are exceptions. New York City will not have a `county` field because it is subdivided into five counties.

The following fields are uniquely determined by the geographical entity and are provided as a convenience.

* `population` - a recent estimate of the population in the geographical entity, determined from census data or official sources
* `populationDensity` - the population density in residents per square kilometer
* `lat` - latitude of the geographical entity
* `long` - longitude of the geographical entity
* `tz` - an array of time zones for the geographical entity
* `featureId` - the ID of the GeoJSON feature for this entity, corresponding to `properties.id` in the FeatureCollection provided by `feature.json`

Additional attributes of a data point are:

* `url` - the source for the data point
* `aggregate` - the original level of aggregation of the source, e.g. country level data may have been obtained directly or by summation of state or county level data.
* `rating` - the objective rating of the source. See [sources](https://coronadatascraper.com/#sources) for details.


### `data.json`, `data.csv`, `timeseries.json`, and `timeseries-byLocation.json`

The following fields define the epidemiological information for a data point:

* `cases` - The cumulative number of confirmed or presumed confirmed cases
* `active` - The current number of confirmed or presumed confirmed cases. Will be calculated automatically if `cases` and `recovered` cumulative numbers are provided.
* `deaths` - The cumulative number of deaths attributed to COVID-19
* `recovered` - The cumulative number of recoveries
* `tested` - The cumulative number of tests from which results have been obtained (does not include pending tests)
* `hospitalized` - The cumulative number of patients hospitalized for COVID-19
* `hospitalized_current` - The current number of patients hospitalized for COVID-19. Will be calculated automatically if `hospitalized` and `discharged` cumulative numbers are provided.
* `discharged` - The cumulative number of patients discharged after hospitalization for COVID-19
* `icu` - The cumulative number of patients hospitalized in the intensive care unit for COVID-19
* `icu_current` - The current number of patients hospitalized in the intensive care unit for COVID-19

The following fields detail the data's source:

* `url` - The exact URL from which the data was obtained
* `sources` - An array of sources that published the data
* `curators` - An array of curators responsible for manually curating the data
* `maintainers` - An array of maintainers responsible for writing the scraper code that obtains the data


### `timeseries-tidy.csv`

For each entry, the following data is provided:

* `date` - the date the data point refers to
* `type` - the type of data point: cases, tested, deaths, hospitalized, discharged, or recovered
* `value` - the value of the data point (a cumulative count of events of a certain type)
