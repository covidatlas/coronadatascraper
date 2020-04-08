// eslint-disable-next-line
const constants = require('@architect/views/constants');

// eslint-disable-next-line
const arc = require('@architect/functions');

module.exports = function body(selectedPage = 'home', className = '') {
  return /* html */ `
<div class="ca-SiteHeader spectrum-Site-header ${className}">
  <sp-action-button quiet class="js-toggleMenu">
    <sp-icon slot="icon" size="s" name="ui:TripleGripper"></sp-icon>
  </sp-action-button>
  <img src="${arc.static('logo-banner-light.svg')}" class="ca-Logo ca-Logo--extrasmall" alt="${constants.name} logo">
  <sp-tab-list selected="${selectedPage}">
    <sp-tab label="Home" value="home" tabindex="1"></sp-tab>
    <sp-tab label="Map" value="map" tabindex="2"></sp-tab>
    <sp-tab label="Datasets" value="data" tabindex="3"></sp-tab>
    <sp-tab label="Sources" value="sources" tabindex="4"></sp-tab>
    <sp-tab label="Reports" value="crosscheck" tabindex="5"></sp-tab>
    <sp-tab label="About" value="about" tabindex="6"></sp-tab>
  </sp-tab-list>
</div>
`;
};
