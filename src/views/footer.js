// eslint-disable-next-line
const constants = require('@architect/views/constants');

module.exports = function body(content = '', className = '') {
  return /* html */ `
<footer class="spectrum--dark ca-SiteFooter ${className}">
  <div class="row">
    <div class="col-xs-12 col-lg-8">
      <div class="row">
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS">See an error?</h6>
          <p class="spectrum-Body spectrum-Body--XS">
            Report errors on <a class="spectrum-Link" href="${constants.issueURL}">GitHub</a>.
          </p>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS"><a class="spectrum-Link spectrum-Link--silent" href="/data">Datasets</a></h6>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS"><a class="spectrum-Link spectrum-Link--silent" href="/sources">Sources</a></h6>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS"><a class="spectrum-Link spectrum-Link--silent" href="/about">About</a></h6>
        </div>
      </div>
    </div>
    <div class="col-xs-12 col-lg-4 ca-SiteFooter-Disclaimer">
      <p class="spectrum-Body spectrum-Body--XS">
        ${constants.disclaimer}
      </p>
    </div>
  </div>
  ${content}
</footer>
`;
};
