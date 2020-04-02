// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
// eslint-disable-next-line
const header = require('@architect/views/header');
// eslint-disable-next-line
const sidebar = require('@architect/views/sidebar');

exports.handler = async function http() {
  const baseURL = constants.prod ? 'https://coronadatascraper.com/' : '_static/';

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: template(
      'Datasets',
      `
${header('' /* 'ca-SiteHeader--dark spectrum--dark' */)}

<div class="spectrum-Site-content">
  ${sidebar('data')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--XL">Datasets</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas scrapes data from official local government sources and curated data, de-dupes, cross-checks, adds population data, and adds GeoJSON features.</p>
      <p class="spectrum-Body spectrum-Body--L">View or download any of these data sets to analyze global COVID-19 data, create your own visualizations, or identify errors and missing data.</p>
    </section>

    <hr>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Global timeseries</h1>
      <p class="spectrum-Body spectrum-Body--L">Worldwide COVID-19 data in a time-series format since the start of the pandemic.</p>
      <sp-button variant="primary" quiet href="#notimplemented">View data</sp-button>
      <sp-dropdown emphasized class="ca-DownloadDropdown" label="Download">
        <sp-menu>
          <sp-menu-item download target="_blank" href="${baseURL}timeseries.csv">CSV</sp-menu-item>
          <sp-menu-item download target="_blank" href="${baseURL}timeseries.json">JSON</sp-menu-item>
          <sp-menu-item download target="_blank" href="${baseURL}timeseries-byLocation.json">JSON (by location)</sp-menu-item>
        </sp-menu>
      </sp-dropdown>
    </section>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Global daily</h1>
      <p class="spectrum-Body spectrum-Body--L">The latest worldwide COVID-19 data.</p>
      <sp-button variant="primary" quiet href="#notimplemented">View data</sp-button>
      <sp-dropdown emphasized class="ca-DownloadDropdown" label="Download">
        <sp-menu>
          <sp-menu-item download target="_blank" href="${baseURL}data.csv">CSV</sp-menu-item>
          <sp-menu-item download target="_blank" href="${baseURL}data.json">JSON</sp-menu-item>
        </sp-menu>
      </sp-dropdown>
    </section>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">GeoJSON</h1>
      <sp-button variant="primary" quiet href="/map">View map</sp-button> <sp-button emphasized href="${baseURL}features.json" target="_blank" download>Download</sp-button>
    </section>

  </div>

</div>
`,
      'ca-Datasets'
    )
  };
};
