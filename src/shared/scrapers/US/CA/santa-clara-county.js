import * as fetch from '../../../lib/fetch/index.js';
import datetime from '../../../lib/datetime/index.js';
import maintainers from '../../../lib/maintainers.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  county: 'Santa Clara County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [maintainers['1ec5']],
  type: 'json',
  timeseries: true,
  headless: false,
  sources: [
    {
      name: 'Santa Clara County Public Health',
      url: 'https://www.sccgov.org/sites/covid19/Pages/dashboard.aspx',
      description: 'Santa Clara County COVID-19 Cases Dashboard'
    }
  ],
  url: 'https://www.sccgov.org/sites/covid19/Pages/dashboard.aspx',
  _urls: {
    query: 'https://wabi-us-gov-virginia-api.analysis.usgovcloudapi.net/public/reports/querydata',
    postArgs: {
      newCases:
        '{"version":"1.0.0","queries":[{"Query":{"Commands":[{"SemanticQueryDataShapeCommand":{"Query":{"Version":2,"From":[{"Name":"c","Entity":"cases_date"}],"Select":[{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"Date"},"Name":"cases_date.Date"},{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"New_cases"}},"Function":0},"Name":"Sum(cases_date.New_cases)"}]},"Binding":{"Primary":{"Groupings":[{"Projections":[0,1]}]},"DataReduction":{"DataVolume":4,"Primary":{"Sample":{}}},"Version":1}}}]},"CacheKey":"{\\"Commands\\":[{\\"SemanticQueryDataShapeCommand\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"c\\",\\"Entity\\":\\"cases_date\\"}],\\"Select\\":[{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"Date\\"},\\"Name\\":\\"cases_date.Date\\"},{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"New_cases\\"}},\\"Function\\":0},\\"Name\\":\\"Sum(cases_date.New_cases)\\"}]},\\"Binding\\":{\\"Primary\\":{\\"Groupings\\":[{\\"Projections\\":[0,1]}]},\\"DataReduction\\":{\\"DataVolume\\":4,\\"Primary\\":{\\"Sample\\":{}}},\\"Version\\":1}}}]}","QueryId":"","ApplicationContext":{"DatasetId":"366bfc6b-cdb9-43a4-9208-89ffd773dfe7","Sources":[{"ReportId":"f863b97c-85d7-431e-a6bf-20549f18d10f"}]}}],"cancelQueries":[],"modelId":320392}',
      totalCases:
        '{"version":"1.0.0","queries":[{"Query":{"Commands":[{"SemanticQueryDataShapeCommand":{"Query":{"Version":2,"From":[{"Name":"c","Entity":"counts"}],"Select":[{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"Total"}},"Function":0},"Name":"Sum(counts.Total)"}],"Where":[{"Condition":{"In":{"Expressions":[{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"Category"}}],"Values":[[{"Literal":{"Value":"\'Cases\'"}}]]}}}]},"Binding":{"Primary":{"Groupings":[{"Projections":[0]}]},"DataReduction":{"DataVolume":3,"Primary":{"Top":{}}},"Version":1}}}]},"CacheKey":"{\\"Commands\\":[{\\"SemanticQueryDataShapeCommand\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"c\\",\\"Entity\\":\\"counts\\"}],\\"Select\\":[{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"Total\\"}},\\"Function\\":0},\\"Name\\":\\"Sum(counts.Total)\\"}],\\"Where\\":[{\\"Condition\\":{\\"In\\":{\\"Expressions\\":[{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"Category\\"}}],\\"Values\\":[[{\\"Literal\\":{\\"Value\\":\\"\'Cases\'\\"}}]]}}}]},\\"Binding\\":{\\"Primary\\":{\\"Groupings\\":[{\\"Projections\\":[0]}]},\\"DataReduction\\":{\\"DataVolume\\":3,\\"Primary\\":{\\"Top\\":{}}},\\"Version\\":1}}}]}","QueryId":"","ApplicationContext":{"DatasetId":"366bfc6b-cdb9-43a4-9208-89ffd773dfe7","Sources":[{"ReportId":"f863b97c-85d7-431e-a6bf-20549f18d10f"}]}}],"cancelQueries":[],"modelId":320392}',
      deaths:
        '{"version":"1.0.0","queries":[{"Query":{"Commands":[{"SemanticQueryDataShapeCommand":{"Query":{"Version":2,"From":[{"Name":"c","Entity":"counts"}],"Select":[{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"Total"}},"Function":0},"Name":"Sum(counts.Total)"}],"Where":[{"Condition":{"In":{"Expressions":[{"Column":{"Expression":{"SourceRef":{"Source":"c"}},"Property":"Category"}}],"Values":[[{"Literal":{"Value":"\'Deaths\'"}}]]}}}]},"Binding":{"Primary":{"Groupings":[{"Projections":[0]}]},"DataReduction":{"DataVolume":3,"Primary":{"Top":{}}},"Version":1}}}]},"CacheKey":"{\\"Commands\\":[{\\"SemanticQueryDataShapeCommand\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"c\\",\\"Entity\\":\\"counts\\"}],\\"Select\\":[{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"Total\\"}},\\"Function\\":0},\\"Name\\":\\"Sum(counts.Total)\\"}],\\"Where\\":[{\\"Condition\\":{\\"In\\":{\\"Expressions\\":[{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"c\\"}},\\"Property\\":\\"Category\\"}}],\\"Values\\":[[{\\"Literal\\":{\\"Value\\":\\"\'Deaths\'\\"}}]]}}}]},\\"Binding\\":{\\"Primary\\":{\\"Groupings\\":[{\\"Projections\\":[0]}]},\\"DataReduction\\":{\\"DataVolume\\":3,\\"Primary\\":{\\"Top\\":{}}},\\"Version\\":1}}}]}","QueryId":"","ApplicationContext":{"DatasetId":"366bfc6b-cdb9-43a4-9208-89ffd773dfe7","Sources":[{"ReportId":"f863b97c-85d7-431e-a6bf-20549f18d10f"}]}}],"cancelQueries":[],"modelId":320392}',
      hospitalized:
        '{"version":"1.0.0","queries":[{"Query":{"Commands":[{"SemanticQueryDataShapeCommand":{"Query":{"Version":2,"From":[{"Name":"h","Entity":"hosp_CHA"},{"Name":"subquery","Expression":{"Subquery":{"Query":{"Version":2,"From":[{"Name":"h1","Entity":"hosp_CHA"}],"Select":[{"Column":{"Expression":{"SourceRef":{"Source":"h1"}},"Property":"Date"},"Name":"field"}],"OrderBy":[{"Direction":2,"Expression":{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"h1"}},"Property":"Date"}},"Function":4}}}],"Top":1}}},"Type":2}],"Select":[{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"h"}},"Property":"COVID_pts"}},"Function":0},"Name":"Sum(hosp_CHA.COVID_pts)"}],"Where":[{"Condition":{"In":{"Expressions":[{"Column":{"Expression":{"SourceRef":{"Source":"h"}},"Property":"Date"}}],"Table":{"SourceRef":{"Source":"subquery"}}}}}]},"Binding":{"Primary":{"Groupings":[{"Projections":[0]}]},"DataReduction":{"DataVolume":3,"Primary":{"Top":{}}},"Version":1}}}]},"CacheKey":"{\\"Commands\\":[{\\"SemanticQueryDataShapeCommand\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"h\\",\\"Entity\\":\\"hosp_CHA\\"},{\\"Name\\":\\"subquery\\",\\"Expression\\":{\\"Subquery\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"h1\\",\\"Entity\\":\\"hosp_CHA\\"}],\\"Select\\":[{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"h1\\"}},\\"Property\\":\\"Date\\"},\\"Name\\":\\"field\\"}],\\"OrderBy\\":[{\\"Direction\\":2,\\"Expression\\":{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"h1\\"}},\\"Property\\":\\"Date\\"}},\\"Function\\":4}}}],\\"Top\\":1}}},\\"Type\\":2}],\\"Select\\":[{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"h\\"}},\\"Property\\":\\"COVID_pts\\"}},\\"Function\\":0},\\"Name\\":\\"Sum(hosp_CHA.COVID_pts)\\"}],\\"Where\\":[{\\"Condition\\":{\\"In\\":{\\"Expressions\\":[{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"h\\"}},\\"Property\\":\\"Date\\"}}],\\"Table\\":{\\"SourceRef\\":{\\"Source\\":\\"subquery\\"}}}}}]},\\"Binding\\":{\\"Primary\\":{\\"Groupings\\":[{\\"Projections\\":[0]}]},\\"DataReduction\\":{\\"DataVolume\\":3,\\"Primary\\":{\\"Top\\":{}}},\\"Version\\":1}}}]}","QueryId":"","ApplicationContext":{"DatasetId":"366bfc6b-cdb9-43a4-9208-89ffd773dfe7","Sources":[{"ReportId":"f863b97c-85d7-431e-a6bf-20549f18d10f"}]}}],"cancelQueries":[],"modelId":320392}',
      tested:
        '{"version":"1.0.0","queries":[{"Query":{"Commands":[{"SemanticQueryDataShapeCommand":{"Query":{"Version":2,"From":[{"Name":"r","Entity":"results_trend"}],"Select":[{"Aggregation":{"Expression":{"Column":{"Expression":{"SourceRef":{"Source":"r"}},"Property":"Total"}},"Function":0},"Name":"Sum(results_trend.Total)"}]},"Binding":{"Primary":{"Groupings":[{"Projections":[0]}]},"DataReduction":{"DataVolume":3,"Primary":{"Top":{}}},"Version":1}}}]},"CacheKey":"{\\"Commands\\":[{\\"SemanticQueryDataShapeCommand\\":{\\"Query\\":{\\"Version\\":2,\\"From\\":[{\\"Name\\":\\"r\\",\\"Entity\\":\\"results_trend\\"}],\\"Select\\":[{\\"Aggregation\\":{\\"Expression\\":{\\"Column\\":{\\"Expression\\":{\\"SourceRef\\":{\\"Source\\":\\"r\\"}},\\"Property\\":\\"Total\\"}},\\"Function\\":0},\\"Name\\":\\"Sum(results_trend.Total)\\"}]},\\"Binding\\":{\\"Primary\\":{\\"Groupings\\":[{\\"Projections\\":[0]}]},\\"DataReduction\\":{\\"DataVolume\\":3,\\"Primary\\":{\\"Top\\":{}}},\\"Version\\":1}}}]}","QueryId":"","ApplicationContext":{"DatasetId":"250f1530-87ce-4d2c-96a1-2e63c2d97e1d","Sources":[{"ReportId":"cd403370-bb46-4747-8099-650976e87cae"}]}}],"cancelQueries":[],"modelId":320468}'
    },
    report:
      'https://wabi-us-gov-virginia-api.analysis.usgovcloudapi.net/public/reports/e8619a1d-ea98-4d27-a860-157af0d4e93f/modelsAndExploration?preferReadOnlySession=true',
    testingReport:
      'https://wabi-us-gov-virginia-api.analysis.usgovcloudapi.net/public/reports/9ab407fc-7baa-4543-8f33-4a4cb33505c8/modelsAndExploration?preferReadOnlySession=true'
  },
  scraper: {
    '0': async function() {
      // Fetch the new cases by day from the dashboard.
      const casesByDayJSON = await fetch.json(this, `${this._urls.query}?newCases`, 'newCases', false, {
        method: 'post',
        args: this._urls.postArgs.newCases
      });
      const caseDays = casesByDayJSON.results
        .flatMap(r => r.result.data.dsr.DS)
        .flatMap(ds => ds.PH)
        .flatMap(ph => ph.DM0)
        .map(dm0 => ({
          date: datetime.getYYYYMMDD(new Date(dm0.C[0])),
          cases: dm0.R === 2 ? null : dm0.C[1]
        }));
      caseDays.reduce((acc, cur) => {
        cur.cases = cur.cases === null ? acc : cur.cases;
        return cur.cases;
      }, 0);
      caseDays.reduce((acc, cur) => {
        cur.cases += acc;
        return cur.cases;
      }, 0);

      // Fetch the dashboard's UI, which contains the last updated date and number of undated cases.
      let options = { headers: { 'X-PowerBI-ResourceKey': 'e8619a1d-ea98-4d27-a860-157af0d4e93f' } };
      const ui = await fetch.json(this, this._urls.report, 'ui', false, options);
      let updatedDate = ui.models.flatMap(m => m.lastRefreshTime)[0].match(/Date\((\d+)\)/);
      updatedDate = new Date(updatedDate && parseInt(updatedDate[1], 10));
      let undatedCases = ui.exploration.sections
        .flatMap(s => s.visualContainers)
        .flatMap(vc => vc.config)
        .map(c => c.match(/The graphs do not include (\d+) patients/))
        .filter(c => c)[0];
      undatedCases = undatedCases && undatedCases[1];

      // Fetch the current total number of cases, including undated cases.
      const totalCasesJSON = await fetch.json(this, `${this._urls.query}?totalCases`, 'totalCases', false, {
        method: 'post',
        args: this._urls.postArgs.totalCases
      });
      const totalCases = totalCasesJSON.results
        .flatMap(r => r.result.data.dsr.DS)
        .flatMap(ds => ds.PH)
        .flatMap(ph => ph.DM0)
        .flatMap(dm0 => dm0.M0)
        .filter(m0 => m0)[0];

      // Total case count for today is the total case count as of today minus the undated case count.
      caseDays.push({
        date: datetime.getYYYYMMDD(updatedDate),
        cases: totalCases - undatedCases
      });

      let scrapeDate = datetime.scrapeDate() || new Date();
      let scrapeDateString = datetime.getYYYYMMDD(new Date(scrapeDate));
      const lastDateInTimeseries = new Date(caseDays.slice(-1)[0].date);
      const firstDateInTimeseries = new Date(caseDays[0].date);

      if (datetime.scrapeDateIsAfter(lastDateInTimeseries)) {
        console.error(
          `  🚨 timeseries for Santa Clara County: SCRAPE_DATE ${datetime.getYYYYMMDD(
            scrapeDate
          )} is newer than last sample time ${datetime.getYYYYMMDD(lastDateInTimeseries)}. Using last sample anyway`
        );
        scrapeDate = lastDateInTimeseries;
        scrapeDateString = datetime.getYYYYMMDD(scrapeDate);
      }

      if (datetime.scrapeDateIsBefore(firstDateInTimeseries)) {
        throw new Error(`Timeseries starts later than SCRAPE_DATE ${datetime.getYYYYMMDD(scrapeDate)}`);
      }

      // Fetch the testing dashboard's UI, which contains the last updated date and number of undated cases.
      options = { headers: { 'X-PowerBI-ResourceKey': '9ab407fc-7baa-4543-8f33-4a4cb33505c8' } };
      const testUI = await fetch.json(this, this._urls.testingReport, 'testingUI', false, options);
      let testUpdatedDate = testUI.models.flatMap(m => m.lastRefreshTime)[0].match(/Date\((\d+)\)/);
      testUpdatedDate = new Date(testUpdatedDate && parseInt(testUpdatedDate[1], 10));

      const results = [caseDays.filter(d => d.date === scrapeDateString)[0]];
      let currentResult = {
        date: scrapeDateString
      };

      // Add cases and deaths.
      if (scrapeDateString === datetime.getYYYYMMDD(updatedDate)) {
        // Fetch the current death toll and isolate the number.
        const deathsJSON = await fetch.json(this, `${this._urls.query}?deaths`, 'deaths', false, {
          method: 'post',
          args: this._urls.postArgs.deaths
        });
        const deaths = deathsJSON.results
          .flatMap(r => r.result.data.dsr.DS)
          .flatMap(ds => ds.PH)
          .flatMap(ph => ph.DM0)
          .flatMap(dm0 => dm0.M0)
          .filter(m0 => m0)[0];

        // Fetch the current number of hospitalizations and isolate the number.
        const patientsJSON = await fetch.json(this, `${this._urls.query}?hospitalized`, 'hospitalized', false, {
          method: 'post',
          args: this._urls.postArgs.hospitalized
        });
        const hospitalized = patientsJSON.results
          .flatMap(r => r.result.data.dsr.DS)
          .flatMap(ds => ds.PH)
          .flatMap(ph => ph.DM0)
          .flatMap(dm0 => dm0.M0)
          .filter(m0 => m0)[0];

        currentResult = {
          ...currentResult,
          // An accurate time series requires ignoring undated cases.
          cases: totalCases - (process.env.npm_lifecycle_event === 'timeseries' ? undatedCases : 0),
          deaths,
          hospitalized
        };
      }

      // Add tested.
      if (scrapeDateString === datetime.getYYYYMMDD(testUpdatedDate)) {
        // Fetch the current number of tested patients and isolate the number.
        const testsJSON = await fetch.json(this, `${this._urls.query}?tested`, 'tested', false, {
          method: 'post',
          args: this._urls.postArgs.tested
        });
        const tested = testsJSON.results
          .flatMap(r => r.result.data.dsr.DS)
          .flatMap(ds => ds.PH)
          .flatMap(ph => ph.DM0)
          .flatMap(dm0 => dm0.M0)
          .filter(m0 => m0)[0];
        currentResult = {
          ...currentResult,
          tested
        };
      }

      results.push(currentResult);

      return results;
    }
  }
};

export default scraper;
