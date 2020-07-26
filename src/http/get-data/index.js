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

exports.handler = async function http() {
  function rptLink(report) {
    const baseURL = 'https://liproduction-reportsbucket-bhk8fnhv1s76.s3-us-west-1.amazonaws.com/v1/latest';
    const href = `${baseURL}/${report}`;
    return `<li><a href="${href}" target="_blank">${report}</a></li>`;
  }

  const latestLinks = ['latest.json', 'latest.csv'].map(rptLink).join('');
  const timeseriesLinks = [
    'timeseries-byLocation.json',
    'timeseries-jhu.csv',
    'timeseries-tidy-small.csv',
    'timeseries.csv'
  ]
    .map(rptLink)
    .join('');
  const locationLinks = ['locations.json', 'locations.csv', 'features.json'].map(rptLink).join('');

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: template(
      'Datasets',
      /* html */ `
${header('data' /* 'ca-SiteHeader--dark spectrum--dark' */)}

<div class="spectrum-Site-content">
  ${sidebar('data')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <div class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--XL">COVID Atlas datasets</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas crawls and aggregates data from official local and national government sources, in addition to data curated by academic institutions, reputable journalists, and other verified sources.</p>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas data is de-duplicated, cross-checked against other sources, and annotated with population data and GeoJSON features. Currently, COVID Atlas crawls and aggregates data from over 150 sources, <strong>covering more 500 states and regions, 3000 counties, and municipalities, and 190 countries</strong>.</p>
      <p class="spectrum-Body spectrum-Body--L">The consolidated, multi-format dataset of granular COVID-19 case information is available in the public domain for anyone to view, download, or access via an API.</p>
      <p class="spectrum-Body spectrum-Body--L">We encourage scientists, researchers, developers, journalists, and anyone else to analyze this dataset, use it to create models and projections, create visualizations, or identify errors and missing data.</p>

    <div class="ca-Section row">

      <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
        <h1 class="spectrum-Heading spectrum-Heading--M">Latest: Global daily totals</h1>
        <p class="spectrum-Body spectrum-Body--M">A point-in-time snapshot of worldwide COVID-19 data (updated daily)</p>
      </section>

      <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
        <h1 class="spectrum-Heading spectrum-Heading--M">Timeseries: Global timeseries</h1>
        <p class="spectrum-Body spectrum-Body--M">Worldwide COVID-19 data in timeseries format (starting at 2020-01-22)</p>
      </section>

      <section class="ca-SubSection col-xs-12 col-sm-6 col-md-4">
        <h1 class="spectrum-Heading spectrum-Heading--M">Locations: Metadata and GeoJSON features</h1>
        <p class="spectrum-Body spectrum-Body--M">GeoJSON features for all locations found in our dataset, useful for building map visualizations</p>
      </section>
    </div>

      <hr>

      <p class="spectrum-Body spectrum-Body--M">Documentation for the reports is available <a href="https://github.com/covidatlas/li/blob/master/docs/reports-v1.md">on GitHub.</a></p>

      <h1>V1</h1>

<h2>Latest</h2>
<ul>${latestLinks}</ul>
<h2>Timeseries</h2>
<ul>${timeseriesLinks}</ul>
<h2>Locations</h2>
<ul>${locationLinks}</ul>

</div>

    ${footer()}
  </div>
</div>
`,
      'ca-Datasets'
    )
  };
};
