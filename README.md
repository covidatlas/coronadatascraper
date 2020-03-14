# coronadatascraper
> A scraper that pulls coronavirus case data from verified sources.

## Where's the data?

http://blog.lazd.net/coronadatascraper/

## Running the scraper

First, [fork the repository](https://github.com/lazd/coronadatascraper/fork) so you're ready to contribute back.

Before following these instructions, install [yarn](https://classic.yarnpkg.com/en/docs/install/).

#### 1. Clone, init submodules, and add upstream

Replace `yourusername` below with your Github username:

```
git clone --recursive git@github.com:yourusername/coronadatascraper.git
cd coronadatascraper
git remote add upstream git@github.com:lazd/coronadatascraper.git
```

If you've already cloned without `--recrusive`, run:

```
git submodule init
git submodule update
```

#### 2. Install dependencies

```
yarn install
```

#### 3. Run the scraper

```
yarn start
```

#### 4. Pull from upstream often

This gets you the latest scrapers, as well as the cache so we're not hammering servers.

```
git pull upstream master --recurse-submodules
```

### Re-generating old data

To re-generate old data from cache (or timeseries), run:

```
yarn start --date=2020-3-12
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

Your scraper should return a `data` object, or an array of objects, with some of the following information:

* `city` - The city name (not required if defined on scraper object)
* `county` - The county or parish (not required if defined on scraper object)
* `state` - The state, province, or region (not required if defined on scraper object)
* `country` - [ISO 316
6-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
* `cases` - Total number of cases
* `deaths` - Total number of deaths
* `recovered` - Total number recovered
* `tested` - Total number tested
* `population` - The estimated population of the location
* `coordinates` - Array of coordinates [longitude, latitude]

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
          county: parse.string(county.COUNTYNAME) + ' County',
          cases: parse.number(county.Total_Positive),
          deaths: parse.number(county.Total_Deaths),
          tested: parse.number(county.Total_Tested)
        });
      }

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
        let county = parse.string($tr.find('td:first-child').text()) + ' County';
        let cases = parse.number($tr.find('td:nth-child(2)').text());
        counties.push({
          county: county,
          cases: cases
        });
      });

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

### Criteria for sources

Any source added to the scraper must meet the following criteria:

#### 1. Sources must be government or health organizations

No news articles, no aggregated sources.

#### 2. Sources must provide the number of cases at a bare minimum

Additional data is welcome.

#### 3. Presumptive cases are considered confirmed

In keeping with other datasets, presumptive cases should be considered part of the case total.

## License

This project is licensed under the permissive [BSD 2-clause license](LICENSE).

The data produced by this project is public domain.

## Attribution

Please cite this project if you use it in your visualization or reporting.
