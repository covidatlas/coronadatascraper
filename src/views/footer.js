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
            Report an error via <a class="spectrum-Link" href="#">GitHub issues</a>.
          </p>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS">Datasets</h6>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS">Sources</h6>
        </div>
        <div class="col-xs-12 col-md">
          <h6 class="spectrum-Heading spectrum-Heading--XS">About</h6>
        </div>
      </div>
    </div>
    <div class="col-xs-12 col-lg-4 ca-SiteFooter-Disclaimer">
      <p class="spectrum-Body spectrum-Body--XS">
        COVID Atlas is for informational purposes only and does not offer any medical advice. Data quality and accuracy is subject to local government sources. Contact your local officials with questions about the data.
      </p>
    </div>
  </div>
  ${content}
</footer>
`;
};
