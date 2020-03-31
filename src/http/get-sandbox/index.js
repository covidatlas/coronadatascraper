// eslint-disable-next-line
const template = require('@architect/views/template');

exports.handler = async function http() {
  const body = template(
    'Sandbox',
    /* html */ `
<style>
  .ca-Sandbox {
    margin: var(--spectrum-alias-grid-margin-medium) 0;
  }
  .ca-Sandbox-example {
    margin-top: var(--spectrum-alias-grid-margin-small);

    background-color: var(--spectrum-alias-background-color-default);

    border: 1px solid var(--spectrum-global-color-gray-200);
    border-radius: var(--spectrum-alias-border-radius-regular);

    padding: var(--spectrum-global-dimension-size-250);
  }

</style>

<div class="ca-Page">

  <div class="ca-Sandbox">
    <h1 class="ca-Sandbox-heading spectrum-Heading spectrum-Heading--M">Typography</h1>
    <div class="ca-Sandbox-example">
      <h1 class="spectrum-Heading spectrum-Heading--L">Heading L</h1>
      <h1 class="spectrum-Heading spectrum-Heading--M">Heading mL</h1>
      <p class="spectrum-Body spectrum-Body--L">Body L</p>
      <p class="spectrum-Body spectrum-Body--L">Body M</p>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Link</h1>
    <div class="ca-Sandbox-example">
      <a href="#" class="spectrum-Link">Link</a>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Pill Buttons</h1>
    <div class="ca-Sandbox-example">
      <sp-button variant="primary">Primary</sp-button>
      <sp-button variant="secondary">Secondary</sp-button>
      <sp-button>CTA</sp-button>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Action Button</h1>
    <div class="ca-Sandbox-example">
      <sp-action-button>Do action</sp-action-button>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Textfield</h1>
    <div class="ca-Sandbox-example">
      <sp-textfield placeholder="Enter your name"></sp-textfield>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Sidenav</h1>
    <div class="ca-Sandbox-example">
      <sp-sidenav defaultValue="map">
        <sp-sidenav-item
            value="map"
            label="World Map"
            href="/map"
        ></sp-sidenav-item>
        <sp-sidenav-item
            value="about"
            label="About"
            href="/about"
        ></sp-sidenav-item>
      </sp-sidenav>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Search</h1>
    <div class="ca-Sandbox-example">
      <sp-search></sp-search>
    </div>
  </div>

  <div class="ca-Sandbox">
    <h1 class="spectrum-Heading spectrum-Heading--M">Dropdown</h1>
    <div class="ca-Sandbox-example">
      <sp-dropdown
          label="Action"
      >
          <sp-menu>
              <sp-menu-item>
                  Deselect
              </sp-menu-item>
              <sp-menu-item>
                  Select inverse
              </sp-menu-item>
              <sp-menu-item>
                  Feather...
              </sp-menu-item>
              <sp-menu-item>
                  Select and mask...
              </sp-menu-item>
              <sp-menu-divider></sp-menu-divider>
              <sp-menu-item>
                  Save selection
              </sp-menu-item>
              <sp-menu-item disabled>
                  Make work path
              </sp-menu-item>
          </sp-menu>
      </sp-dropdown>
    </div>
  </div>

</div>
`
  );
  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body
  };
};
