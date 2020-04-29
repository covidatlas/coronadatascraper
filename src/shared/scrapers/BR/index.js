import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
// import * as datetime from '../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'iso1:BR',
  type: 'list',
  priority: 1,
  sources: [
    {
      description: 'Secretaria de Vigilância em Saúde do Ministério da Saúde',
      name: 'SVS-MS',
      url: 'https://covid.saude.gov.br/'
    }
  ],
  url: `https://covid.saude.gov.br/`,
  timeseries: true,
  maintainers: [
    {
      name: 'Felipe Roberto',
      email: 'contato@feliperoberto.com.br',
      url: 'http://feliperoberto.com.br',
      github: 'feliperoberto',
      country: 'iso1:BR',
      flag: '🇧🇷'
    }
  ],
  _ufs: {
    Acre: ['iso2:BR-AC', 881935, [-9.0238, -70.812]],
    Alagoas: ['iso2:BR-AL', 3337357, [-9.5713, -36.782]],
    Amapá: ['iso2:BR-AP', 845731, [0.902, -52.003]],
    Amazonas: ['iso2:BR-AM', 4144597, [-3.4168, -65.8561]],
    Bahia: ['iso2:BR-BA', 14873064, [-12.5797, -41.7007]],
    Ceará: ['iso2:BR-CE', 9132078, [-5.4984, -39.3206]],
    'Distrito Federal': ['iso2:BR-DF', 3015268, [-15.7998, -47.8645]],
    'Espírito Santo': ['iso2:BR-ES', 4018650, [-19.1834, -40.3089]],
    Goiás: ['iso2:BR-GO', 7018354, [-15.827, -49.8362]],
    Maranhão: ['iso2:BR-MA', 7075181, [-4.9609, -45.2744]],
    'Mato Grosso': ['iso2:BR-MT', 3484466, [-12.6819, -56.9211]],
    'Mato Grosso do Sul': ['iso2:BR-MS', 2778986, [-20.7722, -54.7852]],
    'Minas Gerais': ['iso2:BR-MG', 21168791, [-18.5122, -44.555]],
    Paraná: ['iso2:BR-PR', 11433957, [-25.2521, -52.0215]],
    Paraíba: ['iso2:BR-PB', 4018127, [-7.24, -36.782]],
    Pará: ['iso2:BR-PA', 11433957, [-1.9981, -54.9306]],
    Pernambuco: ['iso2:BR-PE', 9557071, [-8.8137, -36.9541]],
    Piauí: ['iso2:BR-PI', 3273227, [-7.7183, -42.7289]],
    'Rio Grande do Norte': ['iso2:BR-RN', 3506853, [-5.4026, -36.9541]],
    'Rio Grande do Sul': ['iso2:BR-RS', 11377239, [-30.0346, -51.2177]],
    'Rio de Janeiro': ['iso2:BR-RJ', 17264943, [-22.9099, -43.2095]],
    Rondônia: ['iso2:BR-RO', 1777225, [-11.5057, -63.5806]],
    Roraima: ['iso2:BR-RR', 60576, [2.7376, -62.0751]],
    'Santa Catarina': ['iso2:BR-SC', 7164788, [-27.2423, -50.2189]],
    Sergipe: ['iso2:BR-SE', 2298696, [-10.5741, -37.3857]],
    'São Paulo': ['iso2:BR-SP', 45919049, [-23.5505, -46.6333]],
    Tocantins: ['iso2:BR-TO', 1572866, [-10.1753, -48.2982]]
  },
  scraper: {
    '0': async function scraper() {
      const response = [];
      const ufs = this._ufs;
      const $ = await fetch.headless(this, this.url, 'default');

      $.root()
        .find('.list-itens .teste')
        .each(function() {
          const uf = $(this)
            .prev()
            .text();

          response.push({
            state: ufs[uf][0],
            cases: parseInt(
              $(this)
                .find('.lb-nome')
                .eq(0)
                .text(),
              10
            ),
            deaths: parseInt(
              $(this)
                .find('.lb-nome')
                .eq(1)
                .text(),
              10
            ),
            population: ufs[uf][1],
            coordinates: [ufs[uf][2][1], ufs[uf][2][0]],
            aggregate: 'state'
          });
        });

      response.push(transform.sumData(response, { aggregate: 'state' }));

      return response;
    },

    // TODO: things actually started busting before this point .. adjust this date as we figure out where it actually works.
    '2020-04-28': async function scraper() {
      const $ = await fetch.headless(this, this.url, 'default');
      const ufs = this._ufs;

      // Find entries, throws if doesn't find at least one.
      const findMany = (el, selector) => {
        const ret = el.find(selector);
        if (ret.length === 0) throw new Error(`No match for ${selector}`);
        return ret;
      };

      // Find entry, throws if not exactly one.
      const findOne = (el, selector) => {
        const ret = findMany(el, selector);
        if (ret.length !== 1) throw new Error(`Should have 1 match for ${selector}, got ${ret.length}`);
        return ret;
      };

      const response = [];

      const entries = findMany($.root(), '.item-line');
      entries.each(function() {
        const entry = $(this);
        const name = findOne(entry, '.lb-nome.nome').text();
        const titles = findOne(entry, '.header-list.tp-aux')
          .text()
          .trim();
        const expectedTitles = new RegExp('CasosÓbitos.*');
        if (!expectedTitles.test(titles))
          throw new Error(`Title text (${titles}) did not match expected regex ${expectedTitles}`);
        const ufsEntry = ufs[name];
        if (!ufsEntry) throw new Error(`Unknown name ${name}, not in this._ufs`);
        const iso = ufsEntry[0];
        const population = ufsEntry[1];
        const coordinates = [ufsEntry[2][1], ufsEntry[2][0]];

        const values = findMany(entry, '.lb-nome.lb-value');
        const d = [];
        values.each(function() {
          const v = parseInt(
            $(this)
              .text()
              .trim(),
            10
          );
          d.push(v);
        });
        // The headings (translated) are: Confirmed, Deaths, Incidence, Letality.
        // I'm not sure what the last two are, so will only include Confirmed and Deaths.
        const cases = d[0];
        const deaths = d[1];

        response.push({
          state: iso,
          cases,
          deaths,
          population,
          coordinates,
          aggregate: 'state'
        });
      });

      response.push(transform.sumData(response, { aggregate: 'state' }));

      return response;
    } // end 2020-04-28
  } // end scraper
};

export default scraper;
