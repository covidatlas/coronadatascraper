import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
import getIso2FromName from '../../utils/get-iso2-from-name.js';
import maintainers from '../../lib/maintainers.js';
import latinizationMap from './latinization-map.json';
import datetime from '../../lib/datetime/index.js';

const country = `iso1:CN`;

const casesKey = '累计确诊';
const deathsKey = '累计死亡';

const stateIsntTaiwan = ({ name }) => latinizationMap[name] !== 'Taiwan';

const scraper = {
  country,
  timeseries: true,
  maintainers: [maintainers.camjc],
  priority: 1,
  sources: [
    {
      description: 'China CDC',
      name: 'China CDC',
      url: 'http://2019ncov.chinacdc.cn/2019-nCoV/'
    }
  ],
  type: 'json',
  async scraper() {
    const date = datetime.getYYYYMMDD(process.env.SCRAPE_DATE).replace(/-/g, '');
    this.url = `http://49.4.25.117/JKZX/yq_${date}.json`;
    const $ = await fetch.json(this, this.url, 'default', false);
    assert($, 'No data fetched');
    assert($.features.length > 1, 'features are unreasonable');
    const attributes = $.features.map(({ properties }) => properties).filter(stateIsntTaiwan);

    assert(attributes.length > 1, 'data fetch failed, no attributes');

    const states = attributes.map(item => ({
      state: getIso2FromName({ country, name: latinizationMap[item.name] }),
      cases: item[casesKey],
      deaths: item[deathsKey]
    }));

    const summedData = transform.sumData(states);
    states.push(summedData);

    return states;
  }
};

export default scraper;
