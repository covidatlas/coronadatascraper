import needle from 'needle';
import csvParse from 'csv-parse';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';
import * as fetch from '../../../lib/fetch/index.js';
import * as parse from '../../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  state: 'iso2:US-DC',
  country: 'iso1:US',
  county: 'District of Columbia',
  maintainers: [maintainers.aed3],
  timeseries: true,
  sources: [
    {
      name: 'DC Public Health Laboratory'
    }
  ],
  url: 'https://coronavirus.dc.gov/page/coronavirus-data',
  type: 'csv',
  scraper: {
    '0': async function() {
      const httpResponse = await needle(
        'get',
        'https://microstrategy.dc.gov/MicroStrategy/servlet/mstrWeb?evt=3010&src=mstrWeb.3010&loginReq=true&Server=-pWHsIgZI0ELP5C86KOL7JxDg9USFIPR4u6L-ardtrb2AQCUO&ServerAlias=ODC3-MSTRPRDPBLC-IS03.DC.GOV&Project=-KsxelRdCMvENhmUiJoweVcMUphk%3D&Port=-5sIT6ZMkteVaNueM'
      );

      const getOptions = {
        method: 'get',
        cookies: httpResponse.cookies
      };

      const formUrl =
        'https://microstrategy.dc.gov/MicroStrategy/servlet/mstrWeb?evt=3067&src=mstrWeb.3067&reportID=DA2251A711EA6FB482660080EFA55B20&reportViewMode=1';
      const form = await fetch.page(formUrl, false, getOptions);

      const rb = form('form input[name="rb"]').val();

      const rawUrl = `https://microstrategy.dc.gov/MicroStrategy/export/Health_Statistics.csv?evt=3012&src=mstrWeb.3012&exportSection=1&exportFormatGrids=csvIServer&exportPlaintextDelimiter=1&exportMetricValuesAsText=0&exportHeadersAsText=0&exportFilterDetails=0&exportOverlapGridTitles=3&SaveReportProperties=*-1.*-1.0.0.0&rb=${rb}`;
      const data = await fetch.raw(rawUrl, false, getOptions);

      const json = await new Promise((resolve, reject) => {
        csvParse(data.slice(data.indexOf('"')).replace(/\0|\*/g, ''), (err, output) => {
          if (err) {
            reject(err);
          } else {
            resolve(output);
          }
        });
      });

      const scrapeDate = datetime.scrapeDate() || datetime.today.at('America/New_York');
      const dataData = datetime.getMDYYYY(scrapeDate);
      let result = {};

      json[0].forEach((valType, i) => {
        if (valType === 'KPI Value' && json[1][i] === dataData) {
          result = {
            tested: parse.number(json[2][i]),
            cases: parse.number(json[3][i]),
            recovered: parse.number(json[4][i]),
            deaths: parse.number(json[5][i])
          };
        }
      });

      return result;
    }
  }
};

export default scraper;
