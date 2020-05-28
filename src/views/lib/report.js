// eslint-disable-next-line
const { getContributors } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getClassNames } = require('@architect/views/lib/dom');
// eslint-disable-next-line
const { getName, getSlug } = require('@architect/views/lib/geography');

module.exports.crosscheckTemplate = function crosscheckTemplate(report) {
  let html = `<div class="cds-CrossCheckReport">`;

  html += `<div class="cds-SourceComparison">`;

  const metrics = [
    'cases',
    'deaths',
    'tested',
    'recovered',
    'hospitalized_current',
    'icu',
    'icu_current',
    'discharged'
  ];

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

  html += `</div>`;

  return html;
};

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
    html += `<h3 class="spectrum-Body spectrum-Body--S cds-ReportCard-contributorName">${byString} `;
    html += getContributors(contributors);
    html += `</h3>`;
  }

  return html;
}

module.exports.ratingTemplate = function ratingTemplate(source, index) {
  const typeIcons = {
    json: '✅',
    csv: '✅',
    table: '⚠️',
    list: '❌',
    paragraph: '❌',
    pdf: '❌'
  };
  const typeNames = {
    table: 'HTML table',
    list: 'HTML list',
    json: 'JSON',
    pdf: 'PDF',
    csv: 'CSV'
  };

  let granular = source.city || source.county;
  let granularity = 'country-level data';
  if (source.city || source.aggregate === 'city') {
    granularity = 'city-level data';
    granular = true;
  } else if (source.county || source.aggregate === 'county') {
    granularity = 'county / municipality-level data';
    granular = true;
  } else if (source.state || source.aggregate === 'state') {
    granularity = 'state-level data';
  }

  const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
  const slug = `sources:${getName(source)
    .replace(/,/g, '-')
    .replace(/\s/g, '')}`;

  const curators = getContributorsHeading(source.curators, 'Curated by');
  const sources = getContributorsHeading(source.sources, 'Sourced from');
  const maintainers = getContributorsHeading(source.maintainers, 'Maintained by');
  let html = `
  <li class="cds-ReportCard" id="${slug}">
    <div class="cds-ReportCard-grade cds-ReportCard-grade--${getGrade(source.rating).replace(
      /[^A-Z]+/g,
      ''
    )}">${getGrade(source.rating).replace(/([+-])/, '<span class="cds-ReportCard-plusMinus">$1</span>')}</div>
    <div class="cds-ReportCard-content">
  `;

  if (index !== undefined) {
    html += `<h2 class="spectrum-Heading spectrum-Heading--M"><a href="#${slug}" target="_blank" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${index +
      1}. ${getName(source)}</a></h2>`;
  }

  html += `
      ${sources}
      ${curators}
      ${maintainers}
      <h4 class="spectrum-Body spectrum-Body--S cds-ReportCard-sourceURL">Data from <a href="${
        source.url
      }" class="spectrum-Link" target="_blank">${sourceURLShort}</a></h4>
      <div class="cds-ReportCard-criteria">
        <div class="cds-ReportCard-criterion">
          ${typeIcons[source.type]} Published as: ${typeNames[source.type] ||
    source.type.substr(0, 1).toUpperCase() + source.type.substr(1)}
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.timeseries ? '✅ Timeseries' : '❌ Non-timeseries'} dataset
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.aggregate ? '✅ Aggregates' : '❌ Does not aggregate'}  many localities in a single source
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.ssl ? '✅ Site uses' : '❌ Site does not use'} SSL
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.headless ? '❌ Site requires' : '✅ Site does not require'} JavaScript
        </div>
        <div class="cds-ReportCard-criterion">
          ${granular ? '✅ Granular' : '❌ Non-granular'}: ${granularity}
        </div>
      </div>
    </div>
  </li>
`;
  return html;
};
