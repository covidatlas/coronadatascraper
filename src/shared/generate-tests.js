/* eslint-disable no-use-before-define */
import fs from 'fs';
import path from 'path';
import loadSources from '../events/crawler/get-sources/load-sources.js';
import { fetch } from './lib/fetch/index.js';
import { writeJSON } from './lib/fs.js';
import { getName } from './lib/geography/index.js';
import join from './lib/join.js';
import runScraper from './lib/run-scraper.js';
import sanitize from './lib/sanitize-url.js';

const runScrapers = async args => {
  console.log('runScrapers', args);
  const { options } = args;
  const { date, location } = options;
  const sources = args.sources.filter(s => s.scraper);
  const matchLocation = source => path.basename(source._path, '.js') === location || getName(source) === location;
  const sourcesToScrape = location !== undefined ? sources.filter(matchLocation) : sources;
  const urls = endpoints[location];
  for (const source of sourcesToScrape) {
    const datedTestDir = join(source._path, '..', 'tests', date);
    try {
      const data = await runScraper(source);
      if (data) {
        console.log(`✅ Ran scraper ${getName(source)} for date ${date}`);

        // Write expected.json file with scraper results
        const expectedDataPath = join(datedTestDir, 'expected.json');
        await writeJSON(expectedDataPath, data);

        // Add url responses
        if (!fs.existsSync(datedTestDir)) fs.mkdirSync(datedTestDir, { recursive: true });
        for (const url of urls) {
          const type = source.type || path.extname(url) || 'txt';
          const response = await fetch(url, type);
          if (response) {
            const assetPath = join(datedTestDir, sanitize(url));
            fs.writeFileSync(assetPath, response);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
  return sources;
};

export default async options => {
  const { date } = options;
  if (date === undefined) throw new Error('Please provide a date for generating tests.');
  process.env.SCRAPE_DATE = date;
  loadSources({ options }).then(runScrapers);
};

const endpoints = {
  JHU: [
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
    'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv'
  ],
  AUS: [
    'https://www.health.gov.au/news/health-alerts/novel-coronavirus-2019-ncov-health-alert/coronavirus-covid-19-current-situation-and-case-numbers'
  ],
  BRA: ['http://plataforma.saude.gov.br/novocoronavirus/resources/scripts/database.js?v=2020-03-29'],
  CAN: ['https://health-infobase.canada.ca/src/data/summary_current.csv'],
  CHE: [
    'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_cases_switzerland.csv',
    'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/covid19_fatalities_switzerland.csv',
    'https://raw.githubusercontent.com/daenuprobst/covid19-cases-switzerland/master/demographics.csv'
  ],
  'Zurich, CHE': [
    'https://raw.githubusercontent.com/openZH/covid_19/master/fallzahlen_kanton_total_csv/COVID19_Fallzahlen_Kanton_ZH_total.csv'
  ],
  ESP: [
    'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_casos.csv',
    'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_altas.csv',
    'https://raw.githubusercontent.com/datadista/datasets/master/COVID%2019/ccaa_covid19_fallecidos.csv'
  ],
  FRA: ['https://raw.githubusercontent.com/opencovid19-fr/data/master/dist/chiffres-cles.csv'],
  IND: ['https://www.mohfw.gov.in/'],
  ITA: ['https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv'],
  RUS: ['https://yandex.ru/maps/api/covid?csrfToken=b931079f1c8b52c6557da639f8fdadbc73bdcac2:1585475147'],
  USA: ['https://covidtracking.com/api/states'],
  'Australian Capital Territory, AUS': [
    'https://www.health.act.gov.au/about-our-health-system/novel-coronavirus-covid-19'
  ],
  'New South Wales, AUS': [
    'https://www.health.nsw.gov.au/_layouts/feed.aspx?xsl=1&web=/news&page=4ac47e14-04a9-4016-b501-65a23280e841&wp=baabf81e-a904-44f1-8d59-5f6d56519965&pageurl=/news/Pages/rss-nsw-health.aspx'
  ],
  'Northern Territory, AUS': ['https://coronavirus.nt.gov.au/'],
  'Queensland, AUS': [
    'https://www.health.qld.gov.au/news-events/doh-media-releases',
    'https://www.health.qld.gov.au/news-events/doh-media-releases/releases/queensland-novel-coronavirus-covid-19-update15'
  ],
  'South Australia, AUS': [
    'https://www.sahealth.sa.gov.au/wps/wcm/connect/public+content/sa+health+internet/health+topics/health+topics+a+-+z/covid+2019/latest+updates/confirmed+and+suspected+cases+of+covid-19+in+south+australia'
  ],
  'Victoria, AUS': [
    'https://www.dhhs.vic.gov.au/media-hub-coronavirus-disease-covid-19',
    'https://www.dhhs.vic.gov.au/coronavirus-update-victoria-29-march-2020'
  ],
  'Western Australia, AUS': ['https://ww2.health.wa.gov.au/Articles/A_E/Coronavirus/COVID19-statistics'],
  'DE-BB, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-BE, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-BW, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-BY, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-HB, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-HE, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-HH, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-MV, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-NI, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-NW, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-RP, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-SH, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-SL, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-SN, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-ST, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'DE-TH, DEU': ['https://raw.githubusercontent.com/jgehrcke/covid-19-germany-gae/master/data.csv'],
  'England, GBR': ['https://www.arcgis.com/sharing/rest/content/items/b684319181f94875a6879bbc833ca3a6/data'],
  'Scotland, GBR': ['https://www.gov.scot/coronavirus-covid-19/'],
  'AK, USA': ['http://dhss.alaska.gov/dph/Epi/id/Pages/COVID-19/monitoring.aspx'],
  'AL, USA': [
    'https://services7.arcgis.com/4RQmZZ0yaZkGR1zy/arcgis/rest/services/COV19_Public_Dashboard_ReadOnly/FeatureServer/0?f=json',
    'https://opendata.arcgis.com/datasets/ff8de7707f6a422a8af6b155facc6327_0.csv'
  ],
  'AR, USA': [
    'https://services.arcgis.com/PwY9ZuZRDiI5nXUB/ArcGIS/rest/services/ADH_COVID19_Positive_Test_Results/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*'
  ],
  'AZ, USA': [
    'https://tableau.azdhs.gov/views/COVID-19Dashboard/COVID-19table?%3AisGuestRedirectFromVizportal=y&%3Aembed=y',
    'https://tableau.azdhs.gov/vizql/w/COVID-19Dashboard/v/COVID-19table/vud/sessions/EF194846D76B43C7924B25E065001C64-3:0/views/8275719771277684273_9753144220671897612?csv=true&summary=true'
  ],
  'Alameda County, CA, USA': ['http://www.acphd.org/2019-ncov.aspx'],
  'Butte County, CA, USA': ['https://www.buttecounty.net/publichealth'],
  'Calaveras County, CA, USA': ['https://covid19.calaverasgov.us/'],
  'Colusa County, CA, USA': ['http://www.countyofcolusa.org/99/Public-Health'],
  'Contra Costa County, CA, USA': ['https://www.coronavirus.cchealth.org/'],
  'Del Norte County, CA, USA': ['http://www.co.del-norte.ca.us/departments/health-human-services/public-health'],
  'Fresno County, CA, USA': ['https://www.co.fresno.ca.us/departments/public-health/covid-19'],
  'Glenn County, CA, USA': ['https://www.countyofglenn.net/dept/health-human-services/public-health/covid-19'],
  'CA, USA': ['https://opendata.arcgis.com/datasets/06fcfe6147574a75afea97a1f7565dc7_0.csv'],
  'Kings County, CA, USA': [
    'https://www.countyofkings.com/departments/health-welfare/public-health/coronavirus-disease-2019-covid-19/-fsiteid-1'
  ],
  'Los Angeles County, CA, USA': ['http://www.publichealth.lacounty.gov/media/Coronavirus/'],
  'Madera County, CA, USA': ['https://www.maderacounty.com/government/public-health/health-updates/corona-virus'],
  'Marin County, CA, USA': ['https://coronavirus.marinhhs.org/surveillance'],
  'Mendocino County, CA, USA': ['https://www.mendocinocounty.org/community/novel-coronavirus'],
  'Merced County, CA, USA': ['https://www.co.merced.ca.us/3350/Coronavirus-Disease-2019'],
  'Mono County, CA, USA': ['https://monocovid19-monomammoth.hub.arcgis.com/'],
  'Monterey County, CA, USA': [
    'https://www.co.monterey.ca.us/government/departments-a-h/administrative-office/office-of-emergency-services/response/covid-19'
  ],
  'Orange County, CA, USA': ['https://occovid19.ochealthinfo.com/coronavirus-in-oc'],
  'Placer County, CA, USA': ['https://www.placer.ca.gov/6448/Cases-in-Placer'],
  'Riverside County, CA, USA': ['https://www.rivcoph.org/coronavirus'],
  'Sacramento County, CA, USA': ['https://www.saccounty.net/COVID-19/Pages/default.aspx'],
  'San Bernardino County, CA, USA': ['http://wp.sbcounty.gov/dph/coronavirus/'],
  'San Diego County, CA, USA': [
    'https://www.sandiegocounty.gov/content/sdc/hhsa/programs/phs/community_epidemiology/dc/2019-nCoV/status.html'
  ],
  'San Francisco County, CA, USA': ['https://www.sfdph.org/dph/alerts/coronavirus.asp'],
  'San Joaquin County, CA, USA': ['http://www.sjcphs.org/coronavirus.aspx#res'],
  'San Luis Obispo County, CA, USA': ['https://www.emergencyslo.org/en/covid19.aspx'],
  'San Mateo County, CA, USA': ['https://www.smchealth.org/coronavirus'],
  'Santa Barbara County, CA, USA': ['https://publichealthsbc.org'],
  'Santa Clara County, CA, USA': [
    'https://www.sccgov.org/sites/phd/DiseaseInformation/novel-coronavirus/Pages/home.aspx'
  ],
  'Santa Cruz County, CA, USA': [
    'http://www.santacruzhealth.org/HSAHome/HSADivisions/PublicHealth/CommunicableDiseaseControl/Coronavirus.aspx'
  ],
  'Shasta County, CA, USA': ['https://www.co.shasta.ca.us/covid-19/overview'],
  'Sonoma County, CA, USA': [
    'https://socoemergency.org/emergency/novel-coronavirus/novel-coronavirus-in-sonoma-county/'
  ],
  'Stanislaus County, CA, USA': ['http://www.schsa.org/PublicHealth/pages/corona-virus/'],
  'Ventura County, CA, USA': ['https://www.vcemergency.com'],
  'Yolo County, CA, USA': [
    'https://www.yolocounty.org/health-human-services/adults/communicable-disease-investigation-and-control/novel-coronavirus-2019'
  ],
  'CO, USA': ['https://opendata.arcgis.com/datasets/fbae539746324ca69ff34f086286845b_0.csv'],
  'CT, USA': ['https://portal.ct.gov/-/media/Coronavirus/CTDPHCOVID19summary3292020.pdf'],
  'DC, USA': ['https://coronavirus.dc.gov/page/coronavirus-data'],
  'DE, USA': ['http://opendata.arcgis.com/datasets/c8d4efa2a6bd48a1a7ae074a8166c6fa_0.csv'],
  'FL, USA': [
    'https://maps.arcgis.com/sharing/rest/content/items/74c7375b03894e68920c2d0131eef1e6?f=json',
    'https://services1.arcgis.com/CY1LXxl9zlJeBuRZ/arcgis/rest/services/Florida_Testing/FeatureServer/0?f=json',
    'https://opendata.arcgis.com/datasets/d9de96980b574ccd933da024a0926f37_0.csv'
  ],
  'GA, USA': ['https://dph.georgia.gov/covid-19-daily-status-report', 'https://d20s4vd27d0hk0.cloudfront.net'],
  'Guam, USA': ['http://dphss.guam.gov/2019-novel-coronavirus-2019-n-cov/'],
  'HI, USA': ['https://health.hawaii.gov/coronavirusdisease2019/'],
  'IA, USA': ['https://opendata.arcgis.com/datasets/6a84756c2e444a87828bb7ce699fdac6_0.csv'],
  'ID, USA': ['https://coronavirus.idaho.gov'],
  'IL, USA': ['http://www.dph.illinois.gov/sitefiles/COVIDTestResults.json'],
  'IN, USA': ['https://opendata.arcgis.com/datasets/d14de7e28b0448ab82eb36d6f25b1ea1_0.csv'],
  'KS, USA': [
    'https://services9.arcgis.com/Q6wTdPdCh608iNrJ/arcgis/rest/services/COVID19_CountyStatus_KDHE/FeatureServer/0/query?f=json&where=Covid_Case%3D%27Yes%27&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=COUNTY%20asc&resultOffset=0&resultRecordCount=105&cacheHint=true'
  ],
  'KY, USA': ['https://datawrapper.dwcdn.net/BbowM/23/'],
  'LA, USA': [
    'https://services5.arcgis.com/O5K6bb5dZVZcTo5M/arcgis/rest/services/Cases_by_Parish_2/FeatureServer/0/query?f=json&where=PFIPS%20%3C%3E%2099999&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=Deaths%20desc%2CCases%20desc%2CParish%20asc&resultOffset=0&resultRecordCount=65&cacheHint=true'
  ],
  'MA, USA': ['https://www.mass.gov/doc/covid-19-cases-in-massachusetts-as-of-march-29-2020/download'],
  'MD, USA': ['https://opendata.arcgis.com/datasets/3d9ca88970dd4689a701354d7fa6830b_0.csv'],
  'ME, USA': ['https://www.maine.gov/dhhs/mecdc/infectious-disease/epi/airborne/coronavirus.shtml'],
  'MI, USA': ['https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html'],
  'MN, USA': ['https://www.health.state.mn.us/diseases/coronavirus/situation.html'],
  'MO, USA': ['https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/results.php'],
  'MS, USA': ['https://msdh.ms.gov/msdhsite/_static/14,0,420.html'],
  'MT, USA': [
    'https://services.arcgis.com/qnjIrwR8z5Izc0ij/arcgis/rest/services/PUBLIC_VIEW_COVID19_CASES/FeatureServer/0/query?f=json&where=Total%20%3C%3E%200&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=NAMELABEL%20asc&resultOffset=0&resultRecordCount=56&cacheHint=true'
  ],
  'NC, USA': ['https://opendata.arcgis.com/datasets/969678bce431494a8f64d7faade6e5b8_0.csv'],
  'NE, USA': ['https://www.lincoln.ne.gov/city/covid19/'],
  'NH, USA': ['https://www.nh.gov/covid19/documents/case-map.pdf'],
  'NJ, USA': [
    'https://maps.arcgis.com/sharing/rest/content/items/ec4bffd48f7e495182226eee7962b422?f=json',
    'https://services7.arcgis.com/Z0rixLlManVefxqY/arcgis/rest/services/DailyCaseCounts/FeatureServer/0?f=json',
    'https://opendata.arcgis.com/datasets/24f4fcf164ad4b4280f08c8939dd5dc7_0.csv'
  ],
  'NM, USA': ['https://cv.nmhealth.org/cases-by-county/'],
  'NV, USA': ['https://gethealthycarsoncity.org/novel-coronavirus-2019/'],
  'Clark County, NV, USA': ['https://www.southernnevadahealthdistrict.org/coronavirus'],
  'Washoe County, NV, USA': [
    'https://maps.arcgis.com/sharing/rest/content/items/a54a945cac82424fa4928139ee83f911?f=json',
    'https://services.arcgis.com/iCGWaR7ZHc5saRIl/arcgis/rest/services/Cases_current/FeatureServer/0?f=json',
    'https://opendata.arcgis.com/datasets/4fcda514110940cb827ec2839e7ebbb0_0.csv'
  ],
  'NY, USA': [
    'https://coronavirus.health.ny.gov/county-county-breakdown-positive-cases',
    'https://www1.nyc.gov/assets/doh/downloads/pdf/imm/covid-19-daily-data-summary.pdf'
  ],
  'OH, USA': ['https://coronavirus.ohio.gov/static/COVIDSummaryData.csv'],
  'OK, USA': ['https://coronavirus.health.ok.gov/'],
  'OR, USA': ['https://www.oregon.gov/oha/PH/DISEASESCONDITIONS/DISEASESAZ/Pages/emerging-respiratory-infections.aspx'],
  'PA, USA': ['https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx'],
  'SC, USA': [
    'https://maps.arcgis.com/sharing/rest/content/items/3732035614af4246877e20c3a496e397?f=json',
    'https://services2.arcgis.com/XZg2efAbaieYAXmu/arcgis/rest/services/Covid19_Cases_Centroid_SharingView/FeatureServer/0?f=json',
    'https://opendata.arcgis.com/datasets/5ffb6e698ea64a91a497194814a26311_0.csv'
  ],
  'SD, USA': ['https://doh.sd.gov/news/Coronavirus.aspx#SD'],
  'TN, USA': ['https://www.tn.gov/health/cedep/ncov.html'],
  'TX, USA': ['https://opendata.arcgis.com/datasets/bc83058386d2434ca8cf90b26dc6b580_0.csv'],
  'UT, USA': ['https://coronavirus-dashboard.utah.gov/'],
  'VA, USA': ['http://www.vdh.virginia.gov/content/uploads/sites/182/2020/03/VDH-COVID-19-PublicUseDataset-Cases.csv'],
  'WA, USA': ['https://www.doh.wa.gov/Emergencies/Coronavirus'],
  'WI, USA': ['https://www.dhs.wisconsin.gov/covid-19/data.htm'],
  'WV, USA': ['https://dhhr.wv.gov/COVID-19/Pages/default.aspx'],
  'WY, USA': ['https://health.wyo.gov/publichealth/infectious-disease-epidemiology-unit/disease/novel-coronavirus/']
};
