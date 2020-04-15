import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';
import * as transform from '../../../lib/transform.js';
import * as geography from '../../../lib/geography/index.js';
import datetime from '../../../lib/datetime/index.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-WI',
  country: 'iso1:US',
  aggregate: 'county',
  sources: [
    {
      url: 'https://www.dhs.wisconsin.gov',
      name: 'Wisconsin Department of Health Services'
    }
  ],
  _counties: [
    'Adams County',
    'Ashland County',
    'Barron County',
    'Bayfield County',
    'Brown County',
    'Buffalo County',
    'Burnett County',
    'Calumet County',
    'Chippewa County',
    'Clark County',
    'Columbia County',
    'Crawford County',
    'Dane County',
    'Dodge County',
    'Door County',
    'Douglas County',
    'Dunn County',
    'Eau Claire County',
    'Florence County',
    'Fond du Lac County',
    'Forest County',
    'Grant County',
    'Green County',
    'Green Lake County',
    'Iowa County',
    'Iron County',
    'Jackson County',
    'Jefferson County',
    'Juneau County',
    'Kenosha County',
    'Kewaunee County',
    'La Crosse County',
    'Lafayette County',
    'Langlade County',
    'Lincoln County',
    'Manitowoc County',
    'Marathon County',
    'Marinette County',
    'Marquette County',
    'Menominee County',
    'Milwaukee County',
    'Monroe County',
    'Oconto County',
    'Oneida County',
    'Outagamie County',
    'Ozaukee County',
    'Pepin County',
    'Pierce County',
    'Polk County',
    'Portage County',
    'Price County',
    'Racine County',
    'Richland County',
    'Rock County',
    'Rusk County',
    'Sauk County',
    'Sawyer County',
    'Shawano County',
    'Sheboygan County',
    'St. Croix County',
    'Taylor County',
    'Trempealeau County',
    'Vernon County',
    'Vilas County',
    'Walworth County',
    'Washburn County',
    'Washington County',
    'Waukesha County',
    'Waupaca County',
    'Waushara County',
    'Winnebago County',
    'Wood County'
  ],
  scraper: {
    '0': async function() {
      this.url = 'https://www.dhs.wisconsin.gov/outbreaks/index.htm';
      this.type = 'table';
      let regions = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('caption:contains("Number of Positive Results by County")').closest('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:last-child').text())
        });
      });
      regions = geography.addEmptyRegions(regions, this._counties, 'county');
      regions.push(transform.sumData(regions));
      return regions;
    },
    '2020-03-16': async function() {
      this.url = 'https://www.dhs.wisconsin.gov/outbreaks/index.htm';
      this.type = 'table';
      let regions = [];
      const $ = await fetch.page(this, this.url, 'default');
      const $table = $('h5:contains("Number of Positive Results by County")')
        .nextAll('table')
        .first();
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
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
        regions = geography.addEmptyRegions(regions, this._counties, 'county');
        regions.push(stateData);
      }
      return regions;
    },
    '2020-03-18': async function() {
      this.url =
        'https://services1.arcgis.com/ISZ89Z51ft1G16OK/arcgis/rest/services/COVID19_WI/FeatureServer/0//query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=NAME%2CPOSITIVE%2CDATE%2CCMNTY_SPRD&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=NAME+ASC&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';
      this.type = 'json';
      let regions = [];
      const data = await fetch.json(this, this.url, 'cases');
      for (const field of data.features) {
        regions.push({
          county: geography.addCounty(field.attributes.NAME),
          cases: parse.number(field.attributes.POSITIVE)
        });
      }
      const stateURL =
        'https://services1.arcgis.com/ISZ89Z51ft1G16OK/arcgis/rest/services/COVID19_WI/FeatureServer/2/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=NEGATIVE%2CPOSITIVE%2CDATE&returnHiddenFields=false&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=';
      const stateData = await fetch.json(this, stateURL, 'tested');
      regions.push({
        tested: stateData.features[0].attributes.NEGATIVE + stateData.features[0].attributes.POSITIVE,
        cases: stateData.features[0].attributes.POSITIVE
      });
      regions = geography.addEmptyRegions(regions, this._counties, 'county');
      return regions;
    },
    '2020-03-26': async function() {
      if (datetime.scrapeDateIsBefore('2020-03-27')) {
        this.url = 'https://www.dhs.wisconsin.gov/outbreaks/index.htm';
      } else {
        this.url = 'https://www.dhs.wisconsin.gov/covid-19/data.htm';
      }

      this.type = 'table';
      let regions = [];
      const $ = await fetch.headless(this, this.url, 'default');
      const $table = $('#covid-county-table').find('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          deaths: parse.number($tr.find('td:nth-child(3)').text())
        });
      });

      regions = geography.addEmptyRegions(regions, this._counties, 'county');
      regions.push(transform.sumData(regions));

      return regions;
    },
    '2020-04-01': async function() {
      if (datetime.scrapeDateIsBefore('2020-04-03')) {
        this.url = 'https://www.dhs.wisconsin.gov/covid-19/data.htm';
      } else {
        this.url = 'https://www.dhs.wisconsin.gov/covid-19/county.htm';
      }

      this.type = 'table';
      let regions = [];
      const $ = await fetch.headless(this, this.url, 'default');
      const $table = $('#covid-county-table').find('table');
      const $trs = $table.find('tbody > tr:not(:last-child)');
      $trs.each((index, tr) => {
        const $tr = $(tr);
        regions.push({
          county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
          cases: parse.number($tr.find('td:nth-child(2)').text()),
          tested: parse.number($tr.find('td:nth-child(2)').text()) + parse.number($tr.find('td:nth-child(3)').text()),
          deaths: parse.number($tr.find('td:nth-child(4)').text())
        });
      });

      regions = geography.addEmptyRegions(regions, this._counties, 'county');
      regions.push(transform.sumData(regions));

      return regions;
    }
  }
};

export default scraper;
