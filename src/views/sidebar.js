const arc = require('@architect/functions');

// eslint-disable-next-line
const constants = require('@architect/views/constants');

module.exports = function body(selectedPage = 'home', className = '') {
  return /* html */ `
<div class="ca-Sidebar spectrum-Site-sideBar ${className}">
  <a class="spectrum-Site-sideBarHeader" href="/">
    <img src="${arc.static('logo-banner-light.svg')}" class="ca-Logo--S" alt="${constants.name} logo">
  </a>

  <div class="u-scrollable spectrum-Site-nav">
    <sp-sidenav value="${selectedPage}">
      <sp-sidenav-item
          value="home"
          label="Home"
          href="/"
      ></sp-sidenav-item>
      <!--<sp-sidenav-item
          value="map"
          label="Map"
          href="/map"
      ></sp-sidenav-item>-->
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
      <!--<sp-sidenav-item
          value="crosscheck"
          label="Reports"
          href="/crosscheck"
      ></sp-sidenav-item>-->
      <sp-sidenav-item
          value="about"
          label="About"
          href="/about"
      ></sp-sidenav-item>
    </sp-sidenav>
    <sp-sidenav>
      <sp-sidenav-item
          value="github"
          label="Github"
          href="${constants.repoURL}"
          target="_blank"
      ></sp-sidenav-item>
    </sp-sidenav>
  </div>
</div>
`;
};
