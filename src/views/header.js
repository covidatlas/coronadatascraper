const arc = require('@architect/functions');

// eslint-disable-next-line
const constants = require('@architect/views/constants');
// eslint-disable-next-line
const search = require('@architect/views/search');

module.exports = function body(selectedPage = 'home', className = '', theme = 'dark') {
  theme = selectedPage === 'home' ? 'light' : theme;

  return /* html */ `
<div class="spectrum--${theme} ca-SiteHeader spectrum-Site-header ${className}">
  <sp-action-button quiet class="js-toggleMenu">
    <sp-icon slot="icon" size="s" name="ui:TripleGripper"></sp-icon>
  </sp-action-button>
  <a href="/" class="ca-HeaderLogo"><img src="${arc.static(
    `logo-banner-${theme}.svg`
  )}" class="ca-Logo ca-Logo--XS" alt="${constants.name} logo"></a>
  ${
    selectedPage !== 'home'
      ? `
    <div class="ca-SiteHeader-search spectrum--light">
      ${search({ label: '' })}
    </div>
  `
      : ''
  }
  <sp-tab-list selected="${selectedPage}" id="tabNav" quiet>
    <sp-tab label="Home" value="home"></sp-tab>
    <!--<sp-tab label="Map" value="map"></sp-tab>-->
    <sp-tab label="Datasets" value="data"></sp-tab>
    <sp-tab label="Sources" value="sources"></sp-tab>
    <!--<sp-tab label="Reports" value="crosscheck"></sp-tab>-->
    <sp-tab label="About" value="about"></sp-tab>
  </sp-tab-list>
</div>
`;
};
