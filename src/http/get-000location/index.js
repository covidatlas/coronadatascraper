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
const { getName, getSlug, getParentLocation } = require('@architect/views/lib/geography');
// eslint-disable-next-line
const { getContributors, getSingleContributorLink } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getClassNames } = require('@architect/views/lib/dom');
// eslint-disable-next-line
const { handle404 } = require('@architect/views/lib/middleware');

const locationMap = require('./dist/location-map.json');
const timeseries = require('./dist/timeseries.json');

function renderCaseInfo(label, count, labelClass) {
  return `<h2 class="spectrum-Heading spectrum-Heading--XS ca-LocalData">${label}: <span class="spectrum-Heading--L ca-LocalCount ${labelClass}"> ${count.toLocaleString()}</span></h2>`;
}

function locationDetail(location, lastDate, caseInfo) {
  // <p class="spectrum-Body spectrum-Body--L">Latest confirmed COVID-19 data</p>
  let html = `
<h1 class="spectrum-Heading spectrum-Heading--L ca-LocationTitle">${location.name}</h1>
`;

  html += `<div class="row">
    <div class="col-xs-12 col-sm-6">`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Updated: ${lastDate}</p>`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Data from ${getSingleContributorLink(
    location
  )}</p>`;
  html += `</div>
    <div class="col-xs-12 col-sm-6 end-sm">
      <sp-button quiet variant="secondary" href="/data">Download</sp-button>
      <overlay-trigger id="trigger" placement="bottom" class="ca-DownloadTrigger">
        <!-- <sp-button quiet variant="secondary" slot="trigger">Share</sp-button> -->
        <sp-popover dialog slot="click-content" tip open class="ca-DownloadPopover" direction="bottom">
          <div class="ca-SocialButtons">

          </div>
        </sp-popover>
      </overlay-trigger>
    </div>
  </div>`;
  html += `<div class="row">`;
  html += `<div class="col-xs-12 col-md-5 col-lg-4">`;

  if (caseInfo.active !== undefined) {
    html += renderCaseInfo('Active Cases', caseInfo.active, 'ca-Active');
  }
  if (caseInfo.cases !== undefined) {
    html += renderCaseInfo('Total cases', caseInfo.cases, 'ca-Total');
  }
  if (caseInfo.deaths !== undefined) {
    html += renderCaseInfo('Deaths', caseInfo.deaths, 'ca-Deaths');
  }
  if (caseInfo.recovered !== undefined) {
    html += renderCaseInfo('Recovered', caseInfo.recovered, 'ca-Recovered');
  }
  if (caseInfo.hospitalized !== undefined && caseInfo.discharged !== undefined) {
    html += renderCaseInfo('Currently hospitalized', caseInfo.hospitalized - caseInfo.discharged, 'ca-Hospitalized');
  }

  html += `</div>
    <div class="col-xs-12 col-md-7 col-lg-8">
      <h2 class="spectrum-Heading spectrum-Heading--M">Timeline</h1>
      <!-- <div id="graph" class="ca-Graph"></div> -->
      <div id="graph-elements">
        <div id="graph-container">
          <canvas id="graph"></canvas>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12 col-md-12">
      <h2 class="spectrum-Heading spectrum-Heading--M">Map view</h1>
      <div id="map" class="ca-Map"></div>
    </div>
  </div>
  <div class="ca-Section">
    <!--
    <div class="row">
      <div class="col-xs-12">
        <h2 class="spectrum-Heading spectrum-Heading--M">Sources</h1>
        <p class="spectrum-Body spectrum-Body--S">
          COVID Atlas pulls information from a variety of openly available world government data sources and curated datasets.
          <strong>Ratings have nothing to do with the accuracy of the data.</strong>
          The ratings for the data sources here are based on how machine-readable, complete, and granular their data is — not on the accuracy or reliability of the information. We’re using a rating system like this because we’re trying to make governments more accountable for their data practices.
        </p>
        <a href="/sources" class="spectrum-Link">Learn more about COVID Atlas sources</a>
      </div>
    </div>
    -->
    <div class="row">
      <section class="col-xs-12 col-sm-6 col-md-4">
        <h4 class="spectrum-Heading spectrum-Heading--S">[Data source]</h4>
        <p class="spectrum-Body spectrum-Body--S"> Report card</p>
      </section>

      <section class="col-xs-12 col-sm-6 col-md-8">
        <h4 class="spectrum-Heading spectrum-Heading--S">[Location cross-check]</h4>
        <p class="spectrum-Body spectrum-Body--S"> Cross-Check report for this locations's sources</p>
      </section>
    </div>
  </div>

  <div class="ca-Callout--Disclaimer">
    <p class="spectrum-Body spectrum-Body--M">
      COVID Atlas is for informational purposes only and does not offer any medical advice. Data <a class="spectrum-Link" href="#">quality and accuracy</a> is subject to <a class="spectrum-Link" href="#">local government sources</a>. Contact your local officials with questions about the data.
    </p>
  </div>

  <!--
  <hr>
  <div class="row">
    <section class="ca-Section col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">Local resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>

    <section class="ca-Section col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">National resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>

    <section class="ca-Section col-xs-12 col-sm-6 col-md-4">
      <h1 class="spectrum-Heading spectrum-Heading--M">Global resources</h1>
      <p class="spectrum-Body spectrum-Body--M">List of links</p>
    </section>
  </div>
  -->`;

  return html;
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
    ${locationDetail(location, lastDate, caseInfo)}
    <link href="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.css" rel="stylesheet">
    <script src="https://api.mapbox.com/mapbox-gl-js/v1.8.1/mapbox-gl.js"></script>
    <!-- <script src="https://d3js.org/d3.v5.min.js"></script> -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js"></script>
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
