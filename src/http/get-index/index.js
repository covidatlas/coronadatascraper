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
      'About',
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

  </div>

</div>
`,
      'ca-Home'
    )
  };
};
