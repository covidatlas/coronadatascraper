import * as fetch from '../../lib/fetch.js';
import * as parse from '../../lib/parse.js';

const scraper = {
  country: 'DEU',
  timeseries: false,
  url: 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&outSR=4326&f=json',
  type: 'json',
  curators: [
    {
      name: 'Robert Koch Institute',
      email: ''
    }
  ],
  sources: [
    {
      url: 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&outSR=4326&f=json',
      name: 'Robert Koch Institute',
      description: 'Official numbers published by Robert Koch Institute in Germany'
    }
  ],
  async scraper() {
    const res = await fetch.json(this.url);

    // Data structure
    // {'features':[{'attributes':{'cases': INT, 'deaths': INT, 'BL': STRING, 'county': STRING, 'EWZ': INT}},..., {'attributes':{'cases': INT, 'deaths': INT, 'BL': STRING, 'county': STRING, 'EWZ': INT}}]}

    const { features } = res; // a list of dictionaries, one for each county
    console.error('return is %s', features);

    const foo = features.map(row => {
      return {
        deaths: parse.number(row.attributes.deaths),
        cases: parse.number(row.attributes.cases),
        state: parse.string(row.attributes.BL),
        county: parse.string(row.attributes.county),
        population: parse.number(row.attributes.EWZ)
      };
    });
    console.error('return is %s', foo[0].state);
    return foo;
  }
};

export default scraper;
