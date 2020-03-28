/* global document, window */

import { getContributors } from './lib/templates.js';
import * as fetch from './lib/fetch.js';

function crossCheckReportTemplate(locationName, report) {
  const slug = `crosscheck:${locationName.replace(/,/g, '-').replace(/\s/g, '')}`;

  let html = `<li class="cds-CrossCheckReport" id="${slug}">`;
  html += `<h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" target="_blank" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${locationName}</a></h2>`;

  html += `<div class="cds-SourceComparison">`;

  const metrics = ['cases', 'deaths', 'tested', 'recovered'];

  html += `
      <table>
        <thead>
          <td></td>
  `;

  for (const metric of metrics) {
    html += `<th class="cds-SourceComparison-metric">${metric}</td>`;
  }

  html += `
        </thead>
        <tbody>
  `;

  for (const source of report) {
    html += `
            <tr>
    `;
    const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
    const curators = getContributors(source.curators, 'Curated by');
    const sources = getContributors(source.sources, 'Sourced from');
    html += `<th class="cds-SourceComparison-source">`;
    if (source.curators) {
      html += `<strong>${curators}</strong>`;
    } else if (source.sources) {
      html += `<strong>${sources}</strong>`;
    } else {
      html += `<strong><a href="${source.url}" class="spectrum-Link" target="_blank">${sourceURLShort}</a></strong>`;
    }
    html += `</th>`;

    for (const metric of metrics) {
      html += `<td class="cds-SourceComparison-value">${source[metric] === undefined ? '-' : source[metric]}</td>`;
    }

    html += `
            </tr>
    `;
  }

  html += `
        </tbody>
      </table>
  `;

  html += `</div>`;

  html += `</li>`;

  return html;
}

function showCrossCheckReport() {
  const list = document.querySelector('.cds-CrossCheckReports-list');
  const info = document.querySelector('.cds-CrossCheckReports-info');
  fetch.json('report.json', function(report) {
    info.innerHTML = `<p class="spectrum-Body spectrum-Body--L">A total of ${Object.keys(
      report.scrape.crosscheckReports
    ).length.toLocaleString()} cross-checks reports were generated.</p>`;
    if (report.scrape.crosscheckReports) {
      for (const [locationName, crosscheckReport] of Object.entries(report.scrape.crosscheckReports)) {
        list.insertAdjacentHTML('beforeend', crossCheckReportTemplate(locationName, crosscheckReport));
      }
    } else {
      list.innerHTML = '<strong>No cross-check reports were generated.</strong>';
    }

    if (window.location.hash.indexOf(':') !== -1) {
      document.getElementById(window.location.hash.substr(1)).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

export default showCrossCheckReport;
