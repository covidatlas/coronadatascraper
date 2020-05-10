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
      /* html */ `
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
      <h1 class="spectrum-Heading spectrum-Heading--XL">About COVID Atlas</h1>
      <p class="spectrum-Body spectrum-Body--L">COVID Atlas is an international team of engineers, designers, and technologists aggregating COVID-19 (aka "Coronavirus") data from official government sources and trusted data providers.</p>
      <p class="spectrum-Body spectrum-Body--L">Every piece of data collected is open, accessible in the public domain, and published in multiple formats. It is available tagged with relevant metadata such as GeoJSON, population / census information, and source citations.</p>
      <p class="spectrum-Body spectrum-Body--L">Our data is sourced exclusively from official public health channels, and verified sources.</p>

      <h1 class="spectrum-Heading spectrum-Heading--L">Built by a global community</h1>
      <p class="spectrum-Body spectrum-Body--M">The source code for the project is community-developed and <a class="spectrum-Link" href="https://github.com/covidatlas/">open-source on GitHub</a>, providing full transparency into every aspect of its functionality. We publish all data, research, and related findings in the public domain.</p>
      <p class="spectrum-Body spectrum-Body--M">If you're a developer or researcher, you can <a class="spectrum-Link" href="/data">download our raw local-level dataset</a> or <a class="spectrum-Link" href="/united-states">view it displayed on a world map</a>.</p>
      <p class="spectrum-Body spectrum-Body--M">If you'd like to contribute, please <a class="spectrum-Link" target="_blank" href="https://github.com/covidatlas/">send us a PR</a> and join us on <a class="spectrum-Link" target="_blank" href="${
        constants.slackURL
      }">Slack</a>.</p>

      <p class="spectrum-Body spectrum-Body--M">Please also find us on the social network of your choosing:</p>

      <nav class="ca-SocialLinks spectrum-Body spectrum-Body--M">
        <a class="spectrum-Link" href="https://twitter.com/covidatlas" target="_blank">Twitter</a>
        <a class="spectrum-Link" href="https://facebook.com/covidatlas" target="_blank">Facebook</a>
        <a class="spectrum-Link" href="https://instagram.com/covidatlas" target="_blank">Instagram</a>
      </nav>

      <h1 class="spectrum-Heading spectrum-Heading--XL">COVID Atlas contributors</h1>
      <p class="spectrum-Body spectrum-Body--M">COVID Atlas is built and maintained by an international collection of concerned citizens. We are deeply appreciative to every single volunteer around the world who keep COVID Atlas running.</p>
      <p class="spectrum-Body spectrum-Body--M">Below are some of the current project leads:</p>
      <ul class="spectrum-Body spectrum-Body--M">
        <li>
          <a class="spectrum-Link" href="https://twitter.com/andigalpern">Andi Galpern</a> (San Francisco, CA, US) – Design program management, content, and community
        </li>
        <li>
          <a class="spectrum-Link" href="https://camjc.com/">Cam Chamberlain</a> (Melbourne, Australia) – Data scraper lead for Asia and Oceania
        </li>
        <li>
          <a class="spectrum-Link" href="https://twitter.com/elission">Elissa Lerner</a> (New York, NY, US) – Copywriting, content, and editing
        </li>
        <li>
          <a class="spectrum-Link" href="https://www.linkedin.com/in/jzohrab">Jeff Zohrab</a> (Toronto, Ontario, CA) – Back-end development lead, Back-end onboarding lead
        </li>
        <li>
          <a class="spectrum-Link" href="https://twitter.com/lazdnet">Larry Davis</a> (San Francisco, CA, US) – Project co-lead, System architecture co-lead, Front-end lead
        </li>
        <li>
          <a class="spectrum-Link" href="https://natebaldw.in/">Nate Baldwin</a> (Salt Lake City, Utah, US) – Product design lead (interim), color schemes, style guides, UX, and UI
        </li>
        <li>
          <a class="spectrum-Link" href="https://golsteyn.com/">Quentin Golsteyn</a> (Vancouver, BC, CA) – Data quality and verification lead, data scraper lead for Europe and Africa
        </li>
        <li>
          <a class="spectrum-Link" href="https://twitter.com/ryan">Ryan Block</a> (San Francisco, CA, US) – Project co-lead and System architecture co-lead
        </li>
        <li>
          <a class="spectrum-Link" href="https://hyperknot.com/">Zsolt Ero</a> (Hungary) – Back-end development lead
        </li>
      </ul>

      <h1 class="spectrum-Heading spectrum-Heading--XL">Additional acknowledgments</h1>
      <p class="spectrum-Body spectrum-Body--M">COVID Atlas would also like to acknowledge the services provided  by our hosting partner <a class="spectrum-Link" href="https://aws.amazon.com/">Amazon AWS</a>.</p>
      <p class="spectrum-Body spectrum-Body--M">This project also exists in part thanks to <a class="spectrum-Link" href="https://adobe.com/">Adobe</a> and <a class="spectrum-Link" href="https://begin.com/">Begin</a>. These companies provided a number of our contributors the flexibility necessary to participate in building COVID Atlas.</p>
    </section>
  ${footer()}
</div>
`
    )
  };
};
