// eslint-disable-next-line
const arc = require('@architect/functions');

module.exports = function body(content = '') {
  return /* html */ `
<div class="ca-SiteHeader spectrum-Site-header">
  <button class="spectrum-ActionButton spectrum-ActionButton--quiet js-toggleMenu">
    <span class="icon icon-menu"></span>
  </button>
  ${content}
</div>
`;
};
