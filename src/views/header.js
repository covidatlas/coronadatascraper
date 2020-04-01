// eslint-disable-next-line
const constants = require('@architect/views/constants');

// eslint-disable-next-line
const arc = require('@architect/functions');

module.exports = function body(content = '', className = '') {
  return /* html */ `
<div class="ca-SiteHeader spectrum-Site-header ${className}">
  <sp-action-button quiet class="js-toggleMenu">
    <sp-icon slot="icon" size="s" name="ui:TripleGripper"></sp-icon>
  </sp-action-button>
  <img src="${arc.static('logo-banner-light.svg')}" class="ca-Logo ca-Logo--extrasmall" alt="${constants.name} logo">
  ${content}
</div>
`;
};
