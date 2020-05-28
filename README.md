# THIS PROJECT IS BEING REPLACED BY `Li`

**This project is being replaced by [Li](https://github.com/covidatlas/li), the next-generation serverless crawler for COVID-19 data.**

The reasons for the switchover are documented in [Issue 782](https://github.com/covidatlas/coronadatascraper/issues/782).

We are not _actively_ accepting PRs for this repository, but are still using this repo to track issues.

> Scraper code written for this project is not compatible with Li, see that project for examples.  We have some helpers to assist in migrating code, see [this document](https://docs.google.com/document/d/1ITPU0hESswmiWw88Pl1eI26oIQtMJw1YUeD8mWEPIeE/edit#).

Thanks very much!


---

# coronadatascraper
> A crawler that scrapes COVID-19 Coronavirus data from government and curated data sources.

This project exists to scrape, de-duplicate, and cross-check county-level data on the COVID-19 coronavirus pandemic.

Every piece of data includes GeoJSON and population data, cites the source from which the data was obtained, and includes a rating of the source's technical quality (completeness, machine readability, best practices -- not accuracy).

## Where's the data?

https://coronadatascraper.com/

## How often is it updated?

We upload fresh data every day at around 9PM PST.

## How do I use this data?

Read the [Data Fields](./docs/data_fields.md) documentation for details on exactly what each field in the dataset means.

## How can I run the crawler locally?

Check out our [Getting Started](./docs/getting_started.md) guide to help get our project running on your local machine.

## Contributing

**NOTE: This project is being replaced by [Li](https://github.com/covidatlas/li), the next-generation serverless crawler for COVID-19 data.**

You can contribute to this project in two big ways:

### Contribute to the project core

Check the Issues for any task we need to get done. If you are new to open-source, look for the label [`Good first issue`](https://github.com/lazd/coronadatascraper/labels/good%20first%20issue)

### Contribute a source

Contributions for any place in the world are welcome. See the [community-curated list of verified data sources](https://docs.google.com/spreadsheets/d/1T2cSvWvUvurnOuNFj2AMPGLpuR2yVs3-jdd_urfWU4c/edit#gid=0) to find a new datasource to add, and be sure to update the "Scraped?" column when you do.

To help you contribute a new source, please read the [Sources and Scrapers](./docs/sources.md) guide before you start!

Send a pull request with your scraper, and be sure to run the scraper first with the instructions specified in the guide to make sure the data is valid.

## License

This project is licensed under the permissive [BSD 2-clause license](LICENSE).

The data produced by this project is public domain.

This project uses data from [ISO-3166 Country and Dependent Territories Lists with UN Regional Codes
](https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes) under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

## Attribution

Please cite this project if you use it in your visualization or reporting.

> Data obtained from Corona Data Scraper
