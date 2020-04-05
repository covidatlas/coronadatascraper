# Getting started

_Last updated: 2020-04-04_

## Tools

You'll need the following:

* [node](https://nodejs.org/en/download/)
* [yarn](https://classic.yarnpkg.com/en/docs/install/)

Install them using your favorite method (`homebrew`, etc).

## Repo

First, [fork the repository](https://github.com/lazd/coronadatascraper/fork) so you're ready to contribute back.

### 1. Clone, init submodules, and add upstream

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

### 2. Install dependencies

```
yarn install
```

If you get an error message saying you have an incompatible version of
`node`, you may need to change version.  You can use `n` to change
node versions: [install](https://www.npmjs.com/package/n) it and run
`n lts`.

### 3. Run the scraper

```
yarn start
```

### 4. Pull from upstream often

This gets you the latest scrapers, as well as the cache so we're not hammering servers.

```
git pull upstream master --recurse-submodules
```

Note: If you are encountering issues updating a submodule such as `Could not access submodule`, you may need to update your fork using:
```
git submodule update --init --recursive
```

## Run scrapers

To run the scrapers for today:

```
yarn start
```

### Run only one scraper

To scrape just one location, use `--location`/`-l`

```
yarn start --location "Ventura County, CA, USA"
```

Alternatively, you can pass a filename (without extension or directory name) to `--location`:

```
yarn start --location "JHU"
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

To generate it for a date range, use `-d`/`-e`:

```
yarn timeseries -d 2020-3-15 -e 2020-3-18
```

This can be combined with `-l` to test a single scraper:

```
yarn timeseries -d 2020-3-15 -e 2020-3-18 -l 'WA, USA'
```

## Tests

We use [Tape](https://github.com/substack/tape).

    # Run all tests
    yarn test

    # Run a single test file
    node path/to/file.js


## Building the website

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
