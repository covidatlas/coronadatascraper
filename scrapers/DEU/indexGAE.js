import * as fetch from '../../lib/fetch.js';
import * as datetime from '../../lib/datetime.js';
import * as parse from '../../lib/parse.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'DEU',
  url: 'https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv',
  type: 'json',
  timeseries: true,
  curators: [
    {
      name: 'Dr. Jan-Philip Gehrcke',
      email: 'jgehrcke@googlemail.com'
    }
  ],
  sources: [
    {
      name: 'Robert Koch-Institut',
      description: 'Fresh data obtained from  health ministry by ZEIT ONLINE',
      url: 'https://github.com/jgehrcke/covid-19-germany-gae'
    }
  ],
  async scraper() {
    const aBL = ['BB', 'BE', 'BW', 'BY', 'HB', 'HE', 'HH', 'MV', 'NI', 'NW', 'RP', 'SH', 'SL', 'SN', 'ST', 'TH'];
    const data = await fetch.csv(this.url, false);

    // Rely on dataset to be sorted by time, in direction past -> future.
    const [lastRow] = data.slice(-1);

    const scrapeDate = process.env.SCRAPE_DATE ? datetime.getYYYYMMDD(process.env.SCRAPE_DATE) : datetime.getYYYYMMDD();

    const lastDateInTimeseries = new Date(lastRow.time_iso8601);
    let latestDate = datetime.getYYYYMMDD(lastDateInTimeseries);

    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error('🚨 Timeseries for DEU-GAE has not been updated, latest date is using %s instead of %s', datetime.getYYYYMMDD(latestDate), datetime.getYYYYMMDD(scrapeDate));
      latestDate = datetime.getYYYYMMDD(latestDate, '-');
    } else {
      latestDate = datetime.getYYYYMMDD(scrapeDate, '-');
    }

    return data
      .filter(row => {
        return datetime.getYYYYMMDD(new Date(row.time_iso8601)) === latestDate;
      })
      .map(row => {
        const res = [];
        aBL.forEach(bl =>
          res.push({
            state: parse.string(`DE-${bl}`),
            cases: parseInt(row[`DE-${bl}_cases`], 10),
            deaths: parseInt(row[`DE-${bl}_deaths`], 10)
          })
        );
        return res;
      })[0];
  }
};

export default scraper;
