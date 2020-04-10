# Cache migration helper

Summary:

* A set of code changes (manual) to the code to prepare for collecting
  cache calls

* A script to automatically change all scraper files to use the
  updated API

* A set of scripts to run full scrapes for all dates stored in
  coronadatascraper-cache, collecting and analyzing the cache calls
  and errors.

Output:

A json-like list of cache calls, in `cacheCalls.txt`:

```
{
  "scraperPath": "/Users/jeff/Documents/Projects/coronadatascraper/src/shared/scrapers/JHU.js",
  "date": false,
  "requestedUrl": "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/fe22260f2e5e1f7326f3164d27ccaef48c183cb5/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv",
  "cacheFilePath": "cache/fa0f1bd8fcd92941f184259c971debeb.csv",
  "cacheFileExists": false,
  "type": "csv"
},
... etc
```

A script that compares `cacheCalls.txt` records to the actual cache
files, giving an overall effectiveness for this exercise:

```
ruby compare-log-to-actual-files.rb

... [SNIP: lots of output listing files in the cache that weren't used] ...
coronadatascraper-cache/2020-4-5/fd720fcec1f166b73b7aa9e30a1f125b.html
coronadatascraper-cache/2020-4-5/febbf477f754042ac1e4ce6deb1f0831.html

  total files in cache:                           3007
  can be migrated:                                2100
  still unknown, unused during cache-only scrape:  907
```

(As at this time, my cache only contained files up to March 31)


# Running everything automatically

* In the project root, checkout branch `prep-cache-call-logging`.
* Merge or rebase off of latest `upstream/master`
* Ensure the `coronadatascraper-cache/` is clean and latest!

Then run:

`./scripts/cacheMigration/master.sh <your-migration-branch-name>`


# Running things more "manually"

Instead of running `master.sh`, you can do the below.

## 0. Prep migration branch

* Check out a new branch off of upstream/master
* merge in branch `jzohrab/prep-cache-call-logging`

### Contents of `jzohrab/prep-cache-call-logging`

* Adds `--onlyUseCache` flag, which sets a process.env var which get and fetch respect.
* Changes the fetch and get methods: all calls must pass `this` (eg, `$ = fetch.page(this, url ...)`)
* All cache calls get appended to `cacheCalls.txt` in this directory (ignored by git)
* Prepares some scrapers for the cache-migration-hacks.rb script
* Adds some scripts for data analysis


## 1. Run script to change scrapers

```
cd scripts/cacheMigration
ruby cache-migration-hacks.rb save  # see the file for example args
```

This adds `_filepath` to scrapers, changes all calls to fetch to
include `this`, and a few small misc changes.


After running this, can run yarn and check `cacheCalls.txt`

```
$ yarn fetchOnly --date '2020-03-28' --onlyUseCache --location 'PA, USA'
```

#### Debugging and manual hacks.

You may need to check and manually change some scrapers:

```
yarn fetchOnly --date '2020-3-24' --onlyUseCache --location '<some location code>'
# note errors, fix ...
```

## 2. Run scrapes, record calls, and analyze data

Summary (see notes for each script):

```
cd project/root/dir

./scripts/cacheMigration/run-dates.sh

ruby scripts/cacheMigration/compare-log-to-actual-files.rb

./scripts/cacheMigration/check_log.sh
```

* `run-dates.sh`: loops through all the folders in the cache, and runs
  `yarn start` for each date.  Writes `./log.txt` and
  `./scripts/cacheMigration/cacheCalls.txt`
* `compare-log-to-actual-files.rb`: compares the files used (recorded
  in `cacheCalls.txt`) to actual cache files, see what's included, and
  what's missing.
* `check_log.sh`: checks the logs for anything bad which indicates
  that the the code changes in `cache-migration-hacks.rb` weren't
  quite good enough!  If this returns anything bad, do some debugging
  and manual hacking.

