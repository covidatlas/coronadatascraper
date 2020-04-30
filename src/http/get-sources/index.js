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
    'Sources',
    `
${header('sources')}
<div class="spectrum-Site-content">
  ${sidebar('sources')}
  <div class="spectrum-Site-mainContainer spectrum-Typography">
    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--XL">Sources</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas pulls information from a variety of openly available world government data sources and curated datasets.</p>

      <div class="row">
        <div class="col-xs-12 col-sm-6">
          <h2 class="spectrum-Heading spectrum-Heading--M">Ratings have nothing to do with the accuracy of the data</h2>
          <p class="spectrum-Body spectrum-Body--M">The ratings for the data sources here are based on how machine-readable, complete, and granular their data is — not on the accuracy or reliability of the information. We’re using a rating system like this because we’re trying to make governments more accountable for their data practices.</p>
          <p class="spectrum-Body spectrum-Body--M"><a class="spectrum-Link" href="${
            constants.repoURL
          }blob/master/src/events/crawler/tasks/scrapeData/rateLocations.js" target="_blank">Take a look at the code</a> to learn more about how the rating system works.</p>
        </div>
        <div class="col-xs-12 col-sm-6">
          <h2 class="spectrum-Heading spectrum-Heading--M" id="spec">What does a good source look like?</h2>
          <p class="spectrum-Body spectrum-Body--M">
            First, please have a look at our <a href="example.csv" download class="spectrum-Link">example format</a>.
          </p>
          <p class="spectrum-Body spectrum-Body--M">
            As the data itself is most important, please publish <em>cumulative</em> counts for cases, deaths, hospitalized, discharged, recovered, and total tests administered.
          </p>
          <p class="spectrum-Body spectrum-Body--M">
            If you cannot publish in JSON or CSV, at a minimum, please include a HTML <code>&lt;table&gt;</code> with one row per locality at the most granular level you have.
          </p>
          <p class="spectrum-Body spectrum-Body--M">
            Have a column for the name of this locality, and a column for each additional data point.
          </p>
          <p class="spectrum-Body spectrum-Body--M">
            The best published sources include timestamps, allowing citizens and researchers alike better understand the data you have, over time, within your specific geographic region(s).
          </p>
        </div>
        <div class="col-xs-12">
          <h2 class="spectrum-Heading spectrum-Heading--M">Questions about a source’s rating?</h2>
          <p class="spectrum-Body spectrum-Body--M">We’d like to hear from you and help you make your source more complete. <a class="spectrum-Link" href="https://join.slack.com/t/sars-cov-2covid-19/shared_invite/zt-cr6ln0ph-6eDATfSUNDtFK3mlQxqYKw" target="_blank">Reach out to us on on Slack</a> or <a class="spectrum-Link" href="${
            constants.repoURL
          }issues">file an issue on Github</a>.</p>
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
