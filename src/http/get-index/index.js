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
// eslint-disable-next-line
const search = require('@architect/views/search');

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

    <div class="ca-Landing spectrum--dark" style="background-image: url('${arc.static('logo-outlined.svg')}');">
      <h1 class="spectrum-Heading spectrum-Heading--XXL">COVID Atlas collects local data from around the world into one resource.</h1>
      <div class="ca-Landing-search spectrum--large">
        ${search()}
      </div>
    </div>

    <div class="row">
      <section class="ca-Section col-xs-12 col-sm-4">
        <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Location.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Local official COVID-19 resources</h1>
        <p class="spectrum-Body spectrum-Body--M">COVID Atlas scrapes public data from local resources.</p>
      </section>

      <section class="ca-Section col-xs-12 col-sm-4">
        <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Calendar.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Updated daily</h1>
        <p class="spectrum-Body spectrum-Body--M">Our data updates daily at 9PM PST so you can access the most recent data available.</p>
      </section>

      <section class="ca-Section col-xs-12 col-sm-4">
      <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Community.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Built by a community</h1>
        <p class="spectrum-Body spectrum-Body--M">COVID Atlas is entirely open-source, built by a community of people concerned with all the same things you are.</p>
        <p class="spectrum-Body spectrum-Body--M">We're all in this together.</p>
      </section>
    </div>
    <hr>

    <section class="ca-Section ca-Download">
      <h1 class="spectrum-Heading spectrum-Heading--L">Data available for download</h1>
      <p class="spectrum-Body spectrum-Body--M">Use our local worldwide COVID-19 data for yourself.</p>
      <sp-button href="/data">View datasets</sp-button>
    </section>
    ${footer()}

  </div>
</div>
`,
      'ca-Home'
    )
  };
};
