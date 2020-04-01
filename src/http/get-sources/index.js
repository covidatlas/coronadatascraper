// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
// eslint-disable-next-line
const header = require('@architect/views/header');
// eslint-disable-next-line
const sidebar = require('@architect/views/sidebar');

// eslint-disable-next-line
const { getContributors, getURLFromContributor } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getName } = require('@architect/views/lib/geography');

const ratings = require('./dist/ratings.json');

function getGrade(rating) {
  rating *= 200;

  if (rating >= 97) {
    return 'A+';
  }
  if (rating >= 93) {
    return 'A';
  }
  if (rating >= 90) {
    return 'A-';
  }
  if (rating >= 87) {
    return 'B+';
  }
  if (rating >= 83) {
    return 'B';
  }
  if (rating >= 80) {
    return 'B-';
  }
  if (rating >= 77) {
    return 'C+';
  }
  if (rating >= 73) {
    return 'C';
  }
  if (rating >= 70) {
    return 'C-';
  }
  if (rating >= 67) {
    return 'D+';
  }
  if (rating >= 63) {
    return 'D';
  }
  if (rating >= 60) {
    return 'D';
  }
  if (rating >= 57) {
    return 'F+';
  }
  if (rating >= 53) {
    return 'F';
  }
  if (rating >= 50) {
    return 'F';
  }
  return 'F-';
}

function getContributorsHeading(contributors, byString) {
  let html = '';

  if (contributors) {
    html += `<h3 class="spectrum-Body spectrum-Body--XL cds-ReportCard-contributorName">${byString} `;
    html += getContributors(contributors);
    html += `</h3>`;
  }

  return html;
}

function ratingTemplate(source, index) {
  const typeIcons = {
    json: '✅',
    csv: '✅',
    table: '⚠️',
    list: '❌',
    paragraph: '🤮',
    pdf: '🤮'
  };
  const typeNames = {
    json: 'JSON',
    pdf: 'PDF',
    csv: 'CSV'
  };

  let granular = source.city || source.county;
  let granularity = 'country-level';
  if (source.city || source.aggregate === 'city') {
    granularity = 'city-level';
    granular = true;
  } else if (source.county || source.aggregate === 'county') {
    granularity = 'county-level';
    granular = true;
  } else if (source.state || source.aggregate === 'state') {
    granularity = 'state-level';
  }

  const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
  const slug = `sources:${getName(source)
    .replace(/,/g, '-')
    .replace(/\s/g, '')}`;

  const curators = getContributorsHeading(source.curators, 'Curated by');
  const sources = getContributorsHeading(source.sources, 'Sourced from');
  const maintainers = getContributorsHeading(source.maintainers, 'Maintained by');
  return `
  <li class="cds-ReportCard" id="${slug}">
    <div class="cds-ReportCard-grade cds-ReportCard-grade--${getGrade(source.rating).replace(
      /[^A-Z]+/g,
      ''
    )}">${getGrade(source.rating).replace(/([+-])/, '<span class="cds-ReportCard-plusMinus">$1</span>')}</div>
    <div class="cds-ReportCard-content">
      <h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" target="_blank" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${index +
    1}. ${getName(source)}</a></h2>
      ${sources}
      ${curators}
      ${maintainers}
      <h4 class="spectrum-Body spectrum-Body--XL cds-ReportCard-sourceURL">Data from <a href="${
        source.url
      }" class="spectrum-Link" target="_blank">${sourceURLShort}</a></h4>
      <div class="cds-ReportCard-criteria">
        <div class="cds-ReportCard-criterion">
          ${typeIcons[source.type]} ${typeNames[source.type] ||
    source.type.substr(0, 1).toUpperCase() + source.type.substr(1)}
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.timeseries ? '✅' : '❌'} Timeseries
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.aggregate ? '✅' : '❌'} Aggregate
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.ssl ? '✅' : '❌'} SSL
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.headless ? '❌' : '✅'} ${source.headless ? 'Requires' : ' Does not require'} JavaScript
        </div>
        <div class="cds-ReportCard-criterion">
          ${granular ? '✅' : '❌'} Granularity (${granularity})
        </div>
      </div>
    </div>
  </li>
`;
}

exports.handler = async function http() {
  let ratingHTML = '';
  for (let i = 0; i < ratings.length; i++) {
    ratingHTML += ratingTemplate(ratings[i], i);
  }

  const body = template(
    'Sources',
    `
${header()}
<div class="spectrum-Site-content">
  ${sidebar('sources')}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    <h1 class="spectrum-Heading spectrum-Heading--L">About the data sources</h1>
    <p class="spectrum-Body spectrum-Body--L">Corona Data Scraper pulls information from a variety of openly available world government data sources and curated datasets.</p>

    <h2 class="spectrum-Heading spectrum-Heading--M">Ratings have nothing to do with the accuracy of the data</h2>
    <p class="spectrum-Body spectrum-Body--L">The ratings for the data sources here are based on how machine-readable, complete, and granular their data is — not on the accuracy or reliability of the information. We’re using a rating system like this because we’re trying to make governments more accountable for their data practices.</p>
    <p class="spectrum-Body spectrum-Body--L"><a class="spectrum-Link" href="${
      constants.repoURL
    }blob/master/src/events/crawler/tasks/scrapeData/rateLocations.js" target="_blank">Take a look at the code</a> to learn more about how the rating system works.</p>

    <h2 class="spectrum-Heading spectrum-Heading--M">Questions about a source’s rating?</h2>
    <p class="spectrum-Body spectrum-Body--L">We’d like to hear from you and help you make your source more complete. <a class="spectrum-Link" href="https://join.slack.com/t/sars-cov-2covid-19/shared_invite/zt-cr6ln0ph-6eDATfSUNDtFK3mlQxqYKw" target="_blank">Reach out to us on on Slack</a> or <a class="spectrum-Link" href="${
      constants.repoURL
    }issues">file an issue on Github</a>.</p>

    <h2 class="spectrum-Heading spectrum-Heading--M" id="spec">What does a good source look like?</h2>
    <p class="spectrum-Body spectrum-Body--L">
      First, please have a look at our <a href="example.csv" download class="spectrum-Link">example format</a>.<br/>
      As the data itself is most important, please publish <em>cumulative</em> counts for cases, deaths, hospitalized, discharged, recovered, and total tests administered.
      If you cannot publish in JSON or CSV, at a minimum, please include a HTML <code>&lt;table&gt;</code> with one row per locality at the most granular level you have.<br/>
      Have a column for the name of this locality, and a column for each additional data point.<br/>
      The best published sources include timestamps, allowing citizens and researchers alike better understand the data you have, over time, within your specific geographic region(s).
    </p>

    ${ratingHTML}
  </div>
</div>
`,
    'ca-Sources'
  );

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body
  };
};
