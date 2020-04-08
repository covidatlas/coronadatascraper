/* global document, window */

import { getGrade } from './lib/math.js';
import { getContributors } from './lib/templates.js';
import { getName } from './lib/geography.js';
import * as fetch from './lib/fetch.js';

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

function showSources() {
  const list = document.querySelector('.cds-Sources-list');
  fetch.json('ratings.json', function(ratings) {
    list.innerHTML = '';
    for (let i = 0; i < ratings.length; i++) {
      list.insertAdjacentHTML('beforeend', ratingTemplate(ratings[i], i));
    }
    if (window.location.hash.includes(':')) {
      document.getElementById(window.location.hash.substr(1)).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

export default showSources;
