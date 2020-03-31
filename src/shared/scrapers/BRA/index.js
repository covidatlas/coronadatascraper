import * as fetch from '../../lib/fetch/index.js';
import * as transform from '../../lib/transform.js';
// import * as datetime from '../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'BRA',
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
      country: 'BRA',
      flag: '🇧🇷'
    }
  ],
  _ufs: {
    Acre: ['AC', 881935, [-9.0238, -70.812]],
    Alagoas: ['AL', 3337357, [-9.5713, -36.782]],
    Amapá: ['AP', 845731, [0.902, -52.003]],
    Amazonas: ['AM', 4144597, [-3.4168, -65.8561]],
    Bahia: ['BA', 14873064, [-12.5797, -41.7007]],
    Ceará: ['CE', 9132078, [-5.4984, -39.3206]],
    'Distrito Federal': ['DF', 3015268, [-15.7998, -47.8645]],
    'Espírito Santo': ['ES', 4018650, [-19.1834, -40.3089]],
    Goiás: ['GO', 7018354, [-15.827, -49.8362]],
    Maranhão: ['MA', 7075181, [-4.9609, -45.2744]],
    'Mato Grosso': ['MT', 3484466, [-12.6819, -56.9211]],
    'Mato Grosso do Sul': ['MS', 2778986, [-20.7722, -54.7852]],
    'Minas Gerais': ['MG', 21168791, [-18.5122, -44.555]],
    Paraná: ['PR', 11433957, [-25.2521, -52.0215]],
    Paraíba: ['PB', 4018127, [-7.24, -36.782]],
    Pará: ['PA', 11433957, [-1.9981, -54.9306]],
    Pernambuco: ['PE', 9557071, [-8.8137, -36.9541]],
    Piauí: ['PI', 3273227, [-7.7183, -42.7289]],
    'Rio Grande do Norte': ['RN', 3506853, [-5.4026, -36.9541]],
    'Rio Grande do Sul': ['RS', 11377239, [-30.0346, -51.2177]],
    'Rio de Janeiro': ['RJ', 17264943, [-22.9099, -43.2095]],
    Rondônia: ['RO', 1777225, [-11.5057, -63.5806]],
    Roraima: ['RR', 60576, [2.7376, -62.0751]],
    'Santa Catarina': ['SC', 7164788, [-27.2423, -50.2189]],
    Sergipe: ['SE', 2298696, [-10.5741, -37.3857]],
    'São Paulo': ['SP', 45919049, [-23.5505, -46.6333]],
    Tocantins: ['TO', 1572866, [-10.1753, -48.2982]]
  },
  async scraper() {
    const response = [];
    const ufs = this._ufs;
    const $ = await fetch.headless(this.url); // , false

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
  }
};

export default scraper;
