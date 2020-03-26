/* global document, history, Handsontable, Papa, JSONFormatter */
/* eslint no-new: "off" */
/* eslint no-restricted-globals: "off" */

import * as fetch from './lib/fetch.js';

function showFile(url, dataLevels, noPush) {
  document.body.classList.add('is-editing');

  const editor = document.querySelector('.cds-FileEditor');

  fetch.url(url, function() {
    editor.querySelector('.cds-Heading').innerText = url;

    const extension = url.split('.').pop();

    editor.querySelector('.cds-Editor-download').href = url;
    if (extension === 'json') {
      let obj;
      try {
        obj = JSON.parse(this.responseText);
      } catch (error) {
        editor.querySelector(
          '.cds-FileEditor-content'
        ).innerHTML = `<div class="cds-Error">Failed to load ${url}: ${error}</div>`;
        return;
      }
      const formatter = new JSONFormatter(obj, dataLevels || 1);

      editor.querySelector('.cds-Editor-content').innerHTML = '<div class="cds-Editor-JSON"></div>';
      editor.querySelector('.cds-Editor-content').firstElementChild.appendChild(formatter.render());
    } else {
      const parsedData = Papa.parse(this.responseText, {
        header: true,
        skipEmptyLines: true
      });

      editor.querySelector('.cds-Editor-content').innerHTML = '';
      new Handsontable(editor.querySelector('.cds-Editor-content'), {
        data: parsedData.data,
        rowHeaders: true,
        colHeaders: parsedData.meta.fields,
        columnSorting: true,
        licenseKey: 'non-commercial-and-evaluation',
        dropdownMenu: true,
        filters: true
      });
    }

    // Select menu item
    const previousItem = editor.querySelector('.spectrum-SideNav-item.is-selected');
    if (previousItem) {
      previousItem.classList.remove('is-selected');
    }

    document
      .querySelector(`a[href="${url}"]`)
      .closest('.spectrum-SideNav-item')
      .classList.add('is-selected');
  });

  if (!noPush) {
    history.pushState(null, '', `#${url}`, '');
  }
}

export default showFile;
