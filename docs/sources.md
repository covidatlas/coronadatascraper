# Sources and Scrapers

_Last updated: 2020-03-26_

**Table of content**
- [Sources and Scrapers](#sources-and-scrapers)
  - [Criteria for sources](#criteria-for-sources)
      - [1. Sources must be government or health organizations](#1-sources-must-be-government-or-health-organizations)
      - [2. Sources must provide the number of cases at a bare minimum](#2-sources-must-provide-the-number-of-cases-at-a-bare-minimum)
      - [3. Presumptive cases are considered confirmed](#3-presumptive-cases-are-considered-confirmed)
  - [Writing a source](#writing-a-source)
  - [Source rating](#source-rating)
  - [Scraping](#scraping)
    - [Fetching different types of documents](#fetching-different-types-of-documents)
    - [Library functions](#library-functions)
    - [Making sure your scraper doesn't break](#making-sure-your-scraper-doesnt-break)
    - [Using the HtmlTableValidator](#using-the-htmltablevalidator)
    - [Sample scraper](#sample-scraper)
    - [Generating data retroactively](#generating-data-retroactively)
    - [What to do if a scraper breaks?](#what-to-do-if-a-scraper-breaks)
  - [Features and population data](#features-and-population-data)
    - [Features](#features)
    - [Population](#population)
  - [Testing sources](#testing-sources)
    - [Test coverage](#test-coverage)
    - [Manual testing](#manual-testing)

This guide provides information on the criterias we use to determine whether a source should be added to the project, and offer technical details
regarding how a source can be implemented.

## Criteria for sources

Any source added to the scraper must meet the following criteria:

#### 1. Sources must be government or health organizations

No news articles, no aggregated sources, no Wikipedia.

#### 2. Sources must provide the number of cases at a bare minimum

Additional data is welcome.

#### 3. Presumptive cases are considered confirmed

In keeping with other datasets, presumptive cases should be considered part of the case total.

_If you have found a source that matches the criterias above, read on!_

## Writing a source

Sources can pull JSON, CSV, or good ol' HTML down and are written in a sort of modular way, with a handful of helpers available to clean up the data. Sources can pull in data for anything -- cities, counties, states, countries, or collections thereof. See the existing scrapers for ideas on how to deal with different ways of data being presented.

Start by going to `src/shared/scrapers/` and creating a new file in the country, region, and region directory (`src/shared/scrapers/USA/CA/mycounty-name.js`)

_Note:_ any files you create that start with `_` will be ignored by the crawler. This is a good way to create utility or shared functionality between scrapers.

Your source should export an object containing at a minimum the following properties:

* `url` - The source of the data
* `scraper` - An async function that scrapes data and returns objects, defined below

Add the following directly to the scraper object if the data you're pulling in is specific to a given location:

* `country` - [ISO 3166-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
* `state` - The state, province, or region
* `county` - The county or parish
* `city` - The city name

Additional flags can be set:

* `type` - one of `json`, `csv`, `table`, `list`, `paragraph`, `pdf`, `image`. assumes `list` if `undefined`.
* `timeseries` - `true` if this source provides timeseries data, `false` or `undefined` if it only provides the latest data
* `headless` - whether this source requires a headless browser to scrape
* `certValidation` - `false` to skip certificate validation when running this scraper (used to workaround certificate errors)
* `priority` - any number (negative or positive). `0` is default, higher priority wins if duplicate data is present, ties are broken by rating (see "Source rating" below).

For each scraper, we're now asking that you provide:

* `sources` - Array of objects with `{ name, url, description }` detailing the true source of the data, with `name` as a human readible name and `url` as the URL for source's landing page. This is required when using CSV and JSON sources that aren't webpages a human can read.

If this is a curated source (data aggregated by a single person or organization from multiple organizations):

* `curators` - Array of objects with `{ name, url, twitter, github, email }` indicating the name of the curator and their information so that they can get credit on the page.

If you're interested in maintaining the scraper and would like your name to appear on the [sources page](https://coronadatascraper.com/#sources), add the following:

* `maintainers` - Array of objects with `{ name, url, twitter, github, email }`. If you provide a `url`, that will be used on the site, otherwise it will go down the list and link to whatever information you've provided. Anything beyond a name is totally optional, but `github` is encouraged.

Everything defined on the source object starting with `_` will be available to the scraper via the `this`.

## Source rating

Sources are rated based on:

1. **How hard is it to read?** - `csv` and `json` give best scores, with `table` right behind it, with `list` and `paragraph` worse. `pdf` gets no points, and `image` gets negative points.
2. **Timeseries?** - Sources score points if they provide a timeseries.
3. **Completeness** - Sources get points for having `cases`, `tested`, `deaths`, `hospitalized`, `discharged`, `recovered`, `country`, `state`, `county`, and `city`.
4. **SSL** - Sources get points for serving over ssl
5. **Headless?** - Sources get docked points if they require a headless scraper

## Scraping

Scrapers are `async` functions associated with the `scraper` attribute on the source object. You may implement one or multiple scrapers if the
source changes its formatting (see [What to do if a scraper breaks?](#what-to-do-if-a-scraper-breaks)).

Your scraper should return an object, an array of objects, or `null` in case the source does not have any data.

The object may contain the following attributes:

* `country` - [ISO 3166-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) [required]
* `state` - The state, province, or region (not required if defined on scraper object)
* `county` - The county or parish (not required if defined on scraper object)
* `city` - The city name (not required if defined on scraper object)
* `cases` - Total number of cases
* `deaths` - Total number of deaths
* `hospitalized` - Total number of hospitalized
* `discharged` - Total number of discharged
* `recovered` - Total number recovered
* `tested` - Total number tested
* `feature` - GeoJSON feature associated with the location (See [Features and population data](#features-and-population-data))
* `featureId` - Additional identifiers to aid with feature matching (See [Features and population data](#features-and-population-data))
* `population` - The estimated population of the location (See [Features and population data](#features-and-population-data))
* `coordinates` - Array of coordinates as `[longitude, latitude]` (See [Features and population data](#features-and-population-data))

Returning an array of objects is useful for aggregate sources, sources that provide information for more than one geographical area. For example, [Canada](https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html?topic=tilelink)
provides information for all provinces of the country. If the scraper returns an array, each object in the array will have the attributes specified
in the source object appended, meaning you only need to specify the fields that change per location (`county`, `cases`, `deaths` for example).

`null` should be returned in case no data is available. This could be the case if the source has not provided an update for today, or we are fetching historical
information for which we have no cached data.

### Fetching different types of documents

At the moment, we provide support for scraping `HTML`, `CSV`, `TSV`, `JSON`, and `PDF` documents. Fetching is accomplished using the functions provided by
[`lib/fetch.js`](../../coronadatascraper/site/lib/fetch.js). This module should be imported in your source file and provides 5 functions:

- `await fetch.page(url)` retrieves an HTML document and loads it using [Cheerio](https://cheerio.js.org/). Make sure to refer to their documentation.
- `await fetch.csv(url)` and `await fetch.tsv(url)` retrieves a CSV/TSV document and loads it as a JSON array. Each row of the CSV is an item in the array,
and the CSV columns are the attributes of each item in the returned array.
- `await fetch.json(url)` retrieves a JSON document
- `await fetch.pdf(url)` retrieves a PDF document. Returns an array of text object with their associated x/y positions. We provide a number of helper functions
to process documents in [`lib/pdf.js`](../../src/../coronadatascraper/src/events/crawler/lib/pdf.js).
- `await fetch.headless(url)` In certain instances, the page fetched requires a full browser to be able to fetch the data (eg. we need Javascript enabled).
Uses a headless browser and returns the loaded HTML document using [Cheerio](https://cheerio.js.org/).

### Library functions

See [library functions](../../coronadatascraper/site/lib) for API of the available library/utility functions you can use in your scraper.

Key highlights:

- [`lib/geography.js`](../src/events/crawler/lib/geography.js) provides helper functions related location geography. Make sure to look at `addEmptyRegions` and `addCounty` as
they are often used.
- [`lib/parse.js`](../src/events/crawler/lib/parse.js) provides helper functions to parse numbers, floats, and strings.
- [`lib/transform.js`](../src/events/crawler/lib/transform.js) provides helper functions to perform common data manipulation operations. Make sure to look at
`sumData` as it is often used.
- [`lib/datetime.js`](../src/events/crawler/lib/datetime.js) provides helper functions to perform date related manipulations.

Of course, if something is missing, `yarn add` it as a dependency and `import` it!

### Making sure your scraper doesn't break

It's a tough challenge to write scrapers that will work when websites are inevitably updated. Here are some tips:

* If your source is an HTML table, use the HtmlTableValidator if possible
* If data for a field is not present (eg. no recovered information), **do not put 0 for that field**. Make sure to leave the field undefined so the scraper knows there is no information for that particular field.
* Write your scraper so it handles aggregate data with a single scraper entry (i.e. find a table, process the table)
* Try not to hardcode county or city names, instead let the data on the page populate that
* Try to make your scraper less brittle by avoiding using generated class names (i.e. CSS modules)
* When targeting elements, don't assume order will be the same (i.e. if there are multiple `.count` elements, don't assume the second one is deaths, verify it by parsing the label)

### Using the HtmlTableValidator

If your source is an HTML page, you can use a simple HTML table
validator to verify that the structure of your table is what you
expect, prior to scraping.

At the top of your scraper, import the class:

```
import HtmlTableValidator from '../../../lib/html-table-validator.js';
```

And use it like this during your scrape (assuming the table is named `$table`):

```
const rules = {
  headings: {
    0: /country/i,
    1: /number of cases/i,
    2: /deaths/i
  },
  data: [
    { column: 0, row: 'ANY', rule: /Adams/ },
    { column: 1, row: 'ALL', rule: /^[0-9]+$/ },
    { column: 2, row: 'ALL', rule: /(^[0-9]+|)$/ }
  ]
};
const opts = { includeErrCount: 5, logToConsole: true };
HtmlTableValidor.throwIfErrors(rules, $table, opts);
```

When this runs, if any rules are not satisfied, it will throw
an Error with a few sample failures (5, in this case):

Sample:

Logged to console:

```
3 validation errors.
[
  'heading 0 "County" does not match /country/i',
  'heading 1 "Cases" does not match /number of cases/i',
  'no row in column 0 matches /Adams/'
]

Error thrown:

```
Error processing <scraper name>:  Error: 3 validation errors..  Sample: heading 0 "County" does not match /country/i;heading 1 ... [etc.]
```

### Sample scraper

Here's the scraper for Indiana that gets data from a CSV:

```javascript
  {
    url: 'https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv',
    country: 'USA',
    state: 'IN',
    scraper: async function() {
      let data = await fetch.csv(this.url);

      let counties = [];
      for (let county of data) {
        counties.push({
          county: geography.addCounty(parse.string(county.COUNTYNAME)), // Add " County" to the end
          cases: parse.number(county.Total_Positive),
          deaths: parse.number(county.Total_Deaths),
          tested: parse.number(county.Total_Tested)
        });
      }

      // Also return data for IN itself
      counties.push(transform.sumData(counties));

      return counties;
    }
  },
```

You can see that `country` and `state` are already defined on the object, and all the scraper has to do is pull down the CSV and return an array of objects.

Here's the scraper for Oregon that pulls data from a HTML table:
```javascript
  {
    state: 'OR',
    country: 'USA',
    url: 'https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx',
    scraper: async function() {
      let counties = [];
      let $ = await fetch.page(this.url);

      let $table = $('table[summary="Cases by County in Oregon for COVID-19"]');

      let $trs = $table.find('tbody > tr:not(:first-child):not(:last-child)');

      $trs.each((index, tr) => {
        let $tr = $(tr);
        counties.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text()),
          cases: parse.number($tr.find('td:nth-child(2)').text())
        });
      });

      // Also return data for OR itself
      counties.push(transform.sumData(counties));

      return counties;
    }
  },
```

It first finds the table with the `[summary]` attribute, then iterates over each of the rows extracting county names and cases (skipping the first and last rows), and finally, returns an array of objects.

### Generating data retroactively

If your datasource has timeseries data, you can include its data in retroactive regeneration (prior to this project's inception) by checking for `process.env['SCRAPE_DATE']`. This date is your target date; get it in whatever format you need, and only return results from your timeseries dataset from that date. See the JHU scraper for an example.

### What to do if a scraper breaks?

Scrapers need to be able to operate correctly on old data, so updates to scrapers must be backwards compatible. If you know the date the site broke, you can have two implementations (or more) of a scraper in the same function, based on date:

```javascript
{
  state: 'LA',
  country: 'USA',
  aggregate: 'county',
  _countyMap: { 'La Salle Parish': 'LaSalle Parish' },
  scraper: {
    // 0 matches all dates before the next definition
    '0': async function() {
      this.url = 'http://ldh.la.gov/Coronavirus/';
      this.type = 'table';
      const counties = [];
      const $ = await fetch.page(this.url);
      const $table = $('p:contains("Louisiana Cases")').nextAll('table');
      ...
      return counties;
    },
    // 2020-3-14 matches all dates starting with 2020-3-14
    '2020-3-14': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/cba425c2e5b8421c88827dc0ec8c663b_0.csv';
      this.type = 'csv';
      const counties = [];
      const data = await fetch.csv(this.url);
      ...
      return counties;
    },
    // 2020-3-17 matches all dates after 2020-3-14 and starting with 2020-3-17
    '2020-3-17': async function() {
      this.url = 'https://opendata.arcgis.com/datasets/79e1165ecb95496589d39faa25a83ad4_0.csv';
      this.type = 'csv';
      const counties = [];
      const data = await fetch.csv(this.url);
      ...
      return counties;
    }
  }
}
```

As you can see, you can change `this.url` and `this.type` within your function (but be sure to set it every time so it works with timeseries generation).

Another example is when HTML on the page changes, you can simply change the selectors or Cheerio function calls:

```javascript
let $table;
if (datetime.scrapeDateIsBefore('2020-3-16')) {
  $table = $('table[summary="Texas COVID-19 Cases"]');
}
else {
  $table = $('table[summary="COVID-19 Cases in Texas Counties"]');
}
```

You can also use `datetime.scrapeDateIsAfter()` for more complex customization.

## Features and population data

We strive to provide a GeoJSON feature and population number for every location in our dataset. When adding
a source for a country, we may already have this information and can populate it automatically. For smaller regional entities,
this information may not be available and has to be added manually.

### Features

Features can be specified in three ways: through the `country`, `state` and `county` field, by matching the `longitude` and `latitude` to a particular feature,
through the `featureId` field, or through the `feature` field.

While the first two methods works most of the time, sometimes you will have to rely on `featureId` to help the crawler make the correct guess.
`featureId` is an object that specifies one or more of the attributes below:

- `name`
- `adm1_code`
- `iso_a2`
- `iso_3166_2`
- `code_hasc`
- `postal`

We compare the value you specify with the data stored in [world-states-provinces.json](./../coronavirus-data-sources/geojson/world-states-provinces.json)
(Careful, big file!). If we find a match across all the fields you specify, we select the feature. There are way way more attributes to use in that
file, so make sure to give it a quick glance.

In case we do not have any geographical information for the location you are trying to scrape, you can provide a GeoJSON feature directly in the `feature` attribute
you can return with the scraper.

If we have a feature for the location, we will calculate a `longitude` and `latitude`. You may also specify a custom longitude and latitude by specifying a value in
the `coordinates` attribute.

### Population

Population can usually be guessed automatically, but if that is not the case, you can provide a population number by returning a value for the `population` field
in the returned object of the scraper.

## Testing sources

You should test your source first by running `yarn test`. This will perform some basic tests to make sure nothing crashes and the source object is in the correct form.


### Test coverage

To add test coverage for a scraper, you only need to provide test assets; no new tests need to be added.

* Add a tests folder to the scraper folder, e.g. `scrapers/FRA/tests` or `scrapers/USA/AK/tests`

* Add a sample response from the target URL. The filename should be the URL, without the
`http(s)://` prefix, and with all non-alphanumeric characters replaced with an underscore `_`. The
file extension should match the format of the contents (`html`, `csv`, `json`, etc). Example:

   * URL: https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv

   * File name: raw_githubusercontent_com_opencovid19_fr_data_master_dist_chiffres_cles.csv

* Add a file named `expected.json` containing the array of values that the scraper is expected to
return. (Leave out any geojson `features` properties.)

For sources that have a time series, the `expected.json` file represents the latest result in the
sample response provided. You can additionally test the return value for a specific date by adding
a file with the name `expected.YYYY-MM-DD.json`; for example, `expected.2020-03-16.json`.


    📁 USA
      📁 AK
        📄 index.js     # scraper
        📁 tests
          📄 dhss_alaska_gov_dph_Epi_id_Pages_COVID_19_monitoring.html     # sample response
          📄 expected.json     # expected result
    ...
    📁 FRA
      📄 index.js     # scraper
      📁 tests
        📄 raw_githubusercontent_com_covid19_fr_data_chiffres_cles.csv     # sample response
        📄 expected.json     # expected result for most recent date in sample
        📄 expected.2020-03-16.json # expected result for March 16, 2020

### Manual testing

You should run your source with the crawler by running `yarn start -l "<name of your source>"`. Your source name will be as follow "<county name>, <state name>, <country name>" (eg., the scraper for Montana, USA is "MN, USA").

After the crawler has finished running, look at how many counties, states, and countries were
scraped. Also look for missing location or population information. Finally, look at the output located in the `dist` directory. `data.json` contains all the information
the crawler could get from your source. `report.json` provides a report on crawling process. `ratings.json` provides a rating for your source.
