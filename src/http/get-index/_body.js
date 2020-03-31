// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const template = require('@architect/views/template');
const arc = require('@architect/functions');

module.exports = function body() {
  const { name } = constants;

  return template(
    name,
    /* html */ `
  <div class="spectrum-Site">
    <div class="spectrum-Site-overlay"></div>

    <div class="ca-SiteHeader spectrum-Site-header">
      <button class="spectrum-ActionButton spectrum-ActionButton--quiet js-toggleMenu">
        <span class="icon icon-menu"></span>
      </button>
    </div>

    <div class="spectrum-Site-content">
      <div class="ca-Sidebar spectrum-Site-sideBar">
        <a class="spectrum-Site-sideBarHeader" href="/">
          <img src="${arc.static('logo-banner-light.svg')}" class="ca-Logo--small" alt="${name} logo">
        </a>

        <div class="u-scrollable spectrum-Site-nav">
          <sp-sidenav defaultValue="map">
            <sp-sidenav-item
                value="map"
                label="World Map"
                href="/map"
            ></sp-sidenav-item>
            <sp-sidenav-item
                value="data"
                label="Datasets"
                href="/data"
            ></sp-sidenav-item>
            <sp-sidenav-item
                value="sources"
                label="Sources"
                href="/sources"
            ></sp-sidenav-item>
            <sp-sidenav-item
                value="crosscheck"
                label="Cross-check Reports"
                href="/crosscheck"
            ></sp-sidenav-item>
            <sp-sidenav-item
                value="about"
                label="About"
                href="/about"
            ></sp-sidenav-item>
          </sp-sidenav>
        </div>
      </div>

      <div class="spectrum-Site-mainContainer spectrum-Typography">

        <div class="spectrum-Site-page">
          <div class="ca-Header">
            <div class="ca-Logo">
              <img src="${arc.static('logo-banner-light.svg')}" alt="${name}">
            </div>
          </div>

          <h1 class="spectrum-Heading spectrum-Heading--XL">About the project</h1>
          <p class="spectrum-Body spectrum-Body--L">${name} provides easy to understand local-level data – including local charts, maps, and insights – related to the COVID-19 pandemic.</p>
          <p class="spectrum-Body spectrum-Body--L">Our data is sourced exclusively from official public health channels, and verified sources.</p>

          <h1 class="spectrum-Heading spectrum-Heading--XL">Built by a global community</h1>
          <p class="spectrum-Body spectrum-Body--L">This project is <a class="spectrum-Link" href="https://github.com/covidatlas/coronadatascraper/">community-developed, open source</a>, and publishes all data, research, and related findings in the public domain.</p>
          <p class="spectrum-Body spectrum-Body--L">We're working around the clock to release ${name}; in the mean time, if you're a developer or researcher, you can <a class="spectrum-Link" href="https://coronadatascraper.com/data.csv"></a>download our raw local-level dataset</a> or <a class="spectrum-Link" href="https://coronadatascraper.com/features.json">view it displayed on a world map</a>.</p>
          <p class="spectrum-Body spectrum-Body--L">If you'd like to contribute, please <a class="spectrum-Link" href="https://github.com/covidatlas/coronadatascraper/">send us a PR</a> and join us on <a class="spectrum-Link" href="https://join.slack.com/t/covid-atlas/shared_invite/zt-d6j8q1lw-C4t00WbmIjoxeHgxn_GDPQ">Slack</a>.</p>

          <p class="spectrum-Body spectrum-Body--L">Please check back for updates!</p>

        </section>

        <footer class="ca-Footer">
          <nav class="ca-SocialLinks spectrum-Body spectrum-Body--L">
            <a class="spectrum-Link" href="https://twitter.com/covidatlas" target="_blank">Twitter</a>
            <a class="spectrum-Link" href="https://facebook.com/covidatlas" target="_blank">Facebook</a>
            <a class="spectrum-Link" href="https://instagram.com/covidatlas" target="_blank">Instagram</a>
          </nav>
        </footer>
      </div>

    </div>
`
  );
};
