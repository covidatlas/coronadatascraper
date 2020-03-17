#!/bin/bash

CSSFILES="
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-global.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-darkest.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-lightest.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-dark.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-light.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-medium.css
node_modules/@adobe/spectrum-css/dist/components/vars/spectrum-large.css
node_modules/@adobe/spectrum-css/dist/components/icon/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/statuslight/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/link/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/page/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/site/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/typography/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/button/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/buttongroup/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/site/index-vars.css
node_modules/@adobe/spectrum-css/dist/components/sidenav/index-vars.css
"

mkdir -p dist/
cat ${CSSFILES[@]} > dist/spectrum-css.css
