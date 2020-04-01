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

const report = require('./dist/report.json');

exports.handler = async function http() {
  // .gitignore */dist/
  // glob things at build time, get cache filenames, store in get-crosscheck/dist/
  // copy report.json into get-crosscheck/dist/
  // make HTML
  // profit

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

  function generateCrossCheckPage(report, date) {
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

  const reportHTML = generateCrossCheckPage(report.scrape.crosscheckReports, report.date);

  const body = template(
    'Cross-check Reports',
    `
${header()}
<div class="spectrum-Site-content">
  ${sidebar('sources')}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    ${reportHTML}
  </div>
</div>
`,
    'ca-Reports'
  );

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body
  };
};
