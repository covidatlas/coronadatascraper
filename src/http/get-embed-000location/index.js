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
const { handle404 } = require('@architect/views/lib/middleware');

// eslint-disable-next-line
const locationMap = require('./dist/location-map.json');
// eslint-disable-next-line
const timeseries = require('./dist/timeseries.json');

function renderCaseInfo(label, count, labelClass) {
  return `<h2 class="spectrum-Heading spectrum-Heading--XS ca-LocalData">${label}: <span class="spectrum-Heading--L ca-LocalCount ${labelClass}"> ${count.toLocaleString()}</span></h2>`;
}

function getAttribution(location) {
  let html = ``;
  html += `<div class="ca-Attribution row">`;
  // html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Updated: ${lastDate}</p>`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Data from ${getSingleContributorLink(
    location
  )}</p>`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Visualization by <a href="/" target="_blank">COVID Atlas</a></p>`;
  html += `</div>`;
  return html;
}

const embeds = {
  table: ({ location, caseInfo }) => {
    let html = '';
    html += getAttribution(location);
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
    if (caseInfo.discharged !== undefined) {
      html += renderCaseInfo('Discharged', caseInfo.discharged, 'ca-Discharged');
    }
    if (caseInfo.tested !== undefined) {
      html += renderCaseInfo('Tested', caseInfo.tested, 'ca-Tested');
    }
    html += `</div>`;
    html += `</div>`;
    return html;
  },
  graph: ({ location }) => {
    return `
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.9.3/Chart.bundle.min.js"></script>
<script src="${arc.static('embed-graph.js')}"></script>
<style>
  body {
    font-family: Helvetica, sans-serif;
    background: white;
  }
  .ca-Attribution {
    color: gray;
  }
  a,
  a:visited {
    color: inherit;
  }
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  #graph-elements {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
  #graph-container {
    flex: 1
  }
</style>
<div id="graph-elements">
  <div id="graph-container">
    <canvas id="graph"></canvas>
  </div>
  ${getAttribution(location)}
</div>
<script>
  window.showGraph({
    location: ${JSON.stringify(location)}
  });
</script>
`;
  },
  map: () => {
    return 'Not implemented';
  }
};

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

  // Get embed type
  const type = req.queryStringParameters.type || 'map';
  if (embeds[type]) {
    return {
      headers: {
        'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
        'content-type': 'text/html; charset=utf8'
      },
      body: embeds[type]({ location, caseInfo, timeseries, parentLocation })
    };
  }

  return {
    statusCode: 400
  };
}

exports.handler = arc.http.async(handle404(locationMap), route);
