(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[16],{

/***/ 511:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * @typedef {{}} CodeV2
 * @property {number} version
 * @property {string} type
 * @property {number} uid
 * @property {string} title
 * @property {string} icon
 * @property {string} desc
 * @property {string} updateUrl
 * @property {string} downloadUrl
 * @property {string} tVersion
 * @property {CodeV2Search} search
 */

/**
 * @typedef {{}} CodeV2Search
 * @property {string} [loginUrl]
 * @property {string} [loginFormSelector]
 * @property {string} searchUrl
 * @property {string} nextPageSelector
 * @property {string} [baseUrl]
 * @property {string} [requestType]
 * @property {string} [requestData]
 * @property {string} [requestMimeType]
 * @property {{name,type}[]} [onBeforeRequest]
 * @property {{}} listItemSelector
 * @property {[number, number]} [listItemSplice]
 * @property {{}} torrentSelector
 * @property {string|{selector,attr}} [torrentSelector.categoryTitle]
 * @property {{selector,attr}} [torrentSelector.categoryUrl]
 * @property {string} [torrentSelector.title]
 * @property {{selector,attr}} [torrentSelector.url]
 * @property {string|{selector,attr}} [torrentSelector.size]
 * @property {{selector,attr}} [torrentSelector.downloadUrl]
 * @property {string} [torrentSelector.seed]
 * @property {string} [torrentSelector.peer]
 * @property {string|{selector,attr}} [torrentSelector.date]
 * @property {{}} onGetValue
 * @property {{name,re,text}[]} [onGetValue.categoryTitle]
 * @property {{name,re,text}[]} [onGetValue.categoryUrl]
 * @property {{name,re,text}[]} [onGetValue.title]
 * @property {{name,re,text}[]} [onGetValue.url]
 * @property {{name,re,text}[]} [onGetValue.size]
 * @property {{name,re,text}[]} [onGetValue.downloadUrl]
 * @property {{name,re,text}[]} [onGetValue.seed]
 * @property {{name,re,text}[]} [onGetValue.peer]
 * @property {{name,re,text}[]|string[]|{name,format}[]} [onGetValue.date]
 */
const convertCodeV1toV2 = code => {
  const codeV2 = {};
  codeV2.version = 2;
  codeV2.type = 'kit';
  codeV2.uid = code.uid;
  codeV2.icon = code.icon;
  codeV2.title = code.name;
  codeV2.desc = code.about;
  const search = codeV2.search = {};
  const torrentSelector = search.torrentSelector = {};
  const onGetValue = search.onGetValue = {};
  search.searchUrl = code.search_path;

  if (code.root_url) {
    search.baseUrl = code.root_url;
  }

  if (code.auth) {
    search.loginUrl = code.auth;
  }

  if (code.post) {
    search.requestType = 'POST';
    search.requestData = code.post;
  }

  if (code.encode) {
    search.onBeforeRequest = [{
      name: 'encode',
      type: 'cp1251'
    }];
  }

  search.listItemSelector = code.items;

  if (code.charset) {
    search.requestMimeType = 'text/html; charset=' + code.charset;
  }

  if (code.cat_alt) {
    code.cat_attr = 'alt';
    code.cat_alt = undefined;
  }

  if (code.auth_f) {
    search.loginFormSelector = code.auth_f;
  }

  if (code.sf || code.sl) {
    search.listItemSplice = [code.sf || 0, -(code.sl || 0)];
  }

  torrentSelector.title = code.tr_name;
  torrentSelector.url = {
    selector: code.tr_link,
    attr: 'href'
  };

  if (code.cat_name) {
    torrentSelector.categoryTitle = code.cat_name;

    if (code.cat_attr) {
      torrentSelector.categoryTitle = {
        selector: torrentSelector.categoryTitle,
        attr: code.cat_attr
      };
    }

    if (code.cat_link) {
      torrentSelector.categoryUrl = {
        selector: code.cat_link,
        attr: 'href'
      };
    }
  }

  if (code.tr_size) {
    torrentSelector.size = code.tr_size;

    if (code.size_attr) {
      torrentSelector.size = {
        selector: torrentSelector.size,
        attr: code.size_attr
      };
    }

    const sizeFuncList = [];

    if (code.size_r && code.size_rp !== undefined) {
      sizeFuncList.push({
        name: 'replaceRe',
        re: code.size_r,
        text: code.size_rp
      });
    }

    if (code.s_c) {
      sizeFuncList.push('convertSize');
    }

    if (sizeFuncList.length) {
      onGetValue.size = sizeFuncList;
    }
  }

  if (code.tr_dl) {
    torrentSelector.downloadUrl = {
      selector: code.tr_dl,
      attr: 'href'
    };
  }

  if (code.seed) {
    torrentSelector.seed = code.seed;

    if (code.seed_r) {
      onGetValue.seed = [{
        name: 'replaceRe',
        re: code.seed_r,
        text: code.seed_rp
      }];
    }
  }

  if (code.peer) {
    torrentSelector.peer = code.peer;

    if (code.peer_r) {
      onGetValue.peer = [{
        name: 'replaceRe',
        re: code.peer_r,
        text: code.peer_rp
      }];
    }
  }

  if (code.date) {
    torrentSelector.date = code.date;

    if (code.date_attr) {
      torrentSelector.date = {
        selector: torrentSelector.date,
        attr: code.date_attr
      };
    }

    const dateFuncList = [];

    if (code.t_r) {
      dateFuncList.push({
        name: 'replaceRe',
        re: code.t_r,
        text: code.t_r_r
      });
    }

    if (code.t_t_r) {
      dateFuncList.push('replaceToday');
    }

    if (code.t_m_r) {
      dateFuncList.push('replaceMonth');
    }

    if (code.t_f !== undefined && code.t_f !== "-1") {
      dateFuncList.push({
        name: 'timeFormat',
        format: code.t_f
      });
    }

    if (dateFuncList.length) {
      onGetValue.date = dateFuncList;
    }
  }

  return codeV2;
};

/* harmony default export */ __webpack_exports__["a"] = (convertCodeV1toV2);

/***/ }),

/***/ 512:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var core_js_modules_es_symbol_description__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(112);
/* harmony import */ var core_js_modules_es_symbol_description__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_symbol_description__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(138);
/* harmony import */ var core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_modules_web_dom_collections_for_each__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(33);
/* harmony import */ var core_js_modules_web_dom_collections_for_each__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_for_each__WEBPACK_IMPORTED_MODULE_2__);




const convertSelector = (selector, postProcess) => {
  const result = {
    selector: null,
    pipeline: []
  };

  if (!selector) {
    return undefined;
  }

  if (!Array.isArray(postProcess)) {
    postProcess = [];
  }

  if (typeof selector === 'string') {
    selector = {
      selector
    };
  }

  result.selector = selector.selector;

  if (typeof selector.childNodeIndex === 'number') {
    result.pipeline.push({
      name: 'getChild',
      args: [selector.childNodeIndex]
    });
  }

  if (selector.attr) {
    result.pipeline.push({
      name: 'getAttr',
      args: [selector.attr]
    });
  } else if (selector.prop) {
    result.pipeline.push({
      name: 'getProp',
      args: [selector.prop]
    });
  } else if (selector.html) {
    result.pipeline.push({
      name: 'getHtml'
    });
    result.pipeline.push({
      name: 'trim'
    });
  } else {
    result.pipeline.push({
      name: 'getText'
    });
    result.pipeline.push({
      name: 'trim'
    });
  }

  postProcess.forEach(item => {
    if (item === 'convertSize') {
      result.pipeline.push({
        name: 'legacySizeFormat'
      });
    } else if (item === 'replaceToday') {
      result.pipeline.push({
        name: 'legacyReplaceToday'
      });
    } else if (item === 'replaceMonth') {
      result.pipeline.push({
        name: 'legacyReplaceMonth'
      });
    } else if (item.name === 'replaceRe') {
      result.pipeline.push({
        name: 'replaceRe',
        args: [item.re, item.text]
      });
    } else if (item.name === 'timeFormat') {
      result.pipeline.push({
        name: 'legacyParseDate',
        args: [item.format]
      });
    }
  });
  return result;
};

const convertCodeV2toV3 =
/**CodeV2*/
code => {
  const
  /**CodeStore*/
  codeV3 = {};
  codeV3.version = 3;
  codeV3.type = 'kit';
  const search = codeV3.search = {};
  search.url = code.search.searchUrl;
  const method = code.search.requestType;

  if (method) {
    search.method = method.toUpperCase();
  }

  const data = code.search.requestData;

  if (data) {
    if (search.method === 'POST') {
      search.body = data;
    } else {
      search.query = data;
    }
  }

  const onBeforeRequest = code.search.onBeforeRequest;

  if (Array.isArray(onBeforeRequest)) {
    onBeforeRequest.some(item => {
      if (item.name === 'encode') {
        if (item.type === 'cp1251') {
          search.encoding = item.type;
          return true;
        }
      }
    });
  }

  const overrideMimeType = code.search.requestMimeType;

  if (overrideMimeType) {
    const m = /charset=([^;]+)/.exec(code.search.requestMimeType);

    if (m) {
      code.search.charset = m[1];
    }
  }

  const auth = codeV3.auth = {};
  const loginUrl = code.search.loginUrl;

  if (loginUrl) {
    auth.url = loginUrl;
  }

  const loginFormSelector = code.search.loginFormSelector;

  if (loginFormSelector) {
    auth.loginForm = {
      selector: loginFormSelector
    };
  }

  const selectors = codeV3.selectors = {};
  selectors.row = convertSelector(code.search.listItemSelector);

  if (codeV3.search.listItemSplice) {
    selectors.skipFromStart = code.search.listItemSplice[0];
    selectors.skipFromEnd = code.search.listItemSplice[1] * -1;
  }

  code.search.onGetValue = code.search.onGetValue || {};
  selectors.categoryTitle = convertSelector(code.search.torrentSelector.categoryTitle, code.search.onGetValue.categoryTitle);
  selectors.categoryUrl = convertSelector(code.search.torrentSelector.categoryUrl, code.search.onGetValue.categoryUrl);
  selectors.categoryId = convertSelector(code.search.torrentSelector.categoryId, code.search.onGetValue.categoryId);
  selectors.title = convertSelector(code.search.torrentSelector.title, code.search.onGetValue.title);
  selectors.url = convertSelector(code.search.torrentSelector.url, code.search.onGetValue.url);
  selectors.size = convertSelector(code.search.torrentSelector.size, code.search.onGetValue.size);
  selectors.downloadUrl = convertSelector(code.search.torrentSelector.downloadUrl, code.search.onGetValue.downloadUrl);
  selectors.seeds = convertSelector(code.search.torrentSelector.seed, code.search.onGetValue.seed);
  selectors.peers = convertSelector(code.search.torrentSelector.peer, code.search.onGetValue.peer);
  selectors.date = convertSelector(code.search.torrentSelector.date, code.search.onGetValue.date);
  selectors.nextPageUrl = convertSelector(code.search.nextPageSelector, code.search.onGetValue.nextPageSelector);
  const description = codeV3.description = {};
  description.icon = code.icon;
  description.name = code.title;

  if (code.desc) {
    description.description = code.desc;
  }

  if (code.updateUrl) {
    description.updateUrl = code.updateUrl;
  }

  if (code.downloadUrl) {
    description.downloadUrl = code.downloadUrl;
  }

  const baseUrl = code.search.baseUrl;

  if (baseUrl) {
    description.url = baseUrl;
  }

  description.version = code.tVersion;
  return codeV3;
};

/* harmony default export */ __webpack_exports__["a"] = (convertCodeV2toV3);

/***/ }),

/***/ 543:
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Note: This regex matches even invalid JSON strings, but since we’re
// working on the output of `JSON.stringify` we know that only valid strings
// are present (unless the user supplied a weird `options.indent` but in
// that case we don’t care since the output would be invalid anyway).
var stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;

module.exports = function stringify(passedObj, options) {
  var indent, maxLength, replacer;

  options = options || {};
  indent = JSON.stringify(
    [1],
    undefined,
    options.indent === undefined ? 2 : options.indent
  ).slice(2, -3);
  maxLength =
    indent === ""
      ? Infinity
      : options.maxLength === undefined
      ? 80
      : options.maxLength;
  replacer = options.replacer;

  return (function _stringify(obj, currentIndent, reserved) {
    // prettier-ignore
    var end, index, items, key, keyPart, keys, length, nextIndent, prettified, start, string, value;

    if (obj && typeof obj.toJSON === "function") {
      obj = obj.toJSON();
    }

    string = JSON.stringify(obj, replacer);

    if (string === undefined) {
      return string;
    }

    length = maxLength - currentIndent.length - reserved;

    if (string.length <= length) {
      prettified = string.replace(stringOrChar, function(match, stringLiteral) {
        return stringLiteral || match + " ";
      });
      if (prettified.length <= length) {
        return prettified;
      }
    }

    if (replacer != null) {
      obj = JSON.parse(string);
      replacer = undefined;
    }

    if (typeof obj === "object" && obj !== null) {
      nextIndent = currentIndent + indent;
      items = [];
      index = 0;

      if (Array.isArray(obj)) {
        start = "[";
        end = "]";
        length = obj.length;
        for (; index < length; index++) {
          items.push(
            _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
              "null"
          );
        }
      } else {
        start = "{";
        end = "}";
        keys = Object.keys(obj);
        length = keys.length;
        for (; index < length; index++) {
          key = keys[index];
          keyPart = JSON.stringify(key) + ": ";
          value = _stringify(
            obj[key],
            nextIndent,
            keyPart.length + (index === length - 1 ? 0 : 1)
          );
          if (value !== undefined) {
            items.push(keyPart + value);
          }
        }
      }

      if (items.length > 0) {
        return [start, indent + items.join(",\n" + nextIndent), end].join(
          "\n" + currentIndent
        );
      }
    }

    return string;
  })(passedObj, "", 0);
};


/***/ }),

/***/ 581:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./src/tools/convertCodeV1toV2.js
var convertCodeV1toV2 = __webpack_require__(511);

// EXTERNAL MODULE: ./src/tools/convertCodeV2toV3.js
var convertCodeV2toV3 = __webpack_require__(512);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.symbol.description.js
var es_symbol_description = __webpack_require__(112);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.iterator.js
var es_array_iterator = __webpack_require__(14);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__(23);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.search.js
var es_string_search = __webpack_require__(138);

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.dom-collections.iterator.js
var web_dom_collections_iterator = __webpack_require__(15);

// EXTERNAL MODULE: ./node_modules/core-js/modules/web.url.js
var web_url = __webpack_require__(181);

// CONCATENATED MODULE: ./src/tools/jsonToUserscript.js







const stringify = __webpack_require__(543);

const jsonToUserscript = json => {
  const meta = [];
  meta.push('==UserScript==');
  const uri = new URL(json.search.url);
  const description = json.description || {};
  meta.push(`@name ${description.name}`);

  if (description.description) {
    meta.push(`@description ${description.description}`);
  }

  if (description.icon) {
    meta.push(`@icon ${description.icon}`);
  }

  if (description.updateUrl) {
    meta.push(`@updateURL ${description.updateUrl}`);
  }

  if (description.downloadUrl) {
    meta.push(`@downloadURL ${description.downloadUrl}`);
  }

  if (description.url) {
    meta.push(`@trackerURL ${description.url}`);
  } else {
    meta.push(`@trackerURL ${uri.protocol}//${uri.hostname}`);
  }

  if (description.version) {
    meta.push(`@version ${json.description.version}`);
  } else {
    meta.push(`@version 1.0`);
  }

  meta.push(`@connect *://${uri.hostname}`);
  meta.push('@require exKit');
  meta.push('==/UserScript==');
  const code = [];
  code.push(...meta.map(line => `// ${line}`));
  code.push('');
  code.push(`const code = ${stringify(json)};`);
  code.push('');
  code.push('API_exKit(code);');
  return code.join('\n');
};

/* harmony default export */ var tools_jsonToUserscript = (jsonToUserscript);
// CONCATENATED MODULE: ./src/tools/jsonCodeToUserscript.js




const jsonCodeToUserscript = text => {
  let json = JSON.parse(text);

  if (json.version === 1) {
    json = Object(convertCodeV1toV2["a" /* default */])(json);
  }

  if (json.version === 2) {
    json = Object(convertCodeV2toV3["a" /* default */])(json);
  }

  return tools_jsonToUserscript(json);
};

/* harmony default export */ var tools_jsonCodeToUserscript = __webpack_exports__["default"] = (jsonCodeToUserscript);

/***/ })

}]);
//# sourceMappingURL=chunk-16.js.map