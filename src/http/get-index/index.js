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
${header()}

<div class="spectrum-Site-content">
  ${sidebar('home')}

  <div class="spectrum-Site-mainContainer spectrum-Typography">

    <div class="spectrum-Site-page">
      <div class="ca-Hero">
        <div class="ca-Logo">
          <img src="${arc.static('logo-banner-light.svg')}" alt="${constants.name}">
        </div>
      </div>

      <sp-textfield placeholder="Zip code, location"></sp-textfield>

    </section>

  </div>

</div>
`
    )
  };
};
