import assert from 'assert';
import * as fetch from '../../lib/fetch/index.js';
import maintainers from '../../lib/maintainers.js';
import log from '../../lib/log.js';
import provinceToIso2 from './province-to-iso2.json';
import * as transform from '../../lib/transform.js';

// const patientStatus = {
//   FALLECIDO: 'deaths',
//   ACTIVO: 'active',
//   RECUPERADO: 'recovered',
//   UNKNOWN: 'unknown'
// };

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

function getCountsFromLocation(location) {
  const counts = {};
  if (location === patientLocation.UNKNOWN) {
    log.warn(`Patient location is "${patientLocation.UNKNOWN}", it will not be counted.`);
    return counts;
  }
  counts.cases = 1;
  counts[location] = 1;
  return counts;
}

function addEmptyStates(data) {
  // Instead of this, we could actually design the system to do this:
  // 1. Obtain a list of administrative levels entities at whatever granularity the disease data exist
  // 2. Create a template data result with all nulls
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
      data.push({ state: provinceToIso2[province] });
    }
  }
}

function getProvinceIso2(provinceName) {
  // source: https://en.wikipedia.org/wiki/ISO_3166-2:PA
  // This is where we check for potentially different spellings.
  provinceName = transform.toTitleCase(provinceName);
  if (provinceName === 'Bocas Del Toro') return provinceToIso2['Bocas del Toro'];
  if (provinceName === 'Kuna Yala' || provinceName === 'Comarca Guna Yala') return provinceToIso2['Guna Yala'];
  if (provinceName === 'Darien') return provinceToIso2['Darién'];
  if (provinceName === 'Embera Wounaan') return provinceToIso2['Emberá'];
  if (provinceName === 'Ngäbe-Buglé' || provinceName === 'Comarca Ngäbe Buglé') return provinceToIso2['Ngöbe-Buglé'];
  const iso2 = provinceToIso2[provinceName];
  if (!iso2) {
    throw new Error(`Cannot obtain ISO2 code for "${provinceName}".`);
  }
  return iso2;
}

function areKeyValuesEqual(object1, object2, keyList) {
  for (const key of keyList) {
    if (object1[key] !== object2[key]) return false;
  }
  return true;
}

// I don't understand transform.sumData, and I don't like that it chooses which fields to add.
function aggregateItems(dataArray, keysToKnockOut) {
  // We have data with e.g. state, county, city, burrough.
  // We want to "knock out" burrough to have sums at city-level granularity.
  // Likewise, we want to knock out city AND burrough to get county-level.
  // First, copy the objects with those keys knocked out.
  const reducedData = [];
  for (const entry of dataArray) {
    const newEntry = { ...entry };
    for (const key of Object.keys(entry)) {
      if (keysToKnockOut.includes(key)) delete newEntry[key];
    }
    reducedData.push(newEntry);
  }

  // Now find all non-numeric keys that these items have in common.
  const nonNumeric = [];
  for (const entry of reducedData) {
    for (const key of Object.keys(entry)) {
      if (typeof entry[key] === 'number') continue;
      if (nonNumeric.includes(key)) continue;
      nonNumeric.push(key);
    }
  }

  // Now add up all numeric values for objects that have all non-numeric keys equal
  const aggregationLists = [];
  for (const entry of reducedData) {
    if (aggregationLists.length === 0) {
      aggregationLists.push([entry]);
      continue;
    }
    let entryFits = false;
    for (const list of aggregationLists) {
      const [itemTemplate] = list; // first item in the list is our reference.
      if (areKeyValuesEqual(itemTemplate, entry, nonNumeric)) {
        entryFits = true;
        list.push(entry);
        break; // next entry.
      }
    }
    if (!entryFits) aggregationLists.push([entry]);
  }
  // Now add up everything in each list.
  const result = [];
  for (const list of aggregationLists) {
    if (list.length === 0) continue;
    const [templateItem] = list;
    const aggregatedItem = { ...templateItem };
    for (let i = 1; i < list.length; i++) {
      const item = list[i];
      for (const key of Object.keys(item)) {
        const value = item[key];
        if (typeof value !== 'number') continue;
        if (aggregatedItem[key]) {
          aggregatedItem[key] += item[key];
        } else {
          aggregatedItem[key] = item[key];
        }
      }
    }
    result.push(aggregatedItem);
  }

  return result;
}

function sum(dataArray, key) {
  let result = 0;
  for (const entry of dataArray) if (entry[key]) result += entry[key];
  return result;
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
  aggregate: 'county',
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
    // log(`Panama has ${caseList.length} cumulative cases.`);
    this.url = this._caseListUrl; // required for source rating.
    for (const patient of caseList) {
      const location = patientLocation[patient.UBICACIÓN_DEL_PACIENTE];
      if (location === patientLocation.UNKNOWN) {
        log.warn(`Patient location "${location}" is unparsable; this patient will not be counted.`);
        continue;
      }
      const counts = getCountsFromLocation(location);
      const state = getProvinceIso2(patient.PROVINCIA);
      // To do this by county, we need:
      // 1. Population of counties.
      //    e.g. https://github.com/EricLuceroGonzalez/Panama-Political-Division
      //    or https://www.citypopulation.de/en/panama/admin/ (neither of which is specifically vetted).
      // 2. Polygons for the map, e.g. https://stridata-si.opendata.arcgis.com/datasets/distritos-census-2010-feature-layer
      // 3. List of counties (would come from either of the ones above) since we need to specifically add
      //    those that don't have cases.
      const county = transform.toTitleCase(patient.DSITRITO);
      // We will most likely not support corregimientos.
      // Regardless of that, our current system will not interpret data correctly if I include it.
      // It will think there are duplicate entries at county level.
      const corregimiento = transform.toTitleCase(patient.CORREGIMIENTO);

      let found = false;
      for (const item of data) {
        if (item.state !== state) continue;
        if (item.county !== county) continue;
        if (item.corregimiento !== corregimiento) continue;
        found = true;
        for (const key of Object.keys(counts)) {
          if (Object.keys(item).includes(key)) {
            item[key] += counts[key];
          } else {
            item[key] = counts[key];
          }
        }
      }
      if (!found) {
        data.push({
          state,
          county,
          corregimiento,
          ...counts
        });
      }
    }

    // tests, can be moved, changed to asserts, etc.
    let data2 = [...data];
    log(
      `With corregimientos: ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data.length} items.`
    );

    data2 = aggregateItems(data, ['corregimiento']); // our system won't accept this.
    log(
      `With counties      : ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data2.length} items.`
    );
    // See https://es.wikipedia.org/wiki/Organizaci%C3%B3n_territorial_de_Panam%C3%A1
    assert(data2.length <= 81); // Panama has 81 districts (counties)

    data2 = aggregateItems(data2, ['county']); // our system won't accept this.
    log(
      `With states        : ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data2.length} items.`
    );
    data2 = aggregateItems(data, ['county', 'corregimiento']); // our system won't accept this.
    log(
      `With states        : ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data2.length} items.`
    );
    assert(data2.length <= 10 + 3); // Panama has 10 provinces and 3 provincial comarcas
    data2 = aggregateItems(data2, ['state']); // our system won't accept this.
    log(
      `With nothing       : ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data2.length} items.`
    );
    data2 = aggregateItems(data2, ['state', 'county', 'corregimiento']); // our system won't accept this.
    log(
      `With nothing       : ${sum(data2, 'cases')} cases, ${sum(data2, 'deaths')} deaths, ${sum(
        data2,
        'recovered'
      )} recovered, with ${data2.length} items.`
    );
    // end tests.

    const countyLevel = aggregateItems(data, ['corregimiento']);
    const provinceLevel = aggregateItems(countyLevel, ['county']);
    const nationLevel = aggregateItems(provinceLevel, ['state']);
    assert(nationLevel.length === 1);
    addEmptyStates(provinceLevel);
    assert(provinceLevel.length === 13); // Panama has 10 provinces and 3 provincial comarcas
    // return [...provinceLevel, ...countyLevel]; // Uncomment this to reproduce #798
    return [...nationLevel, ...provinceLevel];
  }
};

export default scraper;
