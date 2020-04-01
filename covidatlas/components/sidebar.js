/* globals document */

let sidebar;
let overlay;

export function open() {
  sidebar.classList.add('is-open');
  overlay.classList.add('is-open');
}

export function close() {
  sidebar.classList.remove('is-open');
  overlay.classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', function() {
  sidebar = document.querySelector('.spectrum-Site-sideBar');
  overlay = document.querySelector('.spectrum-Site-overlay');
});

document.addEventListener('click', function(evt) {
  const shouldOpenSidebar = evt.target.closest('.js-toggleMenu');
  if (shouldOpenSidebar) {
    open();
  }

  const shouldCloseSidebar = evt.target.closest('.spectrum-Site-overlay');
  if (shouldCloseSidebar) {
    close();
  }
});
