# coronadatascraper
> A scraper that pulls COVID-19 Coronavirus data scraped from government and curated data sources.

This project exists to scrape, de-duplicate, and cross-check county-level data on the COVID-19 coronavirus pandemic.

Every piece of data produced includes the URL where the data was sourced from as well as a rating of the source's technical quality (completeness, machine readability, best practices -- not accuracy).

## Where's the data?

https://coronadatascraper.com/

## Getting started

First, [fork the repository](https://github.com/lazd/coronadatascraper/fork) so you're ready to contribute back.

Before following these instructions, install [yarn](https://classic.yarnpkg.com/en/docs/install/).

##### 1. Clone, init submodules, and add upstream

Replace `yourusername` below with your Github username:

```
git clone --recursive git@github.com:yourusername/coronadatascraper.git
cd coronadatascraper
git remote add upstream git@github.com:lazd/coronadatascraper.git
```

If you've already cloned without `--recursive`, run:

```
git submodule init
git submodule update
```

##### 2. Install dependencies

```
yarn install
```

##### 3. Run the scraper

```
yarn start
```

##### 4. Pull from upstream often

This gets you the latest scrapers, as well as the cache so we're not hammering servers.

```
git pull upstream master --recurse-submodules
```

Note: If you are encountering issues updating a submodule such as `Could not access submodule`, you may need to update your fork using:
```
git submodule update --init --recursive
```

### Run scrapers

To run the scrapers for today:

```
yarn start
```

### Run only one scraper

To scrape just one location, use `--location`/`-l`

```
yarn start --location "Ventura County, CA, USA"
```

### Skipping a scraper

To skip a scraper, use `--skip`/`-s`

```
yarn start --skip "Ventura County, CA, USA"
```

### Re-generating old data

To re-generate old data from cache (or timeseries), use `--date`/`-d`:

```
yarn start -d 2020-3-12
```

To output files without the date suffix, use `--outputSuffix`/`-o`:

```
yarn start -d 2020-3-12 -o
```

### Generating timeseries data

To generate a timeseries for the entire history of the pandemic using cached data:

```
yarn timeseries
```

```
yarn timeseries
```

To generate it for a date range, use `-d`/`-e`:

```
yarn timeseries -d 2020-3-15 -e 2020-3-18
```

This can be combined with `-l` to test a single scraper:

```
yarn timeseries -d 2020-3-15 -e 2020-3-18 -l 'WA, USA'
```


### Building the website

To build the website and start a development server at http://localhost:3000/:

```
yarn dev
```


### Building the website for production

To build the latest data, a full timeseries, and the website:

```
yarn build
```

To build only the website for production:

```
yarn buildSite
```

## Contributing

Contributions for any place in the world are welcome. See the [community-curated list of verified data sources](https://docs.google.com/spreadsheets/d/1T2cSvWvUvurnOuNFj2AMPGLpuR2yVs3-jdd_urfWU4c/edit#gid=0) to find a new datasource to add, and be sure to update the "Scraped?" column when you do.

Write clean and clear code, and please ensure to follow the criteria below for sources. Send a pull request with your scraper, and be sure to run the scraper first with the instructions above to make sure the data is valid.

### Writing a scraper

Scrapers can pull JSON, CSV, or good ol' HTML down and are written in a sort of modular way, with a handful of helpers available to clean up the data. Scrapers can pull in data for anything -- cities, counties, states, countries, or collections thereof. See the existing scrapers for ideas on how to deal with different ways of data being presented.

Start by opening up `scrapers.js` and adding a new object at the top of the array.

Make sure you have the following properties:

* `url` - The source of the data
* `scraper` - An async function that scrapes data and returns objects, defined below

Add the following directly to the scraper object if the data you're pulling in is specific to a given location:

* `city` - The city name
* `county` - The county or parish
* `state` - The state, province, or region
* `country` - [ISO 3166-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
* `type` - on of `json`, `csv`, `table`, `list`, `paragraph`, `pdf`, `image`. assumes `list` if `undefined`.
* `timeseries` - `true` if this source provides timeseries data, `false` or `undefined` if it only provides the latest data
* `headless` - whether this source requires a headless browser to scrape
* `certValidation` - `false` to skip certificate validation when running this scraper (used to workaround certificate errors)
* `priority` - any number (negative or positive). `0` is default, higher priority wins if duplicate data is present, ties are broken by rating

For each scraper, we're now asking that you provide

* `sources` - Array of objects with `{ name, url, description }` detailing the true source of the data, with `name` as a human readible name and `url` as the URL for source's landing page. This is required when using CSV and JSON sources that aren't webpages a human can read.

If this is a curated source (data aggregated by a single person or organization from multiple organizations):

* `curators` - Array of objects with `{ name, url, twitter, github, email }` indicating the name of the curator and their information so that they can get credit on the page.

If you're interested in maintaining the scraper and would like your name to appear on the [sources page](https://coronadatascraper.com/#sources), add the following:

* `maintainers` - Array of objects with `{ name, url, twitter, github, email }`. If you provide a `url`, that will be used on the site, otherwise it will go down the list and link to whatever information you've provided. Anything beyond a name is totally optional, but `github` is encouraged.

Your scraper should return a `data` object, or an array of objects, with some of the following information:

* `city` - The city name (not required if defined on scraper object)
* `county` - The county or parish (not required if defined on scraper object)
* `state` - The state, province, or region (not required if defined on scraper object)
* `country` - [ISO 3166-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
* `cases` - Total number of cases
* `deaths` - Total number of deaths
* `recovered` - Total number recovered
* `tested` - Total number tested
* `population` - The estimated population of the location
* `coordinates` - Array of coordinates as `[longitude, latitude]`

Everything defined on the scraper object except the `scraper` function and properties that start with `_` will be added to the objects returned by your scraper.

#### Sample scraper

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

#### Library functions

See [library functions](lib/) for API of the available library/utility functions you can use in your scraper.

Of course, if something is missing, `yarn add` it as a dependency and `import` it!

#### Making sure your scraper doesn't break

It's a tough challenge to write scrapers that will work when websites are inevitably updated. Here are some tips:

* Write your scraper so it handles aggregate data with a single scraper entry (i.e. find a table, process the table)
* Try not to hardcode county or city names, instead let the data on the page populate that
* Try to make your scraper less brittle by generated class names (i.e. CSS modules)
* When targeting elements, don't assume order will be the same (i.e. if there are multiple `.count` elements, don't assume the second one is deaths, verify it by parsing the label)

#### Generating data retroactively

If your datasource has timeseries data, you can include its data in retroactive regeneration (prior to this project's inception) by checking for `process.env['SCRAPE_DATE']`. This date is your target date; get it in whatever format you need, and only return results from your timeseries dataset from that date. See the JHU scraper for an example.

#### What to do if a scraper breaks?

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

### Criteria for sources

Any source added to the scraper must meet the following criteria:

#### 1. Sources must be government or health organizations

No news articles, no aggregated sources.

#### 2. Sources must provide the number of cases at a bare minimum

Additional data is welcome.

#### 3. Presumptive cases are considered confirmed

In keeping with other datasets, presumptive cases should be considered part of the case total.

### Source rating

Sources are rated based on:

1. **How hard is it to read?** - `csv` and `json` give best scores, with `table` right behind it, with `list` and `paragraph` worse. `pdf` gets no points, and `image` gets negative points.
2. **Timeseries?** - Sources score points if they provide a timeseries.
3. **Completeness** - Sources get points for having `cases`, `tested`, `deaths`, `recovered`, `country`, `state`, `county`, and `city`.
4. **SSL** - Sources get points for serving over ssl
5. **Headless?** - Sources get docked points if they require a headless scraper

The maximium rating for a source is 1, the minimum is near 0. See [`lib/transform.calcuateRating`](blob/master/lib/transform.js) for the exact algorithm.

All data in the output includes the `url` and the `rating` of the source.

## License

This project is licensed under the permissive [BSD 2-clause license](LICENSE).

The data produced by this project is public domain.

## Attribution

Please cite this project if you use it in your visualization or reporting.
