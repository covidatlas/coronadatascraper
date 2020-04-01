// eslint-disable-next-line
const arc = require('@architect/functions');

module.exports = function body(content = '', className = '') {
  return /* html */ `
<div class="ca-SiteHeader spectrum-Site-header ${className}">
  <sp-action-button variant="quiet" class="js-toggleMenu">
    <sp-icon slot="icon" size="s" name="ui:TripleGripper"></sp-icon>
  </sp-action-button>
  ${content}
</div>
`;
};
