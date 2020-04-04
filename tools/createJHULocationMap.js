const imports = require('esm')(module);

const fetch = imports('../src/shared/lib/fetch/index.js');
const fs = imports('../src/shared/lib/fs.js');

const url =
  'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv';

async function generateUIDMap() {
  const jhuData = await fetch.csv(url, false);

  const uidMap = {};

  for (const data of jhuData) {
    uidMap[data.UID] = {
      iso2: data.iso2,
      iso3: data.iso3,
      code3: data.code3,
      FIPS: data.FIPS,
      Admin2: data.Admin2
    };
  }

  fs.writeJSON('./src/shared/vendor/jhu-id-map.json', uidMap);
}

generateUIDMap();
