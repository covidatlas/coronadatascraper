const arc = require('@architect/functions');

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
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: template(
      'About',
      `
${header('about')}

<div class="spectrum-Site-content">
  ${sidebar('about')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

      <div class="ca-Hero">
        <div class="ca-Logo">
          <img src="${arc.static('logo-banner-light.svg')}" alt="${constants.name}">
        </div>
      </div>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--XL">About the project</h1>
      <p class="spectrum-Body spectrum-Body--L">${
        constants.name
      } provides easy to understand local-level data – including local charts, maps, and insights – related to the COVID-19 pandemic.</p>
      <p class="spectrum-Body spectrum-Body--L">Our data is sourced exclusively from official public health channels, and verified sources.</p>

      <h1 class="spectrum-Heading spectrum-Heading--XL">Built by a global community</h1>
      <p class="spectrum-Body spectrum-Body--L">This project is <a class="spectrum-Link" href="https://github.com/covidatlas/coronadatascraper/">community-developed, open source</a>, and publishes all data, research, and related findings in the public domain.</p>
      <p class="spectrum-Body spectrum-Body--L">We're working around the clock to release ${
        constants.name
      }; in the mean time, if you're a developer or researcher, you can <a class="spectrum-Link" href="https://coronadatascraper.com/data.csv"></a>download our raw local-level dataset</a> or <a class="spectrum-Link" href="https://coronadatascraper.com/features.json">view it displayed on a world map</a>.</p>
      <p class="spectrum-Body spectrum-Body--L">If you'd like to contribute, please <a class="spectrum-Link" href="https://github.com/covidatlas/coronadatascraper/">send us a PR</a> and join us on <a class="spectrum-Link" href="https://join.slack.com/t/covid-atlas/shared_invite/zt-d6j8q1lw-C4t00WbmIjoxeHgxn_GDPQ">Slack</a>.</p>

      <p class="spectrum-Body spectrum-Body--L">Please check back for updates!</p>

      <nav class="ca-SocialLinks spectrum-Body spectrum-Body--L">
        <a class="spectrum-Link" href="https://twitter.com/covidatlas" target="_blank">Twitter</a>
        <a class="spectrum-Link" href="https://facebook.com/covidatlas" target="_blank">Facebook</a>
        <a class="spectrum-Link" href="https://instagram.com/covidatlas" target="_blank">Instagram</a>
      </nav>
    </section>

  ${footer()}
</div>

`
    )
  };
};
