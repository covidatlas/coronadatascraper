import * as fetch from '../../lib/fetch.js';
import * as transform from '../../lib/transform.js';
import * as datetime from '../../lib/datetime.js';

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

const scraper = {
  country: 'BRA',
  type: 'json',
  priority: 1,
  url: `http://plataforma.saude.gov.br/novocoronavirus/resources/scripts/database.js?v=${datetime.getYYYYMMDD()}`,
  timeseries: true,
  aggregate: 'county',
  maintainers: [
    {
      name: 'Felipe Roberto',
      email: 'contato@feliperoberto.com.br',
      // url: 'http://feliperoberto.com.br', // currently down
      github: 'feliperoberto',
      country: 'BRA',
      flag: '🇧🇷'
    }
  ],
  _dataIds: [
    {
      uid: 11,
      name: 'Rondônia'
    },
    {
      uid: 12,
      name: 'Acre'
    },
    {
      uid: 13,
      name: 'Amazonas'
    },
    {
      uid: 14,
      name: 'Roraima'
    },
    {
      uid: 15,
      name: 'Pará'
    },
    {
      uid: 16,
      name: 'Amapá'
    },
    {
      uid: 17,
      name: 'Tocantins'
    },
    {
      uid: 21,
      name: 'Maranhão'
    },
    {
      uid: 22,
      name: 'Piauí'
    },
    {
      uid: 23,
      name: 'Ceará'
    },
    {
      uid: 24,
      name: 'Rio Grande do Norte'
    },
    {
      uid: 25,
      name: 'Paraíba'
    },
    {
      uid: 26,
      name: 'Pernambuco'
    },
    {
      uid: 27,
      name: 'Alagoas'
    },
    {
      uid: 28,
      name: 'Sergipe'
    },
    {
      uid: 29,
      name: 'Bahia'
    },
    {
      uid: 31,
      name: 'Minas Gerais'
    },
    {
      uid: 32,
      name: 'Espírito Santo'
    },
    {
      uid: 33,
      name: 'Rio de Janeiro'
    },
    {
      uid: 35,
      name: 'São Paulo'
    },
    {
      uid: 41,
      name: 'Paraná'
    },
    {
      uid: 42,
      name: 'Santa Catarina'
    },
    {
      uid: 43,
      name: 'Rio Grande do Sul'
    },
    {
      uid: 50,
      name: 'Mato Grosso do Sul'
    },
    {
      uid: 51,
      name: 'Mato Grosso'
    },
    {
      uid: 52,
      name: 'Goiás'
    },
    {
      uid: 53,
      name: 'Distrito Federal'
    },
    {
      uid: 'PE',
      name: 'Peru'
    },
    {
      uid: 'GF',
      name: 'Guiana Francesa'
    },
    {
      uid: 'BF',
      name: 'Burkina Faso'
    },
    {
      uid: 'FR',
      name: 'França'
    },
    {
      uid: 'LY',
      name: 'Libéria'
    },
    {
      uid: 'BY',
      name: 'Belarus'
    },
    {
      uid: 'PK',
      name: 'Paquistão'
    },
    {
      uid: 'ID',
      name: 'Indonésia'
    },
    {
      uid: 'YE',
      name: 'Iêmen'
    },
    {
      uid: 'MG',
      name: 'Madagascar'
    },
    {
      uid: 'BO',
      name: 'Bolívia'
    },
    {
      uid: 'CI',
      name: 'Costa do Marfim'
    },
    {
      uid: 'DZ',
      name: 'Argélia'
    },
    {
      uid: 'CH',
      name: 'Suíça'
    },
    {
      uid: 'CM',
      name: 'Cameroun'
    },
    {
      uid: 'MK',
      name: 'Macedônia do Norte'
    },
    {
      uid: 'BW',
      name: 'Botsuana'
    },
    {
      uid: 'UA',
      name: 'Ucrânia'
    },
    {
      uid: 'KE',
      name: 'Quênia'
    },
    {
      uid: 'TW',
      name: 'Taiwan'
    },
    {
      uid: 'JO',
      name: 'Jordânia'
    },
    {
      uid: 'MX',
      name: 'México'
    },
    {
      uid: 'AE',
      name: 'Emirados Árabes Unidos'
    },
    {
      uid: 'BZ',
      name: 'Belize'
    },
    {
      uid: 'BR',
      name: 'Brasil'
    },
    {
      uid: 'SL',
      name: 'Serra Leoa'
    },
    {
      uid: 'ML',
      name: 'Mali'
    },
    {
      uid: 'CD',
      name: 'República Democrática do Congo'
    },
    {
      uid: 'IT',
      name: 'Itália'
    },
    {
      uid: 'SO',
      name: 'Somália'
    },
    {
      uid: 'AF',
      name: 'Afeganistão'
    },
    {
      uid: 'BD',
      name: 'Bangladesh'
    },
    {
      uid: 'DO',
      name: 'República Dominicana'
    },
    {
      uid: 'GW',
      name: 'Guiné-Bissau'
    },
    {
      uid: 'GH',
      name: 'Gana'
    },
    {
      uid: 'AT',
      name: 'Áustria'
    },
    {
      uid: 'SE',
      name: 'Suécia'
    },
    {
      uid: 'TR',
      name: 'Turquia'
    },
    {
      uid: 'UG',
      name: 'Uganda'
    },
    {
      uid: 'MZ',
      name: 'Moçambique'
    },
    {
      uid: 'JP',
      name: 'Japão'
    },
    {
      uid: 'NZ',
      name: 'Nova Zelândia'
    },
    {
      uid: 'CU',
      name: 'Cuba'
    },
    {
      uid: 'VE',
      name: 'Venezuela'
    },
    {
      uid: 'PT',
      name: 'Portugal'
    },
    {
      uid: 'CO',
      name: 'Colômbia'
    },
    {
      uid: 'MR',
      name: 'Mauritânia'
    },
    {
      uid: 'AO',
      name: 'Angola'
    },
    {
      uid: 'DE',
      name: 'Alemanha'
    },
    {
      uid: 'SD',
      name: 'Sudão'
    },
    {
      uid: 'TH',
      name: 'Tailândia'
    },
    {
      uid: 'AU',
      name: 'Austrália'
    },
    {
      uid: 'PG',
      name: 'Papua Nova Guiné'
    },
    {
      uid: 'IQ',
      name: 'Iraque'
    },
    {
      uid: 'HR',
      name: 'Croácia'
    },
    {
      uid: 'GL',
      name: 'Groelândia'
    },
    {
      uid: 'NE',
      name: 'Níger'
    },
    {
      uid: 'DK',
      name: 'Dinamarca'
    },
    {
      uid: 'LV',
      name: 'Letônia'
    },
    {
      uid: 'RO',
      name: 'Romênia'
    },
    {
      uid: 'ZM',
      name: 'Zâmbia'
    },
    {
      uid: 'IR',
      name: 'Irã'
    },
    {
      uid: 'MM',
      name: 'Myanmar'
    },
    {
      uid: 'ET',
      name: 'Etiópia'
    },
    {
      uid: 'GT',
      name: 'Guatemala'
    },
    {
      uid: 'SR',
      name: 'Suriname'
    },
    {
      uid: 'EH',
      name: 'Saara Ocidental'
    },
    {
      uid: 'CZ',
      name: 'República Tcheca'
    },
    {
      uid: 'TD',
      name: 'Chade'
    },
    {
      uid: 'AL',
      name: 'Albânia'
    },
    {
      uid: 'FI',
      name: 'Finlândia'
    },
    {
      uid: 'SY',
      name: 'Síria'
    },
    {
      uid: 'KG',
      name: 'Quirguistão'
    },
    {
      uid: 'SB',
      name: 'Ilhas Salomão'
    },
    {
      uid: 'OM',
      name: 'Omã'
    },
    {
      uid: 'PA',
      name: 'Panamá'
    },
    {
      uid: 'AR',
      name: 'Argentina'
    },
    {
      uid: 'GB',
      name: 'Reino Unido'
    },
    {
      uid: 'CR',
      name: 'Costa Rica'
    },
    {
      uid: 'PY',
      name: 'Paraguai'
    },
    {
      uid: 'GN',
      name: 'Guiné'
    },
    {
      uid: 'IE',
      name: 'Irlanda'
    },
    {
      uid: 'NG',
      name: 'Nigéria'
    },
    {
      uid: 'TN',
      name: 'Tunísia'
    },
    {
      uid: 'PL',
      name: 'Polônia'
    },
    {
      uid: 'NA',
      name: 'Namíbia'
    },
    {
      uid: 'ZA',
      name: 'África do Sul'
    },
    {
      uid: 'EG',
      name: 'Egito'
    },
    {
      uid: 'TZ',
      name: 'Tanzânia'
    },
    {
      uid: 'GE',
      name: 'Geórgia'
    },
    {
      uid: 'SA',
      name: 'Arábia Saudita'
    },
    {
      uid: 'VN',
      name: 'Vietnã'
    },
    {
      uid: 'RU',
      name: 'Rússia'
    },
    {
      uid: 'HT',
      name: 'Haiti'
    },
    {
      uid: 'BA',
      name: 'Bósnia e Herzegovina'
    },
    {
      uid: 'IN',
      name: 'Índia'
    },
    {
      uid: 'CN',
      name: 'China'
    },
    {
      uid: 'CA',
      name: 'Canadá'
    },
    {
      uid: 'SV',
      name: 'El Salvador'
    },
    {
      uid: 'GY',
      name: 'Guiana'
    },
    {
      uid: 'BE',
      name: 'Bélgica'
    },
    {
      uid: 'GQ',
      name: 'Guiné Equatorial'
    },
    {
      uid: 'LS',
      name: 'Lesoto'
    },
    {
      uid: 'BG',
      name: 'Bulgária'
    },
    {
      uid: 'BI',
      name: 'Burundi'
    },
    {
      uid: 'DJ',
      name: 'Djibouti'
    },
    {
      uid: 'AZ',
      name: 'Azerbaijão'
    },
    {
      uid: 'MY',
      name: 'Malásia'
    },
    {
      uid: 'PH',
      name: 'Filipinas'
    },
    {
      uid: 'UY',
      name: 'Uruguai'
    },
    {
      uid: 'CG',
      name: 'República Democrática do Congo'
    },
    {
      uid: 'RS',
      name: 'Sérvia'
    },
    {
      uid: 'ME',
      name: 'Montenegro'
    },
    {
      uid: 'EE',
      name: 'Estônia'
    },
    {
      uid: 'RW',
      name: 'Ruanda'
    },
    {
      uid: 'AM',
      name: 'Armênia'
    },
    {
      uid: 'SN',
      name: 'Senegal'
    },
    {
      uid: 'TG',
      name: 'Togo'
    },
    {
      uid: 'ES',
      name: 'Espanha'
    },
    {
      uid: 'GA',
      name: 'Gabão'
    },
    {
      uid: 'HU',
      name: 'Hungria'
    },
    {
      uid: 'MW',
      name: 'Malawi'
    },
    {
      uid: 'TJ',
      name: 'Tajiquistão'
    },
    {
      uid: 'KH',
      name: 'Camboja'
    },
    {
      uid: 'KR',
      name: 'Coreia do Sul'
    },
    {
      uid: 'HN',
      name: 'Honduras'
    },
    {
      uid: 'IS',
      name: 'Islândia'
    },
    {
      uid: 'NI',
      name: 'Nicarágua'
    },
    {
      uid: 'CL',
      name: 'Chile'
    },
    {
      uid: 'MA',
      name: 'Marrocos'
    },
    {
      uid: 'LR',
      name: 'Libéria'
    },
    {
      uid: 'NL',
      name: 'Holanda'
    },
    {
      uid: 'CF',
      name: 'República Centro-Africana'
    },
    {
      uid: 'SK',
      name: 'Eslováquia'
    },
    {
      uid: 'LT',
      name: 'Lituânia'
    },
    {
      uid: 'ZW',
      name: 'Zimbábue'
    },
    {
      uid: 'LK',
      name: 'Sri Lanka'
    },
    {
      uid: 'IL',
      name: 'Israel'
    },
    {
      uid: 'LA',
      name: 'Laos'
    },
    {
      uid: 'KP',
      name: 'Coreia do Norte'
    },
    {
      uid: 'GR',
      name: 'Grécia'
    },
    {
      uid: 'TM',
      name: 'Turcomenistão'
    },
    {
      uid: 'EC',
      name: 'Equador'
    },
    {
      uid: 'BJ',
      name: 'Benin'
    },
    {
      uid: 'SI',
      name: 'Eslovênia'
    },
    {
      uid: 'NO',
      name: 'Noruega'
    },
    {
      uid: 'MD',
      name: 'Moldávia'
    },
    {
      uid: 'LB',
      name: 'Líbano'
    },
    {
      uid: 'NP',
      name: 'Nepal'
    },
    {
      uid: 'ER',
      name: 'Eritreia'
    },
    {
      uid: 'US',
      name: 'Estados Unidos'
    },
    {
      uid: 'KZ',
      name: 'Cazaquistão'
    },
    {
      uid: 'SZ',
      name: 'Suazilândia'
    },
    {
      uid: 'UZ',
      name: 'Uzbequistão'
    },
    {
      uid: 'MN',
      name: 'Mongólia'
    },
    {
      uid: 'BT',
      name: 'Butão'
    },
    {
      uid: 'NC',
      name: 'Nova Caledônia'
    },
    {
      uid: 'FJ',
      name: 'Fiji'
    },
    {
      uid: 'KW',
      name: 'Kuwait'
    },
    {
      uid: 'TL',
      name: 'Timor-Leste'
    },
    {
      uid: 'BS',
      name: 'Bahamas'
    },
    {
      uid: 'VU',
      name: 'Vanuatu'
    },
    {
      uid: 'FK',
      name: 'Ilhas Malvinas'
    },
    {
      uid: 'GM',
      name: 'Gâmbia'
    },
    {
      uid: 'QA',
      name: 'Catar'
    },
    {
      uid: 'JM',
      name: 'Jamaica'
    },
    {
      uid: 'CY',
      name: 'Chipre'
    },
    {
      uid: 'PR',
      name: 'Porto Rico'
    },
    {
      uid: 'PS',
      name: 'Palestina'
    },
    {
      uid: 'BN',
      name: 'Brunei'
    },
    {
      uid: 'TT',
      name: 'Trinidad e Tobago'
    },
    {
      uid: 'CV',
      name: 'Cabo Verde'
    },
    {
      uid: 'PF',
      name: 'Polinésia Francesa'
    },
    {
      uid: 'WS',
      name: 'Samoa'
    },
    {
      uid: 'LU',
      name: 'Luxemburgo'
    },
    {
      uid: 'RE',
      name: 'Ilha da Reunião'
    },
    {
      uid: 'KM',
      name: 'Comores'
    },
    {
      uid: 'MU',
      name: 'Maurício'
    },
    {
      uid: 'FO',
      name: 'Ilhas Faroé'
    },
    {
      uid: 'MQ',
      name: 'Martinica'
    },
    {
      uid: 'ST',
      name: 'São Tomé e Príncipe'
    },
    {
      uid: 'AN',
      name: 'Antilhas Neerlandesas'
    },
    {
      uid: 'DM',
      name: 'Dominica'
    },
    {
      uid: 'GP',
      name: 'Guadalupe'
    },
    {
      uid: 'TO',
      name: 'Tonga'
    },
    {
      uid: 'KI',
      name: 'Quiribati'
    },
    {
      uid: 'FM',
      name: 'Micronésia'
    },
    {
      uid: 'BH',
      name: 'Bahrein'
    },
    {
      uid: 'AD',
      name: 'Andorra'
    },
    {
      uid: 'MP',
      name: 'Ilhas Marianas do Norte'
    },
    {
      uid: 'PW',
      name: 'Palau'
    },
    {
      uid: 'SC',
      name: 'Seicheles'
    },
    {
      uid: 'AG',
      name: 'Antígua e Barbuda'
    },
    {
      uid: 'BB',
      name: 'Barbados'
    },
    {
      uid: 'TC',
      name: 'Turks e Caicos'
    },
    {
      uid: 'VC',
      name: 'São Vicente e Granadinas'
    },
    {
      uid: 'LC',
      name: 'Santa Lúcia'
    },
    {
      uid: 'YT',
      name: 'Mayotte'
    },
    {
      uid: 'VI',
      name: 'Ilhas Virgens Americanas'
    },
    {
      uid: 'GD',
      name: 'Granada'
    },
    {
      uid: 'MT',
      name: 'Malta'
    },
    {
      uid: 'MV',
      name: 'Maldivas'
    },
    {
      uid: 'KY',
      name: 'Ilhas Cayman'
    },
    {
      uid: 'KN',
      name: 'São Cristóvão e Névis'
    },
    {
      uid: 'MS',
      name: 'Montserrat'
    },
    {
      uid: 'NU',
      name: 'Niue'
    },
    {
      uid: 'PM',
      name: 'São Pedro e Miquelão'
    },
    {
      uid: 'CK',
      name: 'Ilhas Cook'
    },
    {
      uid: 'WF',
      name: 'Wallis e Futuna'
    },
    {
      uid: 'AS',
      name: 'Samoa Americana'
    },
    {
      uid: 'MH',
      name: 'Ilhas Marshall'
    },
    {
      uid: 'AW',
      name: 'Aruba'
    },
    {
      uid: 'LI',
      name: 'Liechtenstein'
    },
    {
      uid: 'VG',
      name: 'Ilhas Virgens Britânicas'
    },
    {
      uid: 'SH',
      name: 'Santa Helena'
    },
    {
      uid: 'JE',
      name: 'Jersey'
    },
    {
      uid: 'AI',
      name: 'Anguilla'
    },
    {
      uid: 'GG',
      name: 'Guernsey'
    },
    {
      uid: 'SM',
      name: 'San Marino'
    },
    {
      uid: 'BM',
      name: 'Bermudas'
    },
    {
      uid: 'TV',
      name: 'Tuvalu'
    },
    {
      uid: 'NR',
      name: 'Nauru'
    },
    {
      uid: 'GI',
      name: 'Gibraltar'
    },
    {
      uid: 'PN',
      name: 'Ilhas Pitcairn'
    },
    {
      uid: 'MC',
      name: 'Mônaco'
    },
    {
      uid: 'VA',
      name: 'Vaticano'
    },
    {
      uid: 'IM',
      name: 'Ilha de Man'
    },
    {
      uid: 'GU',
      name: 'Guam'
    },
    {
      uid: 'SG',
      name: 'Singapura'
    },
    {
      uid: 'SS',
      name: 'Sudão do Sul'
    },
    {
      uid: 'SX',
      name: 'São Martinho'
    },
    {
      uid: 'BL',
      name: 'São Bartolomeu'
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
    const scrapeDate = process.env.SCRAPE_DATE ? new Date(process.env.SCRAPE_DATE) : datetime.getDate();
    const ufs = this._ufs;
    const labels = {};
    const dataIds = this._dataIds;
    dataIds.forEach(label => {
      if (typeof label.uid === 'number') labels[label.uid] = ufs[label.name];
    });
    const data = await fetch.page(this.url, false);
    const dataJson = JSON.parse(data.text().replace('var database=', ''));
    const dataBrazil = [];

    // Find the latest available date
    const dateParts = dataJson.brazil[dataJson.brazil.length - 1].date.split('/');
    const latestDate = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);

    let targetDate;
    if (datetime.dateIsBefore(latestDate, scrapeDate)) {
      console.error('  🚨 Timeseries for BRA has not been updated, using %s instead of %s', datetime.getYYYYMMDD(latestDate), datetime.getYYYYMMDD(scrapeDate));
      targetDate = datetime.getDDMMYYYY(latestDate, '/');
    } else {
      targetDate = datetime.getDDMMYYYY(scrapeDate, '/');
    }

    dataJson.brazil
      .filter(row => row.date === targetDate)
      .forEach(dateData => {
        dateData.values.forEach(value => {
          dataBrazil.push({
            state: labels[parseInt(value.uid, 10)][0],
            cases: value.cases || 0,
            deaths: value.deaths || 0,
            population: labels[parseInt(value.uid, 10)][1],
            coordinates: [labels[parseInt(value.uid, 10)][2][1], labels[parseInt(value.uid, 10)][2][0]]
          });
        });
      });
    dataBrazil.push(transform.sumData(dataBrazil));
    return dataBrazil;
  }
};

export default scraper;
