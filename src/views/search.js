module.exports = function(data = { label: 'Search data by county, state, or country name' }) {
  let html = `
<div id="searchContainer">
  <label class="spectrum-ComboField">`;

  if (data.label) {
    html += `
        <div class="spectrum-ComboField-label">
          ${data.label}
        </div>`;
  }
  html += `
    <div class="spectrum--light spectrum-ComboField-field">
      <sp-search id="searchField" autocomplete="off"></sp-search>
      <sp-button id="searchButton" type="submit" hidden>Go</sp-button>
    </div>
  </label>
  <sp-popover class="sp-SearchResults" id="searchPopover" placement="bottom" open>
    <sp-menu id="searchResults">
    </sp-menu>
  </sp-popover>
</div>
`;
  return html;
};
