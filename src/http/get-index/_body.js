// I'm getting super sick of these linting rules tbh
// eslint-disable-next-line
const constants = require('@architect/views/constants');
const arc = require('@architect/functions');

module.exports = function body() {
  const { name } = constants;

  return /* html */ `<!DOCTYPE html>
<html lang="en">

<head>
  <title>${name}</title>
  <meta charset="utf-8">
  <meta name="viewport"
    content="width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1, maximum-scale=1">
  <link rel="icon" type="image/png" sizes="192x192" href="${arc.static('favicon/android-icon-192x192.png')}">
  <link rel="icon" type="image/png" sizes="32x32" href="${arc.static('favicon/favicon-32x32.png')}">
  <link rel="icon" type="image/png" sizes="96x96" href="${arc.static('favicon/favicon-96x96.png')}">
  <link rel="icon" type="image/png" sizes="16x16" href="${arc.static('favicon/favicon-16x16.png')}">
  <link rel="apple-touch-icon" sizes="57x57" href="${arc.static('favicon/apple-icon-57x57.png')}">
  <link rel="apple-touch-icon" sizes="60x60" href="${arc.static('favicon/apple-icon-60x60.png')}">
  <link rel="apple-touch-icon" sizes="72x72" href="${arc.static('favicon/apple-icon-72x72.png')}">
  <link rel="apple-touch-icon" sizes="76x76" href="${arc.static('favicon/apple-icon-76x76.png')}">
  <link rel="apple-touch-icon" sizes="114x114" href="${arc.static('favicon/apple-icon-114x114.png')}">
  <link rel="apple-touch-icon" sizes="120x120" href="${arc.static('favicon/apple-icon-120x120.png')}">
  <link rel="apple-touch-icon" sizes="144x144" href="${arc.static('favicon/apple-icon-144x144.png')}">
  <link rel="apple-touch-icon" sizes="152x152" href="${arc.static('favicon/apple-icon-152x152.png')}">
  <link rel="apple-touch-icon" sizes="180x180" href="${arc.static('favicon/apple-icon-180x180.png')}">
  <link rel="shortcut icon" href="${arc.static('favicon/favicon.ico')}">
  <!-- <link rel="manifest" href="${arc.static('favicon/manifest.json')}"> -->
  <meta name="msapplication-TileImage" content="${arc.static('favicon/ms-icon-144x144.png')}">

  <link rel="stylesheet" href="${arc.static('index.css')}">
  <script src="${arc.static('index.js')}"></script>
</head>

<body class="spectrum spectrum--light spectrum--medium">

  <section class="ca-Page spectrum-Typography">

    <div class="ca-Header">
      <div class="ca-Logo">
        <img src="${arc.static('logo.svg')}" alt="COVID Atlas">
      </div>
    </div>

    <h1 class="spectrum-Heading spectrum-Heading--XL">About the project</h1>
    <p class="spectrum-Body spectrum-Body--L">COVID Atlas provides easy to understand local-level data – including local charts, maps, and insights – related to the COVID-19 pandemic.</p>
    <p class="spectrum-Body spectrum-Body--L">Our data is sourced exclusively from official public health channels, and verified sources.</p>

    <h1 class="spectrum-Heading spectrum-Heading--XL">Built by a global community</h1>
    <p class="spectrum-Body spectrum-Body--L">This project is <a class="spectrum-Link" href="https://github.com/covidatlas/coronadatascraper/">community-developed, open source</a>, and publishes all data, research, and related findings in the public domain.</p>
    <p class="spectrum-Body spectrum-Body--L">We're working around the clock to release COVID Atlas; in the mean time, if you're a developer or researcher, you can <a class="spectrum-Link" href="https://coronadatascraper.com/data.csv"></a>download our raw local-level dataset</a> or <a class="spectrum-Link" href="https://coronadatascraper.com/features.json">view it displayed on a world map</a>.</p>
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

</body>
</html>
`;
};
