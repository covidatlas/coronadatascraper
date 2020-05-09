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
const { getContributors, getURLFromContributor } = require('@architect/views/lib/contributors');
// eslint-disable-next-line
const { getName } = require('@architect/views/lib/geography');
// eslint-disable-next-line
const { ratingTemplate } = require('@architect/views/lib/report');

// eslint-disable-next-line
const ratings = require('./dist/ratings.json');

exports.handler = async function http() {
  let ratingHTML = '';
  for (let i = 0; i < ratings.length; i++) {
    ratingHTML += ratingTemplate(ratings[i], i);
  }

  const body = template(
    'Data sources & transparency',
    /* html */ `
${header('sources')}
<div class="spectrum-Site-content">
  ${sidebar('sources')}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--XL">Data sources & transparency</h1>
      <p class="spectrum-Body spectrum-Body--L">To create the most comprehensive COVID-19 dataset, COVID Atlas pulls information from over 150 official government health data sources and verified curated datasets from around the world.</p>
      <p class="spectrum-Body spectrum-Body--L"><strong>To encourage these official sources to improve the transparency, accessibility, and hygiene of their data, COVID Atlas publishes ratings of each source.</strong></p>

      <div class="row">
        <div class="col-xs-12 col-sm-6">
          <h2 class="spectrum-Heading spectrum-Heading--M">Ratings are about transparency, not accuracy</h2>
          <p class="spectrum-Body spectrum-Body--M">Because COVID Atlas only uses official data sources, it assumes its data is intended to be completely accurate.</p>
          <p class="spectrum-Body spectrum-Body--M">COVID Atlas source <strong>ratings are based on</strong>:</p>
          <ul class="spectrum-Body spectrum-Body--M">
            <li>
              <strong>Completeness of the data provided</strong> – this includes data points for confirmed, hospitalized, discharged, and recovered cases; fatalities; total tests administered, etc.)
            </li>
            <li>
              <strong>Data granularity</strong> – official data provided at the most local possible level (often counties /municipalities)
            </li>
            <li>
              <strong>Machine-readability</strong> – data is available in JSON or CSV, or at least HTML <tables> with one row per locality
            </li>
          </ul>
          <p class="spectrum-Body spectrum-Body--M">Source ratings are <strong>not based on</strong>:</p>
          <ul class="spectrum-Body spectrum-Body--M">
            <li>Accuracy of information – we use only official data and assume its accuracy in good faith</li>
          </ul>
        </div>
        <div class="col-xs-12 col-sm-6">
          <h2 class="spectrum-Heading spectrum-Heading--M" id="spec">Do you administer an official government health data source?</h2>
          <p class="spectrum-Body spectrum-Body--M">
            Administrators of official government health data can improve their sources for the benefit of scientists, researchers, developers, and, most importantly, the general public. Below is a brief list of ways we recommend doing so:
          </p>
          <ul class="spectrum-Body spectrum-Body--M">
            <li>
              <strong>Publish every bit of verifiable data you can</strong> – this includes cumulative or timeseries data for confirmed, hospitalized, discharged, and recovered cases; fatalities; total tests administered, etc.)
            </li>
            <li>
              <strong>Publish as granularly as possible</strong> – The most useful datasets have the highest degrees of geographical specificity, including individual columns for each locality
            </li>
            <li>
              <strong>Publish only accessible and machine-readable formats</strong> – do not publish your data in PDFs, images, and other inaccessible formats. These formats are hostile to the general public's need understand what's going on, and are in <strong>some cases illegal</strong>. Use HTML <code>&lt;table&gt;</code> with one row per locality at the most granular level you have, and if possible, also publish JSON and/or CSV formats
            </li>
          </ul>
          <p class="spectrum-Body spectrum-Body--M">We’d like to hear from you and help you make your data better! <a class="spectrum-Link" href="${
            constants.slackURL
          }" target="_blank">Please do reach out to us on Slack</a> or <a class="spectrum-Link" href="${
      constants.repoURL
    }issues">file an issue on GitHub</a></p>
        </div>
      </div>
    </section>
    ${ratingHTML}
    ${footer()}
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
