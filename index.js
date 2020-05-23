(function () {
  'use strict';

  /**
   *  Copyright 2018 Adobe. All rights reserved.
   *  This file is licensed to you under the Apache License, Version 2.0 (the "License");
   *  you may not use this file except in compliance with the License. You may obtain a copy
   *  of the License at http://www.apache.org/licenses/LICENSE-2.0
   *
   *  Unless required by applicable law or agreed to in writing, software distributed under
   *  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
   *  OF ANY KIND, either express or implied. See the License for the specific language
   *  governing permissions and limitations under the License.
   */

  // Provides explicit indication of elements receiving focus through keyboard interaction rather than mouse or touch.
  (function(doc) {
    // In case file is imported in SSR context, don't polyfill anything
    if (!doc) {
      return;
    }

    var NAVIGATION_KEYS = [
      'Tab',
      'ArrowUp',
      'ArrowRight',
      'ArrowDown',
      'ArrowLeft',
      'Home',
      'End',
      'PageUp',
      'PageDown',
      'Enter',
      ' ',
      'Escape',

      /* IE9 and Firefox < 37 */
      'Up',
      'Right',
      'Down',
      'Left',
      'Esc'
    ];
    var TEXT_INPUT_TYPES = [
      'text',
      'date',
      'datetime-local',
      'email',
      'month',
      'number',
      'password',
      'search',
      'tel',
      'time',
      'url',
      'week'
    ];
    var keyboardFocus = false;
    var elements = doc.getElementsByClassName('focus-ring');

    function onKeydownHandler(event) {
      if (event.ctrlKey || event.altKey || event.metaKey || NAVIGATION_KEYS.indexOf(event.key) === -1) {
        return;
      }
      keyboardFocus = true;

      if (doc.activeElement &&
          doc.activeElement !== doc.body &&
          doc.activeElement.tagName !== 'TEXTAREA' &&
          !(doc.activeElement.tagName === 'INPUT' &&
            TEXT_INPUT_TYPES.indexOf(doc.activeElement.type) !== -1)) {
        doc.activeElement.classList.add('focus-ring');
      }
    }

    function onMousedownHandler() {
      keyboardFocus = false;

      for (var i = 0; i < elements.length; i++) {
        elements[i].classList.remove('focus-ring');
      }

    }

    function onFocusHandler(event) {
      var classList = event.target.classList;
      if (classList && keyboardFocus) {
        classList.add('focus-ring');
      }
    }

    function onBlurHandler(event) {
      var classList = event.target.classList;
      classList && classList.remove('focus-ring');
    }

    doc.addEventListener('keydown', onKeydownHandler, true);
    doc.addEventListener('mousedown', onMousedownHandler, true);
    doc.addEventListener('focus', onFocusHandler, true);
    doc.addEventListener('blur', onBlurHandler, true);
  })(typeof window === "undefined" ? undefined : document);

  /* global XMLHttpRequest */

  const url = function(urlToFetch, callback) {
    const req = new XMLHttpRequest();
    req.addEventListener('load', callback);
    req.open('GET', urlToFetch);
    req.send();
    return req;
  };

  const json = function(urlToFetch, callback) {
    return url(urlToFetch, function() {
      let obj;
      try {
        obj = JSON.parse(this.responseText);
      } catch (err) {
        console.error('Failed to parse JSON from %s: %s', urlToFetch, err);
      }
      callback(obj);
    });
  };

  const replacements = {
    'Cabinet for Health and Family Services': 'HFS',
    'Department of Health & Human Resources': 'DHHR',
    'Department of Health and Human Services': 'HHS',
    'Emergency and Preparedness Information': 'E&P',
    'Health and Human Services': 'HHS',
    'Department of Health': 'DoH',
    'Public Health Department': 'DPH',
    'Department of Public Health': 'DoH',
    Department: 'Dept.',
    Information: 'Info.'
  };
  function shortenName(name) {
    for (const [search, replace] of Object.entries(replacements)) {
      name = name.split(' - ').shift();
      name = name.replace(search, replace);
    }
    return name;
  }

  const getURLFromContributor = function(curator) {
    if (!curator) {
      return '';
    }

    let url;
    if (curator.url) {
      url = curator.url;
    } else if (curator.twitter) {
      url = `https://twitter.com/${curator.twitter.replace('@', '')}`;
    } else if (curator.github) {
      url = `https://github.com/${curator.github}`;
    } else if (curator.email) {
      url = `mailto:${curator.email}`;
    }
    return url;
  };

  /**
   * @param {{name: string, country: string?, flag: string?}[]} contributors
   */
  const getContributors = function(contributors, options = { link: true, shortNames: false }) {
    let html = '';

    if (contributors) {
      for (const [index, contributor] of Object.entries(contributors)) {
        // Only show first source
        if (options.shortNames && index > 0) {
          break;
        }

        if (index !== '0') {
          html += ', ';
        }
        const contributorURL = options.link && getURLFromContributor(contributor);
        if (contributorURL) {
          html += `<a href="${contributorURL}" class="spectrum-Link">`;
        }
        if (options.shortNames) {
          html += shortenName(contributor.name);
        } else {
          html += contributor.name;
        }
        if (contributorURL) {
          html += `</a>`;
        }
        if (contributor && (contributor.country || contributor.flag)) {
          html += ' ';
          html += contributor.flag ? contributor.flag : `(${contributor.country})`;
        }
      }
    }

    return html;
  };

  /**
   * @param {{name: string, country: string?, flag: string?}[]} contributors
   */
  const getSource = function(location, options = { link: true, shortNames: false }) {
    const sourceURLShort = location.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
    let html = '';
    if (location.curators || location.sources) {
      html += getContributors(location.curators || location.sources, options);
    } else {
      if (options.link) {
        html += `<a class="spectrum-Link" target="_blank" href="${location.url}">`;
      }
      html += sourceURLShort;
      if (options.link) {
        html += `</a>`;
      }
    }
    return html;
  };

  const getRatio = function(fractional, total) {
    if (fractional === 0) {
      return '-';
    }
    return `1 : ${Math.round(total / fractional).toLocaleString()}`;
  };

  const getPercent = function(fractional, total) {
    if (fractional === 0) {
      return '-';
    }
    return `${((1 / Math.round(total / fractional)) * 100).toFixed(4)}%`;
  };

  const getGrade = function(rating) {
    rating *= 200;

    if (rating >= 97) {
      return 'A+';
    }
    if (rating >= 93) {
      return 'A';
    }
    if (rating >= 90) {
      return 'A-';
    }
    if (rating >= 87) {
      return 'B+';
    }
    if (rating >= 83) {
      return 'B';
    }
    if (rating >= 80) {
      return 'B-';
    }
    if (rating >= 77) {
      return 'C+';
    }
    if (rating >= 73) {
      return 'C';
    }
    if (rating >= 70) {
      return 'C-';
    }
    if (rating >= 67) {
      return 'D+';
    }
    if (rating >= 63) {
      return 'D';
    }
    if (rating >= 60) {
      return 'D';
    }
    if (rating >= 57) {
      return 'F+';
    }
    if (rating >= 53) {
      return 'F';
    }
    if (rating >= 50) {
      return 'F';
    }
    return 'F-';
  };

  /** Get the full name of a location
   * @param {{ city: string?; county: string?; state: string?; country: string?; }} location
   */
  const getName = location =>
    location.name || [location.city, location.county, location.state, location.country].filter(Boolean).join(', ');

  const isCountry = function(location) {
    return location && location.country && !location.state && !location.county && !location.city;
  };

  const isState = function(location) {
    return location && location.state && !location.county && !location.city;
  };

  const isCounty = function(location) {
    return location && location.county && !location.city;
  };

  const isCity = function(location) {
    return location && location.city;
  };

  const getLocationGranularityName = function(location) {
    if (isCountry(location)) {
      return 'country';
    }
    if (isState(location)) {
      return 'state';
    }
    if (isCounty(location)) {
      return 'county';
    }
    if (isCity(location)) {
      return 'city';
    }
    return 'none';
  };

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$"),
      reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$"),
      reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$"),
      reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$"),
      reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$"),
      reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    copy: function(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable: function() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? new Rgb(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? new Rgb((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb: function() {
      return this;
    },
    displayable: function() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return "#" + hex(this.r) + hex(this.g) + hex(this.b);
  }

  function rgb_formatRgb() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }

  function hex(value) {
    value = Math.max(0, Math.min(255, Math.round(value) || 0));
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter: function(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker: function(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb: function() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    displayable: function() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl: function() {
      var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
      return (a === 1 ? "hsl(" : "hsla(")
          + (this.h || 0) + ", "
          + (this.s || 0) * 100 + "%, "
          + (this.l || 0) * 100 + "%"
          + (a === 1 ? ")" : ", " + a + ")");
    }
  }));

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  var deg2rad = Math.PI / 180;
  var rad2deg = 180 / Math.PI;

  // https://observablehq.com/@mbostock/lab-and-rgb
  var K = 18,
      Xn = 0.96422,
      Yn = 1,
      Zn = 0.82521,
      t0 = 4 / 29,
      t1 = 6 / 29,
      t2 = 3 * t1 * t1,
      t3 = t1 * t1 * t1;

  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) return hcl2lab(o);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = rgb2lrgb(o.r),
        g = rgb2lrgb(o.g),
        b = rgb2lrgb(o.b),
        y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x, z;
    if (r === g && g === b) x = z = y; else {
      x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
      z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
    }
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Lab, lab, extend(Color, {
    brighter: function(k) {
      return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker: function(k) {
      return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb: function() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      x = Xn * lab2xyz(x);
      y = Yn * lab2xyz(y);
      z = Zn * lab2xyz(z);
      return new Rgb(
        lrgb2rgb( 3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
        lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z),
        lrgb2rgb( 0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
  }

  function lab2xyz(t) {
    return t > t1 ? t * t * t : t2 * (t - t0);
  }

  function lrgb2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2lrgb(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
    var h = Math.atan2(o.b, o.a) * rad2deg;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  function hcl2lab(o) {
    if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }

  define(Hcl, hcl, extend(Color, {
    brighter: function(k) {
      return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
    },
    darker: function(k) {
      return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
    },
    rgb: function() {
      return hcl2lab(this).rgb();
    }
  }));

  function constant(x) {
    return function() {
      return x;
    };
  }

  function linear(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear(a, d) : constant(isNaN(a) ? b : a);
  }

  var rgb$1 = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function numberArray(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0,
        c = b.slice(),
        i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }

  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(na),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = interpolate(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = interpolate(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function string(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function interpolate(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant(b)
        : (t === "number" ? interpolateNumber
        : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string)
        : b instanceof color ? rgb$1
        : b instanceof Date ? date
        : isNumberArray(b) ? numberArray
        : Array.isArray(b) ? genericArray
        : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
        : interpolateNumber)(a, b);
  }

  function interpolateRound(a, b) {
    return a = +a, b = +b, function(t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  function hcl$1(hue) {
    return function(start, end) {
      var h = hue((start = hcl(start)).h, (end = hcl(end)).h),
          c = nogamma(start.c, end.c),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.c = c(t);
        start.l = l(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }
  }

  var hcl$2 = hcl$1(hue);

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function bisector(compare) {
    if (compare.length === 1) compare = ascendingComparator(compare);
    return {
      left: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (lo == null) lo = 0;
        if (hi == null) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid;
          else lo = mid + 1;
        }
        return lo;
      }
    };
  }

  function ascendingComparator(f) {
    return function(d, x) {
      return ascending(f(d), x);
    };
  }

  var ascendingBisect = bisector(ascending);
  var bisectRight = ascendingBisect.right;

  var e10 = Math.sqrt(50),
      e5 = Math.sqrt(10),
      e2 = Math.sqrt(2);

  function ticks(start, stop, count) {
    var reverse,
        i = -1,
        n,
        ticks,
        step;

    stop = +stop, start = +start, count = +count;
    if (start === stop && count > 0) return [start];
    if (reverse = stop < start) n = start, start = stop, stop = n;
    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

    if (step > 0) {
      start = Math.ceil(start / step);
      stop = Math.floor(stop / step);
      ticks = new Array(n = Math.ceil(stop - start + 1));
      while (++i < n) ticks[i] = (start + i) * step;
    } else {
      start = Math.floor(start * step);
      stop = Math.ceil(stop * step);
      ticks = new Array(n = Math.ceil(start - stop + 1));
      while (++i < n) ticks[i] = (start - i) / step;
    }

    if (reverse) ticks.reverse();

    return ticks;
  }

  function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
    return power >= 0
        ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
        : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
  }

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;
    else if (error >= e5) step1 *= 5;
    else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }

  function initRange(domain, range) {
    switch (arguments.length) {
      case 0: break;
      case 1: this.range(domain); break;
      default: this.range(range).domain(domain); break;
    }
    return this;
  }

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function number(x) {
    return +x;
  }

  var unit = [0, 1];

  function identity(x) {
    return x;
  }

  function normalize(a, b) {
    return (b -= (a = +a))
        ? function(x) { return (x - a) / b; }
        : constant$1(isNaN(b) ? NaN : 0.5);
  }

  function clamper(a, b) {
    var t;
    if (a > b) t = a, a = b, b = t;
    return function(x) { return Math.max(a, Math.min(b, x)); };
  }

  // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
  // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
  function bimap(domain, range, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) d0 = normalize(d1, d0), r0 = interpolate(r1, r0);
    else d0 = normalize(d0, d1), r0 = interpolate(r0, r1);
    return function(x) { return r0(d0(x)); };
  }

  function polymap(domain, range, interpolate) {
    var j = Math.min(domain.length, range.length) - 1,
        d = new Array(j),
        r = new Array(j),
        i = -1;

    // Reverse descending domains.
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    while (++i < j) {
      d[i] = normalize(domain[i], domain[i + 1]);
      r[i] = interpolate(range[i], range[i + 1]);
    }

    return function(x) {
      var i = bisectRight(domain, x, 1, j) - 1;
      return r[i](d[i](x));
    };
  }

  function copy(source, target) {
    return target
        .domain(source.domain())
        .range(source.range())
        .interpolate(source.interpolate())
        .clamp(source.clamp())
        .unknown(source.unknown());
  }

  function transformer() {
    var domain = unit,
        range = unit,
        interpolate$1 = interpolate,
        transform,
        untransform,
        unknown,
        clamp = identity,
        piecewise,
        output,
        input;

    function rescale() {
      var n = Math.min(domain.length, range.length);
      if (clamp !== identity) clamp = clamper(domain[0], domain[n - 1]);
      piecewise = n > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }

    function scale(x) {
      return isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate$1)))(transform(clamp(x)));
    }

    scale.invert = function(y) {
      return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
    };

    scale.domain = function(_) {
      return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
    };

    scale.rangeRound = function(_) {
      return range = Array.from(_), interpolate$1 = interpolateRound, rescale();
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = _ ? true : identity, rescale()) : clamp !== identity;
    };

    scale.interpolate = function(_) {
      return arguments.length ? (interpolate$1 = _, rescale()) : interpolate$1;
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    return function(t, u) {
      transform = t, untransform = u;
      return rescale();
    };
  }

  function continuous() {
    return transformer()(identity, identity);
  }

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimal(1.23) returns ["123", 0].
  function formatDecimal(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatNumerals(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }

  formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
    this.align = specifier.align === undefined ? ">" : specifier.align + "";
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === undefined ? undefined : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === undefined ? "" : specifier.type + "";
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width === undefined ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
        + (this.trim ? "~" : "")
        + this.type;
  };

  // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
  function formatTrim(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimal(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "%": function(x, p) { return (x * 100).toFixed(p); },
    "b": function(x) { return Math.round(x).toString(2); },
    "c": function(x) { return x + ""; },
    "d": function(x) { return Math.round(x).toString(10); },
    "e": function(x, p) { return x.toExponential(p); },
    "f": function(x, p) { return x.toFixed(p); },
    "g": function(x, p) { return x.toPrecision(p); },
    "o": function(x) { return Math.round(x).toString(8); },
    "p": function(x, p) { return formatRounded(x * 100, p); },
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
    "x": function(x) { return Math.round(x).toString(16); }
  };

  function identity$1(x) {
    return x;
  }

  var map = Array.prototype.map,
      prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function formatLocale(locale) {
    var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
        currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
        currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
        decimal = locale.decimal === undefined ? "." : locale.decimal + "",
        numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
        percent = locale.percent === undefined ? "%" : locale.percent + "",
        minus = locale.minus === undefined ? "-" : locale.minus + "",
        nan = locale.nan === undefined ? "NaN" : locale.nan + "";

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // The "" type, and any invalid type, is an alias for ".12~g".
      else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision === undefined ? 6
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Perform the initial formatting.
          var valueNegative = value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

          // Trim insignificant zeros.
          if (trim) value = formatTrim(value);

          // If a negative value rounds to zero during formatting, treat as positive.
          if (valueNegative && +value === 0) valueNegative = false;

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;

          valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": value = valuePrefix + value + valueSuffix + padding; break;
          case "=": value = valuePrefix + padding + value + valueSuffix; break;
          case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
          default: value = padding + valuePrefix + value + valueSuffix; break;
        }

        return numerals(value);
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale;
  var format;
  var formatPrefix;

  defaultLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-"
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  function precisionFixed(step) {
    return Math.max(0, -exponent(Math.abs(step)));
  }

  function precisionPrefix(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
  }

  function precisionRound(step, max) {
    step = Math.abs(step), max = Math.abs(max) - step;
    return Math.max(0, exponent(max) - exponent(step)) + 1;
  }

  function tickFormat(start, stop, count, specifier) {
    var step = tickStep(start, stop, count),
        precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  function linearish(scale) {
    var domain = scale.domain;

    scale.ticks = function(count) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
    };

    scale.tickFormat = function(count, specifier) {
      var d = domain();
      return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
    };

    scale.nice = function(count) {
      if (count == null) count = 10;

      var d = domain(),
          i0 = 0,
          i1 = d.length - 1,
          start = d[i0],
          stop = d[i1],
          step;

      if (stop < start) {
        step = start, start = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }

      step = tickIncrement(start, stop, count);

      if (step > 0) {
        start = Math.floor(start / step) * step;
        stop = Math.ceil(stop / step) * step;
        step = tickIncrement(start, stop, count);
      } else if (step < 0) {
        start = Math.ceil(start * step) / step;
        stop = Math.floor(stop * step) / step;
        step = tickIncrement(start, stop, count);
      }

      if (step > 0) {
        d[i0] = Math.floor(start / step) * step;
        d[i1] = Math.ceil(stop / step) * step;
        domain(d);
      } else if (step < 0) {
        d[i0] = Math.ceil(start * step) / step;
        d[i1] = Math.floor(stop * step) / step;
        domain(d);
      }

      return scale;
    };

    return scale;
  }

  function linear$1() {
    var scale = continuous();

    scale.copy = function() {
      return copy(scale, linear$1());
    };

    initRange.apply(scale, arguments);

    return linearish(scale);
  }

  /* globals document */

  const choroplethColor = 'yellowOrangePurple';

  const noCasesColor = '#ffffff';
  const noPopulationDataColor = 'rgba(0,0,0,0)';

  const outlineColorHighlight = 'rgb(0,0,0)';
  const outlineColor = 'rgba(0, 0, 0, 0.3)';

  const choroplethColors = {
    stoplight: ['#eeffcd', '#b4ffa5', '#ffff00', '#ff7f00', '#ff0000'],
    yellowOrangePurple: [
      '#fff5bd',
      '#ffb500',
      '#ff7e00',
      '#f24b0d',
      '#cd311f',
      '#b10048',
      '#7c0864',
      '#4a185a',
      '#2b123e',
      '#140321'
    ],
    yellowOrangeRed: [
      '#fff5bd',
      '#fce289',
      '#fcce54',
      '#ffb601',
      '#ff8f00',
      '#fd6100',
      '#e03d19',
      '#b52725',
      '#801f28',
      '#4b1a21'
    ],
    heat: ['#FFFFFF', '#ffff5e', '#ffe70c', '#fead0a', '#fd6f08', '#fd2907', '#fd0407'],
    peach: ['rgb(253,222,166)', 'rgb(255,188,134)', 'rgb(249,152,133)', 'rgb(232,110,129)', 'rgb(224,88,136)'],
    pink: [
      'rgb(255, 244, 221)',
      'rgb(255, 221, 215)',
      'rgb(255, 197, 210)',
      'rgb(254, 174, 203)',
      'rgb(250, 150, 196)',
      'rgb(245, 126, 189)',
      'rgb(239, 100, 181)',
      'rgb(232, 70, 173)',
      'rgb(210, 56, 161)',
      'rgb(187, 46, 150)',
      'rgb(163, 36, 140)',
      'rgb(138, 27, 131)',
      'rgb(113, 22, 124)',
      'rgb(86, 15, 116)',
      'rgb(55, 11, 110)',
      'rgb(0, 9, 104)'
    ],
    viridis: [
      '#fde725',
      '#d8e219',
      '#addc30',
      '#84d44b',
      '#5ec962',
      '#3fbc73',
      '#28ae80',
      '#1fa088',
      '#21918c',
      '#26828e',
      '#2c728e',
      '#33638d',
      '#3b528b',
      '#424086',
      '#472d7b',
      '#48186a'
    ],
    magma: [
      '#fcfdbf',
      '#fde2a3',
      '#fec488',
      '#fea772',
      '#fc8961',
      '#f56b5c',
      '#e75263',
      '#d0416f',
      '#b73779',
      '#9c2e7f',
      '#832681',
      '#6a1c81',
      '#51127c',
      '#36106b',
      '#1d1147',
      '#0a0822'
    ]
  };

  let domainArray = [];
  const colorsArray = choroplethColors[choroplethColor];

  // Create domains array equal to number of colors
  // distribution of lightness/colors handled outside of this tool
  for (let i = 0; i < colorsArray.length; i++) {
    let inc;
    if (i === 0) {
      inc = 0;
    } else {
      inc = i / colorsArray.length;
    }
    domainArray.push(inc);
  }
  domainArray = domainArray.sort();

  const fill = linear$1()
    .domain(domainArray)
    .range(colorsArray)
    .interpolate(hcl$2);

  function ramp(color, n, containerId) {
    const base = document.getElementById(containerId);
    const canvas = document.createElement('canvas');
    base.appendChild(canvas);
    canvas.setAttribute('width', `${n}px`);
    canvas.setAttribute('height', '16px');
    const context = canvas.getContext('2d');

    canvas.style.width = `${n}px`;
    canvas.style.height = '16px';
    canvas.style.imageRendering = 'pixelated';

    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 32);
    }
    return canvas;
  }

  function getScaledColorValue(location, locationData, type, worstAffectedPercent) {
    // Color based on how bad it is, relative to the worst place
    const affectedPercent = locationData[type] / location.population;
    const percentRatio = affectedPercent / worstAffectedPercent;

    return fill(percentRatio);
  }

  function createLegend(min, max, legendType) {
    const base = document.getElementById('map');
    const containerId = 'mapLegend';
    const container = base.querySelector(`#${containerId}`) || document.createElement('div');
    container.innerHTML = '';
    container.id = containerId;

    const heading = document.createElement('span');
    heading.className = 'spectrum-Heading spectrum-Heading--XXXS';
    heading.innerHTML = `Percent of population ${legendType}`;
    container.appendChild(heading);

    base.appendChild(container);
    ramp(fill, 300, containerId);

    // Correct value of max percent so that it's easier to parse
    const lowestPercent = (min * 100).toFixed(8);
    const worstPercent = (max * 100).toFixed(2);

    const scaleText = document.createElement('span');
    scaleText.className = 'mapLegend-scaleLabels';
    const startText = document.createElement('span');
    startText.className = 'spectrum-Body spectrum-Body--XS';
    startText.innerHTML = `${lowestPercent}%`;
    const endText = document.createElement('span');
    endText.className = 'spectrum-Body spectrum-Body--XS';
    endText.innerHTML = `${worstPercent}%`;
    scaleText.appendChild(startText);
    scaleText.appendChild(endText);
    container.appendChild(scaleText);
  }

  /* globals Chart, document */

  let chart;

  const changeSizes = opts => {
    if (document.body.offsetWidth <= 960 && typeof opts.title.text === 'string') {
      opts.title.text = opts.title.text.split(/, */);
    } else if (document.body.offsetWidth > 960 && typeof opts.title.text !== 'string') {
      opts.title.text = opts.title.text.join(', ');
    }

    const y = opts.scales.yAxes[0];
    if (document.body.offsetHeight <= 425) {
      [y.scaleLabel.labelString] = y.types;
    } else {
      y.scaleLabel.labelString = `${y.types[0]} (click graph for ${y.types[1]})`;
    }
  };

  const options = {
    maintainAspectRatio: false,
    title: {
      display: true,
      fontSize: 20
    },
    scales: {
      xAxes: [
        {
          type: 'time',
          distribution: 'linear',
          time: {
            minUnit: 'day'
          },
          ticks: {
            major: {
              enabled: true,
              fontStyle: 'bold'
            },
            autoSkip: true,
            source: 'data',
            sampleSize: 100
          }
        }
      ],
      yAxes: [
        {
          type: 'linear',
          gridLines: {
            drawBorder: false
          },
          major: {
            enabled: true,
            fontStyle: 'bold'
          },
          types: ['Linear', 'Logarithmic'],
          scaleLabel: {
            display: true,
            labelString: 'Linear (click graph for logarithmic)'
          },
          ticks: {
            autoSkip: true,

            userCallback(label) {
              if (this.options.type === 'linear') {
                return label;
              }
              const remain = label / 10 ** Math.floor(Chart.helpers.log10(label));
              if (remain === 1 || remain === 2 || remain === 5) {
                return label;
              }
            }
          }
        }
      ]
    },
    legend: {
      labels: {
        usePointStyle: true,
        filter(labelItem, data) {
          const curr = data.datasets.find(d => d.label === labelItem.text);
          if (curr.data.length) {
            return labelItem;
          }
        }
      }
    },
    tooltips: {
      intersect: false,
      mode: 'nearest',
      position: 'nearest',
      axis: 'x',
      callbacks: {
        title(tooltipItem) {
          return new Date(tooltipItem[0].label).toLocaleDateString();
        },
        label(tooltipItem, data) {
          let label = data.datasets[tooltipItem.datasetIndex].label || '';
          if (label) {
            label += ': ';
          }
          label += parseInt(tooltipItem.value, 10);
          return label;
        }
      }
    },
    events: ['mousemove', 'mouseout', 'click'],
    onClick() {
      const y = this.options.scales.yAxes[0];
      const types = y.types.reverse();
      y.type = types[0].toLowerCase();

      changeSizes(this.options);
      this.update();
      this.render();
    },
    onResize(_chart) {
      changeSizes(_chart.options);
    }
  };

  const showGraph = (location, locationData) => {
    const casesData = [];
    const activeData = [];
    const deathsData = [];
    const recoveredData = [];

    locationData.forEach(day => {
      const date = new Date(day.date);

      if (day.cases)
        casesData.push({
          y: day.cases,
          t: date
        });

      if (day.active)
        activeData.push({
          y: day.active,
          t: date
        });

      if (day.deaths)
        deathsData.push({
          y: day.deaths,
          t: date
        });

      if (day.recovered)
        recoveredData.push({
          y: day.recovered,
          t: date
        });
    });

    const lineSettings = {
      type: 'line',
      lineTension: 0.1,
      spanGaps: true,
      fill: false
    };

    const data = {
      datasets: [
        {
          label: 'Total Cases',
          borderColor: '#FF00FF',
          backgroundColor: '#FFFFFF',
          borderWidth: 1.5,
          data: casesData,
          ...lineSettings
        },
        {
          label: 'Active Cases',
          borderColor: '#FF0000',
          backgroundColor: '#FF0000',
          data: activeData,
          ...lineSettings
        },
        {
          label: 'Deaths',
          borderColor: '#00FF00',
          backgroundColor: '#00FF00',
          data: deathsData,
          ...lineSettings
        },
        {
          label: 'Recovered',
          borderColor: '#0000FF',
          backgroundColor: '#0000FF',
          data: recoveredData,
          ...lineSettings
        }
      ]
    };

    options.scales.xAxes[0].ticks.max = casesData[casesData.length - 1].t;
    options.title.text = location.name;
    changeSizes(options);

    if (chart) {
      chart.options = options;
      chart.data = data;
      chart.update();
      chart.render();
    } else {
      Chart.defaults.global.defaultFontFamily = 'aglet-slab, sans-serif';
      Chart.defaults.global.defaultFontSize = 16;
      Chart.defaults.global.defultFontColor = '#334E62';

      chart = new Chart('graph', { data, options });
    }

    document.getElementById('graph-elements').style.visibility = 'visible';
  };

  /* globals mapboxgl, document, window */

  mapboxgl.accessToken = 'pk.eyJ1IjoibGF6ZCIsImEiOiJjazd3a3VoOG4wM2RhM29rYnF1MDJ2NnZrIn0.uPYVImW8AVA71unqE8D8Nw';

  const data = {};

  let map$1;

  let currentType = 'cases';
  let currentDate;
  let currentData;

  function findFeature(id) {
    return data.features.features.find(feature => feature.properties.id === id);
  }

  function initData() {
    let foundFeatures = 0;
    data.locations.forEach(function(location, index) {
      // Associated the feature with the location
      if (location.featureId !== undefined && !location.city) {
        const feature = findFeature(location.featureId);
        if (feature) {
          foundFeatures++;
          feature.properties.locationId = index;
        } else {
          console.log('Failed to find feature for', location);
        }
      }
    });

    data.features.features.forEach(function(feature, index) {
      feature.id = index;
    });

    console.log('Found locations for %d of %d features', foundFeatures, data.features.features.length);
  }

  function generateCountyFeatures() {
    const countyFeatures = {
      type: 'FeatureCollection',
      features: data.features.features.filter(
        feature =>
          data.locations[feature.properties.locationId] &&
          data.locations[feature.properties.locationId].level === 'county'
      )
    };
    return countyFeatures;
  }

  function generateStateFeatures() {
    const stateFeatures = {
      type: 'FeatureCollection',
      features: data.features.features.filter(
        feature =>
          data.locations[feature.properties.locationId] && data.locations[feature.properties.locationId].level === 'state'
      )
    };
    return stateFeatures;
  }

  function generateCountryFeatures() {
    const countryFeatures = {
      type: 'FeatureCollection',
      features: data.features.features.filter(
        feature =>
          data.locations[feature.properties.locationId] &&
          data.locations[feature.properties.locationId].level === 'country'
      )
    };
    return countryFeatures;
  }

  function setData() {
    const countyFeatures = generateCountyFeatures();
    const stateFeatures = generateStateFeatures();
    const countryFeatures = generateCountryFeatures();

    map$1.getSource('CDS-county').setData(countyFeatures);
    map$1.getSource('CDS-state').setData(stateFeatures);
    map$1.getSource('CDS-country').setData(countryFeatures);
  }

  function updateMap(date, type) {
    currentType = type || currentType;
    currentDate = date || Object.keys(data.timeseries).pop();
    currentData = data.timeseries[currentDate];

    let worstAffectedPercent = 0;
    let lowestInfectionPercent = Infinity;

    let chartDataMin;
    let chartDataMax;
    let lowestLocation = null;
    let highestLocation = null;

    data.locations.forEach(function(location, index) {
      // Calculate worst affected percent
      if (location.population) {
        const locationData = currentData[index];
        if (locationData) {
          const infectionPercent = locationData[currentType] / location.population;
          if (infectionPercent > worstAffectedPercent) {
            worstAffectedPercent = infectionPercent;
            highestLocation = location;
          }

          // Calculate least affected percent
          if (infectionPercent !== 0 && infectionPercent < lowestInfectionPercent) {
            lowestInfectionPercent = infectionPercent;
            lowestLocation = location;
          }
          chartDataMax = worstAffectedPercent;
          chartDataMin = lowestInfectionPercent;
        }
      }
    });

    data.features.features.forEach(function(feature) {
      let regionColor = null;
      const { locationId } = feature.properties;
      const location = data.locations[locationId];
      if (location && location.population) {
        const locationData = currentData[locationId];
        if (locationData) {
          if (locationData[currentType] === 0) {
            regionColor = noCasesColor;
          } else {
            regionColor = getScaledColorValue(location, locationData, currentType, worstAffectedPercent);
          }
        }
      }

      feature.properties.color = regionColor || noPopulationDataColor;
    });

    console.log('Lowest infection', lowestLocation);
    console.log('Highest infection', highestLocation);

    createLegend(chartDataMin, chartDataMax, currentType === 'deaths' ? 'passed away' : 'infected');

    setData();
  }

  window.updateMap = updateMap;

  function populateMap() {
    initData();

    /**
     * @param {{ name: string; population: string?; }} location
     * @param {{ cases: number; deaths:number?; recovered:number?; active:number?; }} locationData
     */
    function popupTemplate(location, locationData) {
      let htmlString = `<div class="cds-Popup">`;
      htmlString += `<h6 class="spectrum-Heading spectrum-Heading--XXS">${location.name}</h6>`;
      htmlString += `<table class="cds-Popup-table spectrum-Body spectrum-Body--XS"><tbody>`;
      if (locationData.cases !== undefined) {
        htmlString += `<tr><th>Cases:</th><td>${locationData.cases.toLocaleString()}</td></tr>`;
      }
      if (locationData.deaths !== undefined) {
        htmlString += `<tr><th>Deaths:</th><td>${locationData.deaths.toLocaleString()}</td></tr>`;
      }
      if (locationData.recovered !== undefined) {
        htmlString += `<tr><th>Recovered:</th><td>${locationData.recovered.toLocaleString()}</td></tr>`;
      }
      if (locationData.active && locationData.active !== locationData.cases) {
        htmlString += `<tr><th>Active:</th><td>${locationData.active.toLocaleString()}</td></tr>`;
      }
      if (location.population && locationData.cases) {
        htmlString += `<tr><th>Infected:</th><td>${getRatio(locationData.cases, location.population)} (${getPercent(
        locationData.cases,
        location.population
      )})</td></tr>`;
      }
      if (location.population && locationData.deaths) {
        htmlString += `<tr><th>Deaths:</th><td>${getRatio(locationData.deaths, location.population)} (${getPercent(
        locationData.deaths,
        location.population
      )})</td></tr>`;
      }
      if (location.population !== undefined) {
        htmlString += `<tr><th>Population:</th><td>${location.population.toLocaleString()}</td></tr>`;
        if (location.populationDensity !== undefined) {
          let density = location.populationDensity / 0.621371;
          if (density < 1) {
            density = (location.populationDensity / 0.621371).toFixed(2);
          } else {
            density = Math.floor(density);
          }
          htmlString += `<tr><th>Density:</th><td>${density.toLocaleString()} persons / sq. mi</td></tr>`;
        }
      } else {
        htmlString += `<tr><th colspan="2">NO POPULATION DATA</th></tr>`;
      }
      htmlString += `<tr><th>Source:</th><td>${getSource(location, { link: false, shortNames: true })}</td></tr>`;
      htmlString += `</tbody></table>`;
      htmlString += `</div>`;
      return htmlString;
    }

    const paintConfig = {
      // 'fill-outline-color': 'rgba(255, 255, 255, 1)',
      'fill-color': ['get', 'color'],
      'fill-outline-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        outlineColorHighlight,
        outlineColor
      ],
      'fill-opacity': 1
    };

    const { layers } = map$1.getStyle();
    // Find the index of the first symbol layer (the label layer) in the map style
    let labelLayerId;
    for (let i = 0; i < layers.length; i++) {
      if (layers[i].type === 'symbol') {
        labelLayerId = layers[i].id;
        break;
      }
    }

    map$1.addSource('CDS-country', {
      type: 'geojson',
      data: null
    });

    map$1.addLayer(
      {
        id: 'CDS-country',
        type: 'fill',
        source: 'CDS-country',
        layout: {},
        paint: paintConfig
      },
      // Place layer underneath label layer of template map.
      labelLayerId
    );

    map$1.addSource('CDS-state', {
      type: 'geojson',
      data: null
    });

    map$1.addLayer(
      {
        id: 'CDS-state',
        type: 'fill',
        source: 'CDS-state',
        layout: {},
        paint: paintConfig
      },
      labelLayerId
    );

    map$1.addSource('CDS-county', {
      type: 'geojson',
      data: null
    });

    map$1.addLayer(
      {
        id: 'CDS-county',
        type: 'fill',
        source: 'CDS-county',
        layout: {},
        paint: paintConfig
      },
      labelLayerId
    );

    // Level Toggle
    class ToggleDataLevelControl {
      onAdd(map) {
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl cds-MapControl';
        this._container.innerHTML = `
        <label class="cds-MapToggle"><input type="checkbox" name="country" checked> Show Countries</label>
        <label class="cds-MapToggle"><input type="checkbox" name="state" checked> Show States</label>
        <label class="cds-MapToggle"><input type="checkbox" name="county" checked> Show Counties</label>
        `;

        this._container.addEventListener('change', evt => {
          const { target } = evt;
          const visibility = target.checked ? 'visible' : 'none';
          const { name } = evt.target;
          map.setLayoutProperty(`CDS-${name}`, 'visibility', visibility);
        });

        return this._container;
      }

      onRemove() {
        this._container.parentNode.removeChild(this._container);
      }
    }

    map$1.addControl(new ToggleDataLevelControl(), 'top-left');

    // Date selector
    class DateSelector {
      onAdd() {
        const dates = Object.keys(data.timeseries);
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];

        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl cds-MapControl';
        this._container.innerHTML = `
        <input type="date" min="${firstDate}" max="${lastDate}" value="${lastDate}" class="cds-Map-datePicker" aria-label="Date">
      `;

        this._container.addEventListener('input', evt => {
          const { target } = evt;
          const date = target.value;
          if (dates.includes(date)) {
            updateMap(date);
          }
        });

        return this._container;
      }

      onRemove() {
        this._container.parentNode.removeChild(this._container);
      }
    }

    map$1.addControl(new DateSelector(), 'top-right');

    // Case thpe selector
    class CaseTypeSelector {
      onAdd() {
        this._container = document.createElement('div');
        this._container.className = 'mapboxgl-ctrl cds-MapControl';
        this._container.innerHTML = `
        <select>
          <option value="cases">Cases</option>
          <option value="deaths">Deaths</option>
        </select>
      `;

        this._container.addEventListener('change', evt => {
          const { target } = evt;
          currentType = target.value;
          updateMap(currentDate, currentType);
        });

        return this._container;
      }

      onRemove() {
        this._container.parentNode.removeChild(this._container);
      }
    }

    map$1.addControl(new CaseTypeSelector(), 'top-left');

    setData();

    // Create a popup, but don't add it to the map yet.
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    let hoveredFeatureId = null;
    let hoveredFeatureSource = null;

    function handleMouseLeave() {
      map$1.getCanvas().style.cursor = '';
      popup.remove();
      if (hoveredFeatureId) {
        map$1.setFeatureState({ source: 'CDS-state', id: hoveredFeatureId }, { hover: false });
      }
    }

    function handleMouseClick(e) {
      if (e.features.length > 0) {
        e.preventDefault();
        const feature = e.features[0];

        const { locationId } = feature.properties || {};
        const location = data.locations[locationId] || {};
        const locationData = Object.keys(data.timeseries).map(date => {
          return {
            date,
            ...data.timeseries[date][locationId]
          };
        });

        showGraph(location, locationData);
      }
    }

    function handleMouseMove(e) {
      if (e.features.length > 0) {
        e.preventDefault();
        const feature = e.features[0];

        const { locationId } = feature.properties || {};
        const location = data.locations[locationId] || {};
        const locationData = currentData[locationId] || {};

        if (hoveredFeatureId) {
          map$1.setFeatureState({ source: hoveredFeatureSource, id: hoveredFeatureId }, { hover: false });
        }

        hoveredFeatureId = feature.id;
        hoveredFeatureSource = `CDS-${getLocationGranularityName(location)}`;

        if (hoveredFeatureId) {
          map$1.setFeatureState({ source: hoveredFeatureSource, id: hoveredFeatureId }, { hover: true });
        }

        // Change the cursor style as a UI indicator.
        map$1.getCanvas().style.cursor = 'pointer';

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup
          .setLngLat(e.lngLat)
          .setHTML(popupTemplate(location, locationData))
          .addTo(map$1);
      }
    }

    // When the user moves their mouse over the state-fill layer, we'll update the
    // feature state for the feature under the mouse.
    map$1.on('mousemove', 'CDS-country', handleMouseMove);
    map$1.on('mousemove', 'CDS-state', handleMouseMove);
    map$1.on('mousemove', 'CDS-county', handleMouseMove);

    // When the mouse leaves the state-fill layer, update the feature state of the
    // previously hovered feature.
    map$1.on('mouseleave', 'CDS-country', handleMouseLeave);
    map$1.on('mouseleave', 'CDS-state', handleMouseLeave);
    map$1.on('mouseleave', 'CDS-county', handleMouseLeave);

    // When the user clicks, open a timeseries graph
    map$1.on('click', 'CDS-country', handleMouseClick);
    map$1.on('click', 'CDS-state', handleMouseClick);
    map$1.on('click', 'CDS-county', handleMouseClick);
    updateMap();
  }

  let rendered = false;
  function showMap() {
    if (rendered) {
      return;
    }
    rendered = true;

    document.body.classList.add('is-editing');

    map$1 = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/lazd/ck7wkzrxt0c071ip932rwdkzj',
      center: [-121.403732, 40.492392],
      zoom: 3
    });

    let remaining = 0;
    function handleLoaded() {
      remaining--;
      if (remaining === 0) {
        if (map$1.loaded()) {
          populateMap();
        } else {
          map$1.once('load', populateMap);
        }
      }
    }

    function loadData(url, field, callback) {
      remaining++;
      json(url, function(obj) {
        data[field] = obj;
        if (typeof callback === 'function') {
          callback(obj);
        }
        handleLoaded();
      });
    }

    loadData('locations.json', 'locations');
    loadData('timeseries.json', 'timeseries');
    loadData('features.json', 'features');
  }

  /* global document, history, Handsontable, Papa, JSONFormatter */

  function showFile(url$1, dataLevels, noPush) {
    document.body.classList.add('is-editing');

    const editor = document.querySelector('.cds-FileEditor');

    url(url$1, function() {
      editor.querySelector('.cds-Heading').innerText = url$1;

      const extension = url$1.split('.').pop();

      editor.querySelector('.cds-Editor-download').href = url$1;
      if (extension === 'json') {
        let obj;
        try {
          obj = JSON.parse(this.responseText);
        } catch (error) {
          editor.querySelector(
            '.cds-FileEditor-content'
          ).innerHTML = `<div class="cds-Error">Failed to load ${url$1}: ${error}</div>`;
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
        .querySelector(`a[href="${url$1}"]`)
        .closest('.spectrum-SideNav-item')
        .classList.add('is-selected');
    });

    if (!noPush) {
      history.pushState(null, '', `#${url$1}`, '');
    }
  }

  /* global document, window */

  function getContributorsHeading(contributors, byString) {
    let html = '';

    if (contributors) {
      html += `<h3 class="spectrum-Body spectrum-Body--XL cds-ReportCard-contributorName">${byString} `;
      html += getContributors(contributors);
      html += `</h3>`;
    }

    return html;
  }

  function ratingTemplate(source, index) {
    const typeIcons = {
      json: '✅',
      csv: '✅',
      table: '⚠️',
      list: '❌',
      paragraph: '🤮',
      pdf: '🤮'
    };
    const typeNames = {
      json: 'JSON',
      pdf: 'PDF',
      csv: 'CSV'
    };

    let granular = source.city || source.county;
    let granularity = 'country-level';
    if (source.city || source.aggregate === 'city') {
      granularity = 'city-level';
      granular = true;
    } else if (source.county || source.aggregate === 'county') {
      granularity = 'county-level';
      granular = true;
    } else if (source.state || source.aggregate === 'state') {
      granularity = 'state-level';
    }

    const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
    const slug = `sources:${getName(source)
    .replace(/,/g, '-')
    .replace(/\s/g, '')}`;

    const curators = getContributorsHeading(source.curators, 'Curated by');
    const sources = getContributorsHeading(source.sources, 'Sourced from');
    const maintainers = getContributorsHeading(source.maintainers, 'Maintained by');
    return `
  <li class="cds-ReportCard" id="${slug}">
    <div class="cds-ReportCard-grade cds-ReportCard-grade--${getGrade(source.rating).replace(
      /[^A-Z]+/g,
      ''
    )}">${getGrade(source.rating).replace(/([+-])/, '<span class="cds-ReportCard-plusMinus">$1</span>')}</div>
    <div class="cds-ReportCard-content">
      <h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" target="_blank" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${index +
    1}. ${getName(source)}</a></h2>
      ${sources}
      ${curators}
      ${maintainers}
      <h4 class="spectrum-Body spectrum-Body--XL cds-ReportCard-sourceURL">Data from <a href="${
        source.url
      }" class="spectrum-Link" target="_blank">${sourceURLShort}</a></h4>
      <div class="cds-ReportCard-criteria">
        <div class="cds-ReportCard-criterion">
          ${typeIcons[source.type]} ${typeNames[source.type] ||
    source.type.substr(0, 1).toUpperCase() + source.type.substr(1)}
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.timeseries ? '✅' : '❌'} Timeseries
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.aggregate ? '✅' : '❌'} Aggregate
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.ssl ? '✅' : '❌'} SSL
        </div>
        <div class="cds-ReportCard-criterion">
          ${source.headless ? '❌' : '✅'} ${source.headless ? 'Requires' : ' Does not require'} JavaScript
        </div>
        <div class="cds-ReportCard-criterion">
          ${granular ? '✅' : '❌'} Granularity (${granularity})
        </div>
      </div>
    </div>
  </li>
`;
  }

  function showSources() {
    const list = document.querySelector('.cds-Sources-list');
    json('ratings.json', function(ratings) {
      list.innerHTML = '';
      for (let i = 0; i < ratings.length; i++) {
        list.insertAdjacentHTML('beforeend', ratingTemplate(ratings[i], i));
      }
      if (window.location.hash.includes(':')) {
        document.getElementById(window.location.hash.substr(1)).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  /* global document, window */

  function getClassNames(classNames) {
    return Object.entries(classNames)
      .reduce((a, [className, use]) => {
        if (use) {
          a.push(className);
        }
        return a;
      }, [])
      .join(' ');
  }

  function crossCheckReportTemplate(report) {
    const locationName = getName(report.location);
    const slug = `crosscheck:${locationName.replace(/,/g, '-').replace(/\s/g, '')}`;

    let html = `<li class="cds-CrossCheckReport" id="${slug}">`;
    html += `<h2 class="spectrum-Heading spectrum-Heading--L"><a href="#${slug}" class="spectrum-Link spectrum-Link--quiet spectrum-Link--silent">${locationName}</a></h2>`;

    html += `<div class="cds-SourceComparison">`;

    const metrics = ['cases', 'deaths', 'tested', 'recovered'];

    html += `
      <table>
        <thead>
          <td></td>
  `;

    for (const metric of metrics) {
      const classNames = {
        'cds-SourceComparison-metric': true,
        'cds-SourceComparison-discrepancyMetric': report.discrepancies.includes(metric),
        'cds-SourceComparison-agreedMetric': report.agreements.includes(metric)
      };

      html += `<th class="${getClassNames(classNames)}">${metric}</td>`;
    }

    html += `
        </thead>
        <tbody>
  `;

    report.sources.forEach((source, index) => {
      html += `
            <tr>
    `;
      const sourceURLShort = source.url.match(/^(?:https?:\/\/)?(?:[^@/\n]+@)?(?:www\.)?([^:/?\n]+)/)[1];
      const curators = getContributors(source.curators, { shortNames: true, link: false });
      const sources = getContributors(source.sources, { shortNames: true, link: false });
      html += `<th class="cds-SourceComparison-source">`;
      if (index === report.used) {
        html += '✅ ';
      }
      html += `<a class="spectrum-Link" target="_blank" href="${source.url}">`;
      if (source.curators) {
        html += `<strong>${curators}</strong>`;
      } else if (source.sources) {
        html += `<strong>${sources}</strong>`;
      } else {
        html += `<strong>${sourceURLShort}</strong>`;
      }
      html += `</a>`;
      html += `</th>`;

      for (const metric of metrics) {
        html += `<td class="cds-SourceComparison-value${
        report.discrepancies.includes(metric) ? ' cds-SourceComparison-discrepancyValue' : ''
      }">${source[metric] === undefined ? '-' : source[metric]}</td>`;
      }

      html += `
            </tr>
    `;
    });

    html += `
        </tbody>
      </table>
  `;

    html += `</div>`;

    html += `</li>`;

    return html;
  }

  function generateCrossCheckReport(reports) {
    let html = '';
    for (const [, crosscheckReport] of Object.entries(reports)) {
      // Only show reports where we disgaree
      if (crosscheckReport.discrepancies.length !== 0) {
        html += crossCheckReportTemplate(crosscheckReport);
      }
    }
    return html;
  }

  function generateCrossCheckPage(report, date) {
    let html = `<h1 class="spectrum-Heading spectrum-Heading--L">Cross-check reports</h1>`;

    const totalReports = Object.keys(report).length;

    const identicalReports = Object.values(report).filter(r => r.discrepancies.length === 0).length;

    if (report && Object.keys(report).length) {
      html += `<p class="spectrum-Body spectrum-Body--L">A total of ${totalReports.toLocaleString()} cross-check reports were generated for ${date}.</p>`;
      if (identicalReports !== 0) {
        html += `<p class="spectrum-Body spectrum-Body--L">${identicalReports.toLocaleString()} cross-checks resulted in no discrepancies and are not shown below.</p>`;
      }

      html += `<ol class="cds-CrossCheckReports-list">
      ${generateCrossCheckReport(report)}
    </ol>`;
    } else {
      html += '<strong>No cross-check reports were generated.</strong>';
    }

    return html;
  }

  function showCrossCheckReport() {
    const reportContainer = document.querySelector('.cds-CrossCheckReports-page');
    json('report.json', function(report) {
      reportContainer.innerHTML = generateCrossCheckPage(report.scrape.crosscheckReports, report.date);

      if (window.location.hash.includes(':')) {
        document.getElementById(window.location.hash.substr(1)).scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  /* global document, window, history */

  const pages = {
    '#home': '.cds-Home',
    '#editor': '.cds-FileEditor',
    '#sources': '.cds-Sources',
    '#crosscheck': '.cds-CrossCheckReports',
    '#features.json': '.cds-Map'
  };

  const routes = {
    '#sources': showSources,
    '#crosscheck': showCrossCheckReport,
    '#home': function() {},
    '#features.json': showMap
  };

  let sidebar;
  let overlay;
  let currentPage = null;

  function openSidebar() {
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
  }

  function showPage(pageToShow, noPush) {
    // Set selected
    const currentSideLink =
      document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow}"]`) ||
      document.querySelector(`.spectrum-SideNav-item a[href="${pageToShow.replace('#', '')}"]`);
    const currentSideItem = currentSideLink && currentSideLink.closest('.spectrum-SideNav-item');
    const otherSideItem = document.querySelector('.spectrum-SideNav-item.is-selected');
    if (otherSideItem) {
      otherSideItem.classList.remove('is-selected');
    }
    if (currentSideItem) {
      currentSideItem.classList.add('is-selected');
    }

    for (const page in pages) {
      const selector = pages[page];
      if (page === pageToShow) {
        document.querySelector(selector).hidden = false;
      } else {
        document.querySelector(selector).hidden = true;
      }
    }

    document.body.classList.remove('is-editing');

    if (routes[pageToShow]) {
      if (!noPush) {
        history.pushState(null, '', pageToShow);
      }
      routes[pageToShow]();
    }

    currentPage = pageToShow;

    closeSidebar();
  }

  function getHashStart() {
    return window.location.hash.split(':')[0];
  }

  function handleHashChange() {
    if (window.location.hash) {
      if (routes[getHashStart()]) {
        if (currentPage !== getHashStart()) {
          showPage(getHashStart(), true);
        }
      } else if (window.location.hash.match('.csv') || window.location.hash.match('.json')) {
        showPage('#editor');
        showFile(window.location.hash.substr(1), null, true);
      }
    } else {
      showPage('#home', false);
    }
  }

  window.addEventListener('hashchange', handleHashChange, false);

  document.addEventListener('click', function(evt) {
    // Sidebar
    const button = evt.target.closest('button');
    if (button && button.classList.contains('js-toggleMenu')) {
      openSidebar();
    }

    if (evt.target.closest('.spectrum-Site-overlay')) {
      closeSidebar();
    }

    // Navigation
    const target = evt.target.closest('a');
    if (target) {
      if (target.tagName === 'A' && target.hasAttribute('download') && !target.hasAttribute('data-noview')) {
        // Stop download
        evt.preventDefault();

        const url = target.getAttribute('href');
        if (url === 'features.json') {
          showPage('#features.json');
        } else {
          showPage('#editor');
          showFile(url, target.getAttribute('data-levels'));
        }
      } else if (target.tagName === 'A' && routes[target.getAttribute('href')]) {
        // Stop download
        evt.preventDefault();

        showPage(target.getAttribute('href'));
      }
    }
  });

  document.addEventListener('DOMContentLoaded', function() {
    sidebar = document.querySelector('.spectrum-Site-sideBar');
    overlay = document.querySelector('.spectrum-Site-overlay');

    // Init
    handleHashChange();
  });

}());
//# sourceMappingURL=index.js.map
