# coronadatascraper
> A scraper that pulls coronavirus case data from verified sources.

## Running the scraper

Before following these instructions, install [yarn](https://classic.yarnpkg.com/en/docs/install/).

```
yarn install
yarn start
```

## Contributing

Contributions for any place in the world are welcome. See the [community-curated list of verified data sources](https://docs.google.com/spreadsheets/d/1T2cSvWvUvurnOuNFj2AMPGLpuR2yVs3-jdd_urfWU4c/edit#gid=0) to find a new datasource to add, and be sure to update the "Scraped?" column when you do.

Write clean and clear code, and please ensure to follow the criteria below for sources. Send a pull request with your scraper, and be sure to run the scraper first with the instructions above to make sure the data is valid.

It's a tough challenge to write scrapers that will work when websites are inevitably updated. Here are some tips:

* Write your scraper so it handles aggregate data with a single scraper entry (i.e. find a table, process the table)
* Try not to hardcode county or city names, instead let the data on the page populate that
* Try to make your scraper less brittle by generated class names (i.e. CSS modules)
* When targeting elements, don't assume order will be the same (i.e. if there are multiple `.count` elements, don't assume the second one is deaths, verify it by parsing the label)

## Criteria for sources

Any source added to the scraper must meet the following criteria:

### 1. Sources must be government or health organizations

No news articles, no aggregated sources.

### 2. Sources must provide the number of cases at a bare minimum

Additional data is welcome.

### 3. Presumptive cases are not considered confirmed

As of now, presumptive cases should not be considered.

## License

This project is licensed under the permissive [BSD 2-clause license](LICENSE).

The data produced by this project is public domain.

## Attribution

Please cite this project if you use it in your visualization or reporting.
