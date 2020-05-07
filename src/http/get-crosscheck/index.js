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
const { getContributors } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getClassNames } = require('@architect/views/lib/dom');
// eslint-disable-next-line
const { crosscheckTemplate } = require('@architect/views/lib/report');
// eslint-disable-next-line
const { getName, getSlug } = require('@architect/views/lib/geography');

// eslint-disable-next-line
const report = require('./dist/report.json');

exports.handler = async function http() {
  // .gitignore */dist/
  // glob things at build time, get cache filenames, store in get-crosscheck/dist/
  // copy report.json into get-crosscheck/dist/
  // make HTML
  // profit

  function generateCrossCheckReport(reports, date) {
    let html = '';
    for (const [, crosscheckReport] of Object.entries(reports)) {
      // Only show reports where we disgaree
      if (crosscheckReport.discrepancies.length !== 0) {
        const slug = getSlug(crosscheckReport.location);

        html += `<div>`;
        html += `<h2 class="spectrum-Heading spectrum-Heading--L" id="${slug}"><a href="#${slug}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${getName(
          crosscheckReport.location
        )}</a></h2>`;

        html += crosscheckTemplate(crosscheckReport, date);

        html += '</div>';
      }
    }
    return html;
  }

  function generateCrossCheckPage(report, date) {
    let html = `<section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Cross-check reports</h1>`;

    const totalReports = Object.keys(report).length;

    const identicalReports = Object.values(report).filter(r => r.discrepancies.length === 0).length;

    if (report && Object.keys(report).length) {
      html += `<p class="spectrum-Body spectrum-Body--L">A total of ${totalReports.toLocaleString()} cross-check reports were generated for ${date}.</p>`;
      if (identicalReports !== 0) {
        html += `<p class="spectrum-Body spectrum-Body--L">${identicalReports.toLocaleString()} cross-checks resulted in no discrepancies and are not shown below.</p>`;
      }

      html += `</section>`;
      html += `<ol class="cds-CrossCheckReports-list">
        ${generateCrossCheckReport(report, date)}
      </ol>`;
    } else {
      html += '<strong>No cross-check reports were generated.</strong>';
      html += `</section>`;
    }

    return html;
  }

  const reportHTML = generateCrossCheckPage(report.scrape.crosscheckReports, report.date);

  const body = template(
    'Cross-check Reports',
    `
${header('crosscheck')}
<div class="spectrum-Site-content">
  ${sidebar('crosscheck')}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    ${reportHTML}
    ${footer()}
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
