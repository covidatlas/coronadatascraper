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
      /* html */ `
${header('home' /* 'ca-SiteHeader--dark spectrum--dark' */)}

<div class="spectrum-Site-content">
  ${sidebar('home')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <div class="ca-Landing spectrum--dark" style="background-image: url('${arc.static(
      'logo-outlined.svg'
    )}'), linear-gradient(123deg, rgba(49,53,113,1) 0%, rgba(30,10,67,1) 100%)">
      <h1 class="spectrum-Heading spectrum-Heading--XXL">The most comprehensive source of local COVID-19 (Coronavirus) outbreak information</h1>
      <div class="ca-Landing-search spectrum--large">
        ${search()}
      </div>
    </div>

    <div class="ca-Section row">
      <section class="ca-SubSection col-xs-12 col-sm-4">
        <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Location.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Local, official COVID-19 resources</h1>
        <p class="spectrum-Body spectrum-Body--M">COVID Atlas aggregates local, public case information provided by hospitals, health departments, and other trusted resources</p>
      </section>

      <section class="ca-SubSection col-xs-12 col-sm-4">
        <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Calendar.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Updated constantly</h1>
        <p class="spectrum-Body spectrum-Body--M">Our data is updated thousands of times per day to ensure you have access to the most recent information available</p>
      </section>

      <section class="ca-SubSection col-xs-12 col-sm-4">
      <img class="ca-Section-Image" src="${arc.static('icons/COVID_Atlas_Icons_Community.svg')}"/>
        <h1 class="spectrum-Heading spectrum-Heading--M">Built by a community</h1>
        <p class="spectrum-Body spectrum-Body--M">COVID Atlas is <a class="spectrum-Link" href="https://github.com/covidatlas">open-source</a> and built by a <a class="spectrum-Link" href="https://join.slack.com/t/covid-atlas/shared_invite/zt-d6j8q1lw-C4t00WbmIjoxeHgxn_GDPQ">community of volunteers</a> concerned with the same things that you are</p>
      </section>
    </div>
    <hr>

    <section class="ca-Section ca-Download">
      <h1 class="spectrum-Heading spectrum-Heading--L">Download the data</h1>
      <p class="spectrum-Body spectrum-Body--M">Public data means public use. Access our comprehensive local worldwide COVID-19 datasets in JSON and CSV</p>
      <sp-button href="/data">Explore datasets</sp-button>
    </section>
    ${footer()}

  </div>
</div>
`,
      'ca-Home'
    )
  };
};
