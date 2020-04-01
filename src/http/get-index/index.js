const arc = require('@architect/functions');

// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
// eslint-disable-next-line
const header = require('@architect/views/header');
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
${header('' /* 'ca-SiteHeader--dark spectrum--dark' */)}

<div class="spectrum-Site-content">
  ${sidebar('home')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <div class="ca-Landing">
      <div class="ca-Logo ca-Landing-logo">
        <img src="${arc.static('logo-banner-dark.svg')}" alt="${constants.name}">
      </div>

      <div class="ca-Landing-search">
        <sp-textfield placeholder="Zip code, location"></sp-textfield>
      </div>
    </div>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Local official COVID-19 Resources</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas scrapes public data from local resources.</p>
    </section>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Updated Daily</h1>
      <p class="spectrum-Body spectrum-Body--L">Our data updates daily at 9PM PST so you can access the most recent data available.</p>
    </section>

    <section class="ca-Section">
      <h1 class="spectrum-Heading spectrum-Heading--L">Built by a community</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas is entirely open-source, built by a community of people concerned with all the same things you are.</p>
      <p class="spectrum-Body spectrum-Body--L">We're all in this together.</p>
    </section>

    <hr>

    <section class="ca-Section ca-Download">
      <h1 class="spectrum-Heading spectrum-Heading--L">Data available for download</h1>
      <sp-button href="/data">Download</sp-button>
    </section>

  </div>

</div>
`,
      'ca-Home'
    )
  };
};
