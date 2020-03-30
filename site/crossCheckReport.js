/* global document, window */

import { getContributors } from './lib/templates.js';
import { getName } from './lib/geography.js';
import * as fetch from './lib/fetch.js';

function getClassNames(classNames) {
  return Object.entries(classNames)
    .reduce((a, [className, use]) => {
      if (use) {
        a.push(className);
      }
      return a;
    }, [])
    .join(' ');
}

function crossCheckReportTemplate(report) {
  const locationName = getName(report.location);
  const slug = `crosscheck:${locationName.replace(/,/g, '-').replace(/\s/g, '')}`;

  let html = `<li class="cds-CrossCheckReport" id="${slug}">`;
  html += `<h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${locationName}</a></h2>`;

  html += `<div class="cds-SourceComparison">`;

  const metrics = ['cases', 'deaths', 'tested', 'recovered'];

  html += `
      <table>
        <thead>
          <td></td>
  `;

  for (const metric of metrics) {
    const classNames = {
      'cds-SourceComparison-metric': true,
      'cds-SourceComparison-discrepancyMetric': report.discrepancies.includes(metric),
      'cds-SourceComparison-agreedMetric': report.agreements.includes(metric)
    };

    html += `<th class="${getClassNames(classNames)}">${metric}</td>`;
  }

  html += `
        </thead>
        <tbody>
  `;

  report.sources.forEach((source, index) => {
    html += `
            <tr>
    `;
    const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
    const curators = getContributors(source.curators, { shortNames: true, link: false });
    const sources = getContributors(source.sources, { shortNames: true, link: false });
    html += `<th class="cds-SourceComparison-source">`;
    if (index === report.used) {
      html += '✅ ';
    }
    html += `<a class="spectrum-Link" target="_blank" href="${source.url}">`;
    if (source.curators) {
      html += `<strong>${curators}</strong>`;
    } else if (source.sources) {
      html += `<strong>${sources}</strong>`;
    } else {
      html += `<strong>${sourceURLShort}</strong>`;
    }
    html += `</a>`;
    html += `</th>`;

    for (const metric of metrics) {
      html += `<td class="cds-SourceComparison-value${
        report.discrepancies.includes(metric) ? ' cds-SourceComparison-discrepancyValue' : ''
      }">${source[metric] === undefined ? '-' : source[metric]}</td>`;
    }

    html += `
            </tr>
    `;
  });

  html += `
        </tbody>
      </table>
  `;

  html += `</div>`;

  html += `</li>`;

  return html;
}

function generateCrossCheckReport(reports, date) {
  let html = '';
  for (const [, crosscheckReport] of Object.entries(reports)) {
    // Only show reports where we disgaree
    if (crosscheckReport.discrepancies.length !== 0) {
      html += crossCheckReportTemplate(crosscheckReport, date);
    }
  }
  return html;
}

export function generateCrossCheckPage(report, date) {
  let html = `<h1 class="spectrum-Heading spectrum-Heading--L">Cross-check reports</h1>`;

  const totalReports = Object.keys(report).length;

  const identicalReports = Object.values(report).filter(r => r.discrepancies.length === 0).length;

  if (report && Object.keys(report).length) {
    html += `<p class="spectrum-Body spectrum-Body--L">A total of ${totalReports.toLocaleString()} cross-check reports were generated for ${date}.</p>`;
    if (identicalReports !== 0) {
      html += `<p class="spectrum-Body spectrum-Body--L">${identicalReports.toLocaleString()} cross-checks resulted in no discrepancies and are not shown below.</p>`;
    }

    html += `<ol class="cds-CrossCheckReports-list">
      ${generateCrossCheckReport(report, date)}
    </ol>`;
  } else {
    html += '<strong>No cross-check reports were generated.</strong>';
  }

  return html;
}

function showCrossCheckReport() {
  const reportContainer = document.querySelector('.cds-CrossCheckReports-page');
  fetch.json('report.json', function(report) {
    reportContainer.innerHTML = generateCrossCheckPage(report.scrape.crosscheckReports, report.date);

    if (window.location.hash.indexOf(':') !== -1) {
      document.getElementById(window.location.hash.substr(1)).scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
}

export default showCrossCheckReport;
