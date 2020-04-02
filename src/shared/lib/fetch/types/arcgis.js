import json from './json.js';

/**
 * Open the arcgis iframe and look in the Network/XHR tab for requests with Name of "0".
 *
 * Like this one:
 * https://services7.arcgis.com/4RQmZZ0yaZkGR1zy/arcgis/rest/services/COVID19_testsites_READ_ONLY/FeatureServer/0?f=json
 *
 * serverNumber is 7, from services7.arcgis.com
 * orgId is 4RQmZZ0yaZkGR1zy
 * layerName is COVID19_testsites_READ_ONLY
 */
export const getArcGISCSVURLFromOrgId = async function(serverNumber, orgId, layerName) {
  const layerMetadata = await json(
    `https://services${serverNumber}.arcgis.com/${orgId}/arcgis/rest/services/${layerName}/FeatureServer/0?f=json`
  );
  const { serviceItemId } = layerMetadata;
  return `https://opendata.arcgis.com/datasets/${serviceItemId}_0.csv`;
};

/**
 * Get the URL for the CSV data from an ArcGIS dashboard
 * @param {*} serverNumber the servern number, find this by looking at requests (i.e. https://services1.arcgis.com/ is serverNumber = 1)
 * @param {*} dashboardId the ID of the dashboard, as passed to the iframe that renders it (i.e. https://maps.arcgis.com/apps/opsdashboard/index.html#/ec4bffd48f7e495182226eee7962b422 is dashboardId = ec4bffd48f7e495182226eee7962b422)
 * @param {*} layerName the name of the layer to fetch data for, find this by examining requests
 */
export const getArcGISCSVURL = async function(serverNumber, dashboardId, layerName) {
  const dashboardManifest = await json(`https://maps.arcgis.com/sharing/rest/content/items/${dashboardId}?f=json`);
  const { orgId } = dashboardManifest;
  return getArcGISCSVURLFromOrgId(serverNumber, orgId, layerName);
};
