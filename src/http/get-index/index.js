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
      'Home',
      `
${header('home' /* 'ca-SiteHeader--dark spectrum--dark' */)}

<div class="spectrum-Site-content">
  ${sidebar('home')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <div class="ca-Landing">
      <div class="ca-Logo ca-Landing-logo">
        <img src="${arc.static('logo-banner-dark.svg')}" alt="${constants.name}">
      </div>

      <div class="ca-Landing-search" id="searchContainer">
        <label class="spectrum-ComboField spectrum--large">
          <div class="spectrum-ComboField-label">
            Search by county, state, or country name
          </div>
          <sp-search id="searchField" autocomplete="off"></sp-search>
          <sp-button id="searchButton" type="submit" hidden>Go</sp-button>
        </label>
        <sp-popover class="sp-Landing-searchResults" id="searchPopover" placement="bottom" open>
          <sp-menu id="searchResults">
          </sp-menu>
        </sp-popover>
      </div>
    </div>

    <div class="row">
      <section class="ca-Section col-xs-12 col-sm-4">
        <h1 class="spectrum-Heading spectrum-Heading--L">Local official COVID-19 resources</h1>
        <p class="spectrum-Body spectrum-Body--L">COVID Atlas scrapes public data from local resources.</p>
      </section>

      <section class="ca-Section col-xs-12 col-sm-4">
        <h1 class="spectrum-Heading spectrum-Heading--L">Updated daily</h1>
        <p class="spectrum-Body spectrum-Body--L">Our data updates daily at 9PM PST so you can access the most recent data available.</p>
      </section>

      <section class="ca-Section col-xs-12 col-sm-4">
        <h1 class="spectrum-Heading spectrum-Heading--L">Built by a community</h1>
        <p class="spectrum-Body spectrum-Body--L">COVID Atlas is entirely open-source, built by a community of people concerned with all the same things you are.</p>
        <p class="spectrum-Body spectrum-Body--L">We're all in this together.</p>
      </section>
    </div>
    <hr>

    <section class="ca-Section ca-Download">
      <h1 class="spectrum-Heading spectrum-Heading--L">Data available for download</h1>
      <sp-button href="/data">Download</sp-button>
    </section>
    ${footer()}

  </div>
</div>

<script src="${arc.static('home.js')}" type="module"></script>
`,
      'ca-Home'
    )
  };
};
