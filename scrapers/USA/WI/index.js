import * as fetch from '../../../lib/fetch.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';

/*
  Each scraper must return the following object or an array of the following objects:

  {
    city: String†,
    county: String†,   // County or region name, complete with "County" or "Parish" at the end
    country: String†,  // ISO 3166-1 alpha-3 country code
    cases: Integer,    // Confirmed cases (including presumptive)
    deaths: Integer,
    recovered: Integer,
    tested: Integer
  }

  † Optional, not required if provided in the main scraper definition
*/

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'WI',
  country: 'USA',
  aggregate: 'county',
  scraper: {
    '0': async function() {
      this.url = 'https://www.dhs.wisconsin.gov/outbreaks/index.htm';
      this.type = 'table';
      const regions = [];
      const $ = await fetch.page(this.url);
      const $table = $('caption:contains("Number of Positive Results by County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      regions.push(transform.sumData(regions));
      return regions;
    },
    '2020-3-16': async function() {
      this.url = 'https://www.dhs.wisconsin.gov/outbreaks/index.htm';
      this.type = 'table';
      const regions = [];
      const $ = await fetch.page(this.url);
      const $table = $('h5:contains("Number of Positive Results by County")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: transform.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      {
        const stateData = { tested: 0 };
        const $table = $('h5:contains("Wisconsin COVID-19 Test Results")')
          .nextAll('table')
          .first();
        const $trs = $table.find('tbody > tr');
        $trs.each((index, tr) => {
          const $tr = $(tr);
          const label = parse.string($tr.find('td:first-child').text());
          const value = parse.number($tr.find('td:last-child').text());
          if (label === 'Positive') {
            stateData.cases = value;
            stateData.tested += value;
          } else if (label === 'Negative') {
            stateData.tested += value;
          }
        });
        regions.push(stateData);
      }
      return regions;
    },
    '2020-3-18': async function() {
      this.url =
        'https://services1.arcgis.com/ISZ89Z51ft1G16OK/arcgis/rest/services/COVID19_WI/FeatureServer/0//query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=NAME%2CPOSITIVE%2CDATE%2CCMNTY_SPRD&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=NAME+ASC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';
      this.type = 'json';
      const regions = [];
      const data = await fetch.json(this.url);
      for (const field of data.features) {
        regions.push({
          county: transform.addCounty(field.attributes.NAME),
          cases: parse.number(field.attributes.POSITIVE)
        });
      }
      const stateURL =
        'https://services1.arcgis.com/ISZ89Z51ft1G16OK/arcgis/rest/services/COVID19_WI/FeatureServer/2/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=NEGATIVE%2CPOSITIVE%2CDATE&returnHiddenFields=false&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';
      const stateData = await fetch.json(stateURL);
      regions.push({
        tested: stateData.features[0].attributes.NEGATIVE + stateData.features[0].attributes.POSITIVE,
        cases: stateData.features[0].attributes.POSITIVE
      });
      return regions;
    }
  }
};

export default scraper;
