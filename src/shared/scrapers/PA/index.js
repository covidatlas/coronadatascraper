// import datetime from '../../lib/datetime/index.js';
import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';
// import * as parse from '../../lib/parse.js';
import log from '../../lib/log.js';
import provinceToIso2 from './province-to-iso2.json';

function titleCase(string) {
  let result = '';
  for (let i = 0; i < string.length; i++) {
    if (i === 0 || string.charAt(i - 1) === ' ') {
      result += string.charAt(i).toUpperCase();
    } else {
      result += string.charAt(i).toLowerCase();
    }
  }
  result = result.replace('Del', 'del'); // ugh.
  return result;
}

const patientStatus = {
  FALLECIDO: 'deaths',
  ACTIVO: 'active',
  RECUPERADO: 'recovered',
  UNKNOWN: 'unknown'
};

//   'UBICACIÓN_DEL_PACIENTE': 'FALLECIDO', - location of patient
//          Can be FALLECIDO (deceased), AISLAMIENTO DOMICILIARIO (Home quarantine),
//          HOSPITALIZADO (hospitalized), RECUPERADO (recovered), UCI (intensive care)
const patientLocation = {
  FALLECIDO: 'deaths',
  'AISLAMIENTO DOMICILIARIO': 'quarantine',
  HOSPITALIZADO: 'hospitalized',
  UCI: 'icu',
  RECUPERADO: 'recovered',
  UNKNOWN: 'unknown'
};

// Maybe this serves as a prototype for the schema we need to develop.
const templateDataEntry = {
  // country: null, // taken from scraper object.
  state: null,
  // fail src/events/crawler/scrape-data/run-scraper.js:16:13
  // county: null,
  // city: null,
  cases: 0,
  deaths: 0,
  quarantine: 0,
  hospitalized: 0,
  icu: 0,
  recovered: 0
};

function getCountsFromLocation(location) {
  const o = JSON.parse(JSON.stringify(templateDataEntry)); // "deep copy". Fuck.
  if (location === patientLocation.UNKNOWN) {
    log.warn(`Patient location is "UNKNOWN", it will not be counted.`);
    return o;
  }
  o.cases = 1;
  o[location] = 1;
  return o;
}

function updateData(data, o) {
  let entryToUpdate = null;
  for (const entry of data) {
    if (entry.state !== o.state) {
      continue;
    }
    if (entry.county !== o.county) {
      continue;
    }
    // Here we would continue to check for city and corregimiento, if we got to that point.
    entryToUpdate = entry;
    break;
  }

  const newEntry = getCountsFromLocation(o.patientLocation);
  if (entryToUpdate === null) {
    newEntry.state = o.state;
    newEntry.county = o.county;
    data.push(newEntry);
  } else {
    entryToUpdate.cases += newEntry.cases;
    entryToUpdate.deaths += newEntry.deaths;
    entryToUpdate.quarantine += newEntry.quarantine;
    entryToUpdate.hospitalized += newEntry.hospitalized;
    entryToUpdate.icu += newEntry.icu;
    entryToUpdate.recovered += newEntry.recovered;
  }
}

function addEmptyStates(data) {
  // Instead of this, we could actually design the system to do this:
  // 1. Obtain a list of administrative levels entities at whatever granularity the disease data exist
  // 2. Create a template data result with all zeros
  // 3. Traverse through data and populate.
  for (const province in provinceToIso2) {
    let found = false;
    for (const entry of data) {
      if (entry.state === provinceToIso2[province]) {
        found = true;
        break;
      }
    }
    if (!found) {
      log(`Adding ${province} with zero cases.`);
      const o = JSON.parse(JSON.stringify(templateDataEntry));
      o.state = provinceToIso2[province];
      data.push(o);
    }
  }
}

function getProvinceIso2(provinceName) {
  // source: https://en.wikipedia.org/wiki/ISO_3166-2:PA
  // This is where we check for potentially different spellings.
  provinceName = titleCase(provinceName);
  if (provinceName === 'Kuna Yala' || provinceName === 'Comarca Guna Yala') return provinceToIso2['Guna Yala'];
  if (provinceName === 'Darien') return provinceToIso2['Darién'];
  if (provinceName === 'Embera Wounaan') return provinceToIso2['Emberá'];
  if (provinceName === 'Ngäbe-Buglé' || provinceName === 'Comarca Ngäbe Buglé') return provinceToIso2['Ngöbe-Buglé'];
  const iso2 = provinceToIso2[provinceName];
  if (!iso2) {
    log.warn(`Cannot obtain ISO2 code for "${provinceName}".`);
  }
  return iso2;
}

const scraper = {
  priority: 1,
  country: 'iso1:PA',
  sources: [
    {
      url: 'http://minsa.gob.pa/coronavirus-covid19',
      name: 'Ministerio de Salud de la República de Panamá',
      note: 'Distritos were mapped into counties in this data set; data exists at corregimiento level.'
    }
  ],
  // URLs were obtained by snooping. See
  // https://docs.google.com/document/d/1__rE8LbiB0pK4qqG3vIbjbgnT8SrTx86A_KI7Xakgjk/edit#

  // List of "corregimientos", which we will consider counties.
  _corregimientosListUrl: 'https://opendata.arcgis.com/datasets/61980f00977b4dcdad46eda02268ab48_0.csv',

  // List of tests per day
  _testsUrl: 'https://opendata.arcgis.com/datasets/f966620f339241e9833f111969da8e83_0.csv',

  // List of cases, this has most of the data that we want.
  _caseListUrl: 'https://opendata.arcgis.com/datasets/898c63fc068745d98fea01b9bf4f05ea_0.csv',

  // Time series at national level.
  _timeSeriesUrl: 'https://opendata.arcgis.com/datasets/6b7f17658fd845058f7516d6fc591530_0.csv',

  // Road blocks (disease related?)
  // https://opendata.arcgis.com/datasets/91325f0051a84c72a704725a962a8bc7_0.csv

  type: 'csv',
  aggregate: 'state',
  maintainers: [maintainers.shaperilio],

  async scraper() {
    // We probably don't need to cache this every day; fetch could be commented out.
    /* const corregimientos = */ await fetch.csv(this._corregimientosListUrl);
    // Note: The first field names have funny characters in the name, and lint rules will prevent
    // me from including them in the comments (and they may be invisible). Use e.g.
    //     log(corregimientos[0]);
    // to see them.
    //
    // Refer to the administrative divisions of Panama
    // (https://es.wikipedia.org/wiki/Organizaci%C3%B3n_territorial_de_Panam%C3%A1)
    //
    // Panama has 10 proinces (states), 81 "distritos" (like a county), 5 comarcas (reservations at county level),
    // and 679 "corregimientos" (like a borrough or neighborhood; smaller than a city)
    //
    // This is an array of objects:
    // {
    //   'X': '-82.85131119185094', - longitude (presumably of centroid?)
    //   Y: '9.419490463149362', - latitude
    //   OBJECTID: '1', //NA
    //   CORR_NOMB: 'LAS DELICIAS', - name
    //   SHAPE_Leng: '153268.01828',
    //   CORR_FEAC: '2009-11-30T00:00:00.000Z', - ?
    //   ID1: '37',
    //   CORR_LEY: 'LEY 18 DEL 26 DE FEBRERO DEL 2008', - perhaps when it was declared a corregimiento?
    //   ORDEN_CORR: '13',
    //   PROV_ID: '01', - probably province ID
    //   DIST_ID: '02', - probably district ID
    //   CORR_ID: '10', - probably corregimiento ID
    //   CODIGO: '010210', - probably a ZIP code?
    //   CAMPO: '2017',
    //   ID2: '1',
    //   TIPO: ' ',
    //   Cantidad: '', - "Quantity" (note these appear to be coronavirus-related fields, but they're not populated.
    //   Hospitalizado: '', - "Hospitalized"
    //   Aislamiento_domiciliario: '', - "Home quarantine"
    //   Fallecido: '',  - "Deceased"
    //   UCI: '', - "Intensive Care"
    //   Recuperado: '', - "Recovered
    //   ORIG_FID: '1'
    // }

    // Cache this.
    /* const tests = */ await fetch.csv(this._testsUrl);
    // Simple test counts (country level):
    // [
    //   {
    //     Positivas: '1801', - "Positive" (infected)
    //     Negativas: '7455', - "Negative"
    //     FID: '1',
    //     TOTALES: '9256', - "Total" (number tested)
    //     FID2: '1'
    //   }
    // ]

    // Cache this.
    // TODO: How do we deal with multiple source for the same country?
    // i.e If I wanted to make a Panama nation-level timeseries scraper, how would I do it
    // and still keep this one which has greater granularity?
    /* const timeseries = */ await fetch.csv(this._timeSeriesUrl);
    // Array of:
    // {
    //   'Fecha': '2020-03-10T00:00:00.000Z', - date
    //   TOTAL: '1', - total
    //   Nuevos: '1', - new [cases?]
    //   HOSPITALIZADO: '0', - hospitalized
    //   AISLAMIENTO_DOMICILIARIO: '4', - home quarantine
    //   FALLECIDO_: '0', - deceased
    //   UCI: '0', - intensive care
    //   RECUPERADO: '0', - recovered
    //   Check: '',
    //   FID: '1'
    // }

    // This is the one we actually get the data from.
    const caseList = await fetch.csv(this._caseListUrl);
    // Array of:
    // {
    //   'numero_CASO': '201', - case number
    //   EDAD: '63', - age
    //   RANGO: '61-80', - [age] range
    //   SEXO: 'MASCULINO', - gender
    //   FECHA_de_CONFIRMACION: '2020-03-21T00:00:00.000Z', - date of confirmation (diagnosis)
    //   PROVINCIA: 'PANAMÁ', - province
    //   DSITRITO: 'SAN MIGUELITO', - district (misspelled; akin to a county)
    //   CORREGIMIENTO: 'JOSE DOMINGO ESPINAR', - this is akin to "borrough" or "neighborhood"
    //   ESTADO_DEL_PACIENTE: 'FALLECIDO', - satus of patient
    //          Can be FALLECIDO (deceased), ACTIVO (active), RECUPERADO (recovered)
    //   FECHA_ACTUALIZACION: '', - update date; not sure if it's ever populated.
    //   'UBICACIÓN_DEL_PACIENTE': 'FALLECIDO', - location of patient
    //          Can be FALLECIDO (deceased), AISLAMIENTO DOMICILIARIO (Home quarantine),
    //          HOSPITALIZADO (hospitalized), RECUPERADO (recovered), UCI (intensive care)
    //   column11: '',
    //   Edad_inicial: '',
    //   Rango_edades: '',
    //   FID: '1',
    //   FID2: '1'
    // }

    const data = [];
    log(`Panama has ${caseList.length} cumulative cases.`);
    this.url = this._caseListUrl; // required for source rating.
    for (const c of caseList) {
      const status = patientStatus[c.ESTADO_DEL_PACIENTE];
      const location = patientLocation[c.UBICACIÓN_DEL_PACIENTE];
      const o = {
        state: getProvinceIso2(c.PROVINCIA),
        // To do this by county, we need:
        // 1. Population of counties.
        //    e.g. https://github.com/EricLuceroGonzalez/Panama-Political-Division
        //    or https://www.citypopulation.de/en/panama/admin/ (neither of which is specifically vetted).
        // 2. Polygons for the map, e.g. https://stridata-si.opendata.arcgis.com/datasets/distritos-census-2010-feature-layer
        // 3. List of counties (would come from either of the ones above) since we need to specifically add
        //    those that don't have cases.
        // county: titleCase(c.DSITRITO),
        //
        // city: null, // We need to make a list of corregimientos per city; all I can find is scattered Wiki articles.
        // corregimiento: titleCase(c.CORREGIMIENTO),

        age: c.EDAD,
        sex: c.SEXO,
        lastUpdateDate: c.FECHA_de_CONFIRMACION,
        patientStatus: status || patientStatus.UNKNOWN,
        patientLocation: location || patientLocation.UNKNOWN
      };
      updateData(data, o);
    }

    addEmptyStates(data);
    // log(data);
    log(`Data contains ${data.length} items.`);

    return data;
  }
};

export default scraper;
