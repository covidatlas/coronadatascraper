const arc = require('@architect/functions');
// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
// eslint-disable-next-line
const header = require('@architect/views/header');
// eslint-disable-next-line
const sidebar = require('@architect/views/sidebar');

// eslint-disable-next-line
const { getName } = require('@architect/views/lib/geography');
// eslint-disable-next-line
const { getContributors } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getClassNames } = require('@architect/views/lib/dom');

const locations = require('./dist/location-map.json');
const timeseries = require('./dist/timeseries.json');
// const features = require('./dist/features.json');

// /:location
async function handle404(req) {
  // Read in the map
  // See if the slug matches
  const { pathParameters } = req;
  const locationString = pathParameters.location.toLowerCase();
  const foundLocation = locations[locationString];
  if (foundLocation) {
    req.location = foundLocation;
    return req;
  }

  return {
    statusCode: 404
  };
}

function getSingleContributorLink(location) {
  const curators = getContributors(location.curators, { shortNames: true, link: false });
  const sources = getContributors(location.sources, { shortNames: true, link: false });
  const sourceURLShort = location.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
  let html = '';
  html += `<a class="spectrum-Link" target="_blank" href="${location.url}">`;
  if (location.curators) {
    html += `<strong>${curators}</strong>`;
  } else if (location.sources) {
    html += `<strong>${sources}</strong>`;
  } else {
    html += `<strong>${sourceURLShort}</strong>`;
  }
  html += '</a>';
  return html;
}

function renderCaseInfo(label, count) {
  return `<h2 class="spectrum-Heading spectrum-Heading--XS ca-LocalData">${label}: <span class="spectrum-Heading--L ca-LocalCount"> ${count.toLocaleString()}</span></h2>`;
}

function locationDetail(location, lastDate, caseInfo) {
  // <p class="spectrum-Body spectrum-Body--L">Latest confirmed COVID-19 data</p>
  let html = `
<h1 class="spectrum-Heading spectrum-Heading--L ca-LocationTitle">${location.name}</h1>
`;

  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Updated: ${lastDate}</p>`;
  html += `<p class="spectrum-Body spectrum-Body--XS ca-LocationMeta">Data from ${getSingleContributorLink(
    location
  )}</p>`;
  html += `<div class="row">`;
  html += `<div class="col-xs-12 col-md-5 col-lg-4">`;

  if (caseInfo.active !== undefined) {
    html += renderCaseInfo('Active Cases', caseInfo.active);
  }
  if (caseInfo.cases !== undefined) {
    html += renderCaseInfo('Total Cases', caseInfo.cases);
  }
  if (caseInfo.deaths !== undefined) {
    html += renderCaseInfo('Deaths', caseInfo.deaths);
  }
  if (caseInfo.recovered !== undefined) {
    html += renderCaseInfo('Recovered', caseInfo.recovered);
  }
  if (caseInfo.hospitalized !== undefined && caseInfo.discharged !== undefined) {
    html += renderCaseInfo('Currently hospitalized', caseInfo.hospitalized - caseInfo.discharged);
  }

  html += `</div>`;
  html += `<div class="col-xs-12 col-md-7 col-lg-8">`;
  html += `<h2 class="spectrum-Heading spectrum-Heading--M">Timeline</h1>`;
  html += `<div class="ca-Placeholder"></div>`;
  html += `</div>`;
  html += `</div>`;
  html += `<div class="row">`;
  html += `<div class="col-xs-12 col-md-12">`;
  html += `<h2 class="spectrum-Heading spectrum-Heading--M">Map View</h1>`;
  html += `<div class="ca-Placeholder"></div>`;
  html += `</div>`;
  html += `</div>`;

  return html;
}

async function route(req) {
  // Get latest information from timeseries
  const { location } = req;
  const lastDate = Object.keys(timeseries).pop();
  const caseInfo = timeseries[lastDate][location.id];

  // Display the information for the location
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: template(
      `${location.name}`,
      `
${header()}
<div class="spectrum-Site-content">
  ${sidebar()}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    ${locationDetail(location, lastDate, caseInfo)}
  </div>
</div>
`,
      'ca-Reports'
    )
  };
}

exports.handler = arc.http.async(handle404, route);
