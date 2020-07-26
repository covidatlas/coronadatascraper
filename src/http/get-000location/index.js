const arc = require('@architect/functions');
// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
// eslint-disable-next-line
const header = require('@architect/views/header');
// eslint-disable-next-line
const footer = require('@architect/views/footer');
// eslint-disable-next-line
const sidebar = require('@architect/views/sidebar');

// eslint-disable-next-line
const { levels, getName, getSlug, getParentLocation } = require('@architect/views/lib/geography');
// eslint-disable-next-line
const { getContributors, getSingleContributorLink } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getClassNames } = require('@architect/views/lib/dom');
// eslint-disable-next-line
const { crosscheckTemplate, ratingTemplate } = require('@architect/views/lib/report');
// eslint-disable-next-line
const { handle404 } = require('@architect/views/lib/middleware');

// eslint-disable-next-line
const locationMap = require('./dist/location-map.json');
// eslint-disable-next-line
const timeseries = require('./dist/timeseries.json');
// eslint-disable-next-line
const ratings = require('./dist/ratings.json');
// eslint-disable-next-line
const report = require('./dist/report.json');

function renderBreadcrumbs(location) {
  const htmlBits = [];
  const obj = {};
  for (const level of levels.slice().reverse()) {
    if (location[level]) {
      obj[level] = location[level];
      htmlBits.push(`<a class="spectrum-Link spectrum-Link--silent" href="${getSlug(obj)}">${location[level]}</a>`);
    }
  }
  return htmlBits.reverse().join(', ');
}

function renderCaseInfo(label, count, labelClass) {
  return `<h2 class="spectrum-Heading spectrum-Heading--XS ca-LocalData">${label}: <span class="spectrum-Heading--L ca-LocalCount ${labelClass}"> ${count.toLocaleString()}</span></h2>`;
}

function locationDetail(location, lastDate, caseInfo, rating, crosscheckReport) {
  // <p class="spectrum-Body spectrum-Body--L">Latest confirmed COVID-19 data</p>
  let html = `
<h1 class="spectrum-Heading spectrum-Heading--L ca-LocationTitle">${renderBreadcrumbs(location)}</h1>
`;

  html += `<div class="row">
    <div class="col-xs-12 col-sm-6">`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Updated: ${lastDate}</p>`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Data from ${getSingleContributorLink(
    location
  )}</p>`;
  html += `</div>
    <div class="col-xs-12 col-sm-6 end-sm">
      <!-- todo: make this responsive, dropdown menu on mobile -->
      <sp-button quiet variant="secondary" href="/data">Download</sp-button>
      <!--
      <overlay-trigger id="trigger" placement="bottom" class="ca-DownloadTrigger">
        <sp-button quiet variant="secondary" slot="trigger">Share</sp-button>
        <sp-popover dialog slot="click-content" tip open class="ca-DownloadPopover" direction="bottom">
          <div class="ca-SocialButtons">
          </div>
        </sp-popover>
      </overlay-trigger>
      -->
    </div>
  </div>`;
  html += `<div class="row">`;
  html += `<div class="col-xs-12 col-md-5 col-lg-4">`;

  if (caseInfo.cases !== undefined) {
    html += renderCaseInfo('Cases', caseInfo.cases, 'ca-Total');
  }
  if (caseInfo.deaths !== undefined) {
    html += renderCaseInfo('Deaths', caseInfo.deaths, 'ca-Deaths');
  }
  if (caseInfo.recovered !== undefined) {
    html += renderCaseInfo('Recovered', caseInfo.recovered, 'ca-Recovered');
  }
  if (caseInfo.active !== undefined) {
    html += renderCaseInfo('Active cases', caseInfo.active, 'ca-Active');
  }
  if (caseInfo.hospitalized !== undefined) {
    html += renderCaseInfo('Hospitalized', caseInfo.hospitalized, 'ca-Hospitalized');
  }
  if (caseInfo.icu !== undefined) {
    html += renderCaseInfo('ICU', caseInfo.icu, 'ca-ICU');
  }
  if (caseInfo.discharged !== undefined) {
    html += renderCaseInfo('Discharged', caseInfo.discharged, 'ca-Discharged');
  }
  if (caseInfo.tested !== undefined) {
    html += renderCaseInfo('Tested', caseInfo.tested, 'ca-Tested');
  }
  // if (caseInfo.hospitalized !== undefined && caseInfo.discharged !== undefined) {
  //   html += renderCaseInfo('Currently hospitalized', caseInfo.hospitalized - caseInfo.discharged, 'ca-Hospitalized');
  // }
  html += `</div>
    <div class="col-xs-12 col-md-7 col-lg-8 graph-container">
      <h2 class="spectrum-Heading spectrum-Heading--M">Timeline</h1>
      <div class="graph-button-container">
        <div class="graph-button-container-overview">
          <sp-button variant="primary" id="graph-btn-overview">Overview</sp-button>
          <sp-button variant="primary" id="graph-btn-daily">Daily Statistics</sp-button>
        </div>
        <div class="graph-button-container-daily">
          <sp-button variant="secondary" id="graph-btn-linear">Linear</sp-button>
          <sp-button variant="secondary" id="graph-btn-log">Logarithmic</sp-button>
        </div>
      </div>
      <div class="graph-legend">
        <div class="graph-legend-key-container">
        <strong>Key:</strong>
        </div>
      </div>
      <div id="graph" class="ca-Graph"></div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12 col-md-12">
      <h2 class="spectrum-Heading spectrum-Heading--M">Regional map</h1>
      <div id="map" class="ca-Map"></div>
    </div>
  </div>
  <div class="row">
`;

  html += `
    <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
      <h4 class="spectrum-Heading spectrum-Heading--S">Data source rating</h4>
      <p class="spectrum-Body spectrum-Body--S">Our <a class="spectrum-Link" href="/sources">data transparency rating</a> is based on the granularity, completeness, and technical format of this data source.</p>
      ${ratingTemplate(rating)}
    </section>
`;

  if (crosscheckReport) {
    html += `
      <section class="ca-SubSection col-xs-12 col-sm-6 col-md-8">
        <h4 class="spectrum-Heading spectrum-Heading--S">Cross-check report</h4>
        <p class="spectrum-Body spectrum-Body--S">${
          constants.name
        } checks multiple sources for the same data and reports inconsistencies. The most consistent and best-rated sources are displayed in COVID Atlas graphs and maps.</p>
        ${crosscheckTemplate(crosscheckReport)}
      </section>
  `;
  }

  html += `
  </div>

  <div class="ca-Callout--Disclaimer">
    <p class="spectrum-Body spectrum-Body--M">
      ${constants.disclaimer}
    </p>
  </div>

  <!--
  <hr>
  <div class="row">
    <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">Local resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>

    <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">National resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>

    <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">Global resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>
  </div>
  -->`;

  return html;
}

function locationMatches(a, b) {
  return a.country === b.country && a.state === b.state && a.county === b.county && a.city === b.city;
}

async function route(req) {
  // Get latest information from timeseries
  const { location, slug } = req;
  const lastDate = Object.keys(timeseries).pop();
  const caseInfo = timeseries[lastDate][location.id];

  // Get parent location
  const parentLocation = getParentLocation(location, locationMap) || location;

  // Add slugs
  location.slug = slug;
  parentLocation.slug = getSlug(parentLocation);

  const rating = ratings.find(rating => location.url === rating.url);
  const crosscheckReport = report.scrape.crosscheckReports.find(report => locationMatches(location, report.location));

  // Display the information for the location
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: template(
      `${location.name}`,
      `
${header({ selectedPage: '' })}
<div class="spectrum-Site-content">
  ${sidebar()}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    ${locationDetail(location, lastDate, caseInfo, rating, crosscheckReport)}
    <link href="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js"></script>
    <script src='https://api.mapbox.com/mapbox.js/plugins/geojson-extent/v0.0.1/geojson-extent.js'></script>

    <script src="https://d3js.org/d3.v5.min.js"></script>
    <!-- <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js"></script> -->
    <script src="${arc.static('location.js')}"></script>
    <script>
      window.showLocation({
        location: ${JSON.stringify(location)},
        parentLocation: ${location === parentLocation ? null : JSON.stringify(parentLocation)}
      });
    </script>
    ${footer()}
  </div>
</div>
`,
      'ca-Reports'
    )
  };
}

exports.handler = arc.http.async(handle404(locationMap), route);
