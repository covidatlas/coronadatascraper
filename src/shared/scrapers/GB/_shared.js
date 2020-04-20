import gssCodes from './gss-codes.json';

// GSS code to ISO code in Wikidata: https://w.wiki/MQ3

// eslint-disable-next-line import/prefer-default-export
export async function gssCodeMap() {
  const codeMap = {};
  for (const row of gssCodes) {
    const { isoCode, gss } = row;
    codeMap[gss] = isoCode;
  }
  // custom code for Bournemouth, Christchurch and Poole
  codeMap.E06000058 = 'GB-XBCP';
  return codeMap;
}
