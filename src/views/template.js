const arc = require('@architect/functions');

// eslint-disable-next-line
const constants = require('@architect/views/constants');

module.exports = function body(title = constants.name, content = 'No content.', className = '') {
  return /* html */ `<!DOCTYPE html>
<html lang="en">

<head>
  <title>${title} - ${constants.name}</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no, minimum-scale=1, maximum-scale=1">
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
  <script type="text/javascript">
    window.NODE_ENV = "${constants.prod ? 'production' : 'testing'}";
  </script>

  <!-- Global site tag (gtag.js) - Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=${constants.analyticsCode}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', '${constants.analyticsCode}');
  </script>
</head>

<body class="spectrum spectrum--light spectrum--medium">
  <sp-icons-medium></sp-icons-medium>

  <div class="spectrum-Site ${className}">
    <div class="spectrum-Site-overlay"></div>
    ${content}
  </div>

  <script type="module" src="${arc.static('index.js')}"></script>
</body>
</html>
`;
};
