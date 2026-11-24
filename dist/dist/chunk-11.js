(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[11,0,19],{

/***/ 112:
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// `Symbol.prototype.description` getter
// https://tc39.es/ecma262/#sec-symbol.prototype.description

var $ = __webpack_require__(12);
var DESCRIPTORS = __webpack_require__(11);
var globalThis = __webpack_require__(5);
var call = __webpack_require__(13);
var uncurryThis = __webpack_require__(7);
var hasOwn = __webpack_require__(17);
var isCallable = __webpack_require__(8);
var isPrototypeOf = __webpack_require__(51);
var toString = __webpack_require__(30);
var defineBuiltInAccessor = __webpack_require__(52);
var copyConstructorProperties = __webpack_require__(132);

var NativeSymbol = globalThis.Symbol;
var SymbolPrototype = NativeSymbol && NativeSymbol.prototype;

if (DESCRIPTORS && isCallable(NativeSymbol) && (!('description' in SymbolPrototype) ||
  // Safari 12 bug
  NativeSymbol().description !== undefined
)) {
  var EmptyStringDescriptionStore = {};
  // wrap Symbol constructor for correct work with undefined description
  var SymbolWrapper = function Symbol() {
    var description = arguments.length < 1 || arguments[0] === undefined ? undefined : toString(arguments[0]);
    var result = isPrototypeOf(SymbolPrototype, this)
      // eslint-disable-next-line sonarjs/inconsistent-function-call -- ok
      ? new NativeSymbol(description)
      // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
      : description === undefined ? NativeSymbol() : NativeSymbol(description);
    if (description === '') EmptyStringDescriptionStore[result] = true;
    return result;
  };

  copyConstructorProperties(SymbolWrapper, NativeSymbol);
  // wrap Symbol.for for correct handling of empty string descriptions
  var nativeFor = SymbolWrapper['for'];
  SymbolWrapper['for'] = { 'for': function (key) {
    var stringKey = toString(key);
    var symbol = call(nativeFor, this, stringKey);
    if (stringKey === '') EmptyStringDescriptionStore[symbol] = true;
    return symbol;
  } }['for'];
  SymbolWrapper.prototype = SymbolPrototype;
  SymbolPrototype.constructor = SymbolWrapper;

  var NATIVE_SYMBOL = String(NativeSymbol('description detection')) === 'Symbol(description detection)';
  var thisSymbolValue = uncurryThis(SymbolPrototype.valueOf);
  var symbolDescriptiveString = uncurryThis(SymbolPrototype.toString);
  var regexp = /^Symbol\((.*)\)[^)]+$/;
  var replace = uncurryThis(''.replace);
  var stringSlice = uncurryThis(''.slice);

  defineBuiltInAccessor(SymbolPrototype, 'description', {
    configurable: true,
    get: function description() {
      var symbol = thisSymbolValue(this);
      if (hasOwn(EmptyStringDescriptionStore, symbol)) return '';
      var string = symbolDescriptiveString(symbol);
      var desc = NATIVE_SYMBOL ? stringSlice(string, 7, -1) : replace(string, regexp, '$1');
      return desc === '' ? undefined : desc;
    }
  });

  $({ global: true, constructor: true, forced: true }, {
    Symbol: SymbolWrapper
  });
}


/***/ }),

/***/ 124:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var apply = __webpack_require__(142);
var call = __webpack_require__(13);
var uncurryThis = __webpack_require__(7);
var fixRegExpWellKnownSymbolLogic = __webpack_require__(139);
var fails = __webpack_require__(6);
var anObject = __webpack_require__(19);
var isCallable = __webpack_require__(8);
var isObject = __webpack_require__(9);
var toIntegerOrInfinity = __webpack_require__(45);
var toLength = __webpack_require__(86);
var toString = __webpack_require__(30);
var requireObjectCoercible = __webpack_require__(44);
var advanceStringIndex = __webpack_require__(180);
var getMethod = __webpack_require__(58);
var getSubstitution = __webpack_require__(421);
var getRegExpFlags = __webpack_require__(125);
var regExpExec = __webpack_require__(140);
var wellKnownSymbol = __webpack_require__(10);

var REPLACE = wellKnownSymbol('replace');
var max = Math.max;
var min = Math.min;
var concat = uncurryThis([].concat);
var push = uncurryThis([].push);
var stringIndexOf = uncurryThis(''.indexOf);
var stringSlice = uncurryThis(''.slice);

var maybeToString = function (it) {
  return it === undefined ? it : String(it);
};

// IE <= 11 replaces $0 with the whole match, as if it was $&
// https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
var REPLACE_KEEPS_$0 = (function () {
  // eslint-disable-next-line regexp/prefer-escape-replacement-dollar-char -- required for testing
  return 'a'.replace(/./, '$0') === '$0';
})();

// Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
  if (/./[REPLACE]) {
    return /./[REPLACE]('a', '$0') === '';
  }
  return false;
})();

var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
  var re = /./;
  re.exec = function () {
    var result = [];
    result.groups = { a: '7' };
    return result;
  };
  // eslint-disable-next-line regexp/no-useless-dollar-replacements -- false positive
  return ''.replace(re, '$<a>') !== '7';
});

// @@replace logic
fixRegExpWellKnownSymbolLogic('replace', function (_, nativeReplace, maybeCallNative) {
  var UNSAFE_SUBSTITUTE = REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE ? '$' : '$0';

  return [
    // `String.prototype.replace` method
    // https://tc39.es/ecma262/#sec-string.prototype.replace
    function replace(searchValue, replaceValue) {
      var O = requireObjectCoercible(this);
      var replacer = isObject(searchValue) ? getMethod(searchValue, REPLACE) : undefined;
      return replacer
        ? call(replacer, searchValue, O, replaceValue)
        : call(nativeReplace, toString(O), searchValue, replaceValue);
    },
    // `RegExp.prototype[@@replace]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@replace
    function (string, replaceValue) {
      var rx = anObject(this);
      var S = toString(string);

      var functionalReplace = isCallable(replaceValue);
      if (!functionalReplace) replaceValue = toString(replaceValue);
      var flags = toString(getRegExpFlags(rx));

      if (
        typeof replaceValue == 'string' &&
        !~stringIndexOf(replaceValue, UNSAFE_SUBSTITUTE) &&
        !~stringIndexOf(replaceValue, '$<') &&
        !~stringIndexOf(flags, 'y')
      ) {
        var res = maybeCallNative(nativeReplace, rx, S, replaceValue);
        if (res.done) return res.value;
      }

      var global = !!~stringIndexOf(flags, 'g');
      var fullUnicode;
      if (global) {
        fullUnicode = !!~stringIndexOf(flags, 'u') || !!~stringIndexOf(flags, 'v');
        rx.lastIndex = 0;
      }

      var results = [];
      var result;
      while (true) {
        result = regExpExec(rx, S);
        if (result === null) break;

        push(results, result);
        if (!global) break;

        var matchStr = toString(result[0]);
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
      }

      var accumulatedResult = '';
      var nextSourcePosition = 0;
      for (var i = 0; i < results.length; i++) {
        result = results[i];

        var matched = toString(result[0]);
        var position = max(min(toIntegerOrInfinity(result.index), S.length), 0);
        var captures = [];
        var replacement;
        // NOTE: This is equivalent to
        //   captures = result.slice(1).map(maybeToString)
        // but for some reason `nativeSlice.call(result, 1, result.length)` (called in
        // the slice polyfill when slicing native arrays) "doesn't work" in safari 9 and
        // causes a crash (https://pastebin.com/N21QzeQA) when trying to debug it.
        for (var j = 1; j < result.length; j++) push(captures, maybeToString(result[j]));
        var namedCaptures = result.groups;
        if (functionalReplace) {
          var replacerArgs = concat([matched], captures, position, S);
          if (namedCaptures !== undefined) push(replacerArgs, namedCaptures);
          replacement = toString(apply(replaceValue, undefined, replacerArgs));
        } else {
          replacement = getSubstitution(matched, S, position, captures, namedCaptures, replaceValue);
        }
        if (position >= nextSourcePosition) {
          accumulatedResult += stringSlice(S, nextSourcePosition, position) + replacement;
          nextSourcePosition = position + matched.length;
        }
      }

      return accumulatedResult + stringSlice(S, nextSourcePosition);
    }
  ];
}, !REPLACE_SUPPORTS_NAMED_GROUPS || !REPLACE_KEEPS_$0 || REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE);


/***/ }),

/***/ 138:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var call = __webpack_require__(13);
var fixRegExpWellKnownSymbolLogic = __webpack_require__(139);
var anObject = __webpack_require__(19);
var isObject = __webpack_require__(9);
var requireObjectCoercible = __webpack_require__(44);
var sameValue = __webpack_require__(424);
var toString = __webpack_require__(30);
var getMethod = __webpack_require__(58);
var regExpExec = __webpack_require__(140);

// @@search logic
fixRegExpWellKnownSymbolLogic('search', function (SEARCH, nativeSearch, maybeCallNative) {
  return [
    // `String.prototype.search` method
    // https://tc39.es/ecma262/#sec-string.prototype.search
    function search(regexp) {
      var O = requireObjectCoercible(this);
      var searcher = isObject(regexp) ? getMethod(regexp, SEARCH) : undefined;
      if (searcher) return call(searcher, regexp, O);
      var S = toString(O);
      return new RegExp(regexp)[SEARCH](S);
    },
    // `RegExp.prototype[@@search]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@search
    function (string) {
      var rx = anObject(this);
      var S = toString(string);
      var res = maybeCallNative(nativeSearch, rx, S);

      if (res.done) return res.value;

      var previousLastIndex = rx.lastIndex;
      if (!sameValue(previousLastIndex, 0)) rx.lastIndex = 0;
      var result = regExpExec(rx, S);
      if (!sameValue(rx.lastIndex, previousLastIndex)) rx.lastIndex = previousLastIndex;
      return result === null ? -1 : result.index;
    }
  ];
});


/***/ }),

/***/ 141:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var fails = __webpack_require__(6);
var wellKnownSymbol = __webpack_require__(10);
var V8_VERSION = __webpack_require__(87);

var SPECIES = wellKnownSymbol('species');

module.exports = function (METHOD_NAME) {
  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/677
  return V8_VERSION >= 51 || !fails(function () {
    var array = [];
    var constructor = array.constructor = {};
    constructor[SPECIES] = function () {
      return { foo: 1 };
    };
    return array[METHOD_NAME](Boolean).foo !== 1;
  });
};


/***/ }),

/***/ 198:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(12);
var $trim = __webpack_require__(425).trim;
var forcedStringTrimMethod = __webpack_require__(426);

// `String.prototype.trim` method
// https://tc39.es/ecma262/#sec-string.prototype.trim
$({ target: 'String', proto: true, forced: forcedStringTrimMethod('trim') }, {
  trim: function trim() {
    return $trim(this);
  }
});


/***/ }),

/***/ 202:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return isNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return isElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "e", function() { return isString; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "d", function() { return isNumber; });
/* harmony import */ var _errors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(22);


const assertType = (inType, outType, fn) => {
  if (inType && outType) {
    return value => outType(fn(inType(value)));
  } else if (inType) {
    return value => fn(inType(value));
  } else {
    return value => outType(fn(value));
  }
};
/**
 * @param value
 * @return {Node}
 */


const isNode = value => {
  if (!value || !value.nodeType) {
    const err = new _errors__WEBPACK_IMPORTED_MODULE_0__[/* ErrorWithCode */ "b"]('Value is not Node', 'IS_NOT_NODE');
    err.value = value;
    throw err;
  }

  return value;
};
/**
 * @param value
 * @return {Element}
 */


const isElement = value => {
  if (!value || value.nodeType !== 1) {
    const err = new _errors__WEBPACK_IMPORTED_MODULE_0__[/* ErrorWithCode */ "b"]('Value is not Element', 'IS_NOT_ELEMENT');
    err.value = value;
    throw err;
  }

  return value;
};
/**
 * @param value
 * @return {String}
 */


const isString = value => {
  if (typeof value !== 'string') {
    const err = new _errors__WEBPACK_IMPORTED_MODULE_0__[/* ErrorWithCode */ "b"]('Value is not String', 'IS_NOT_STRING');
    err.value = value;
    throw err;
  }

  return value;
};
/**
 * @param value
 * @return {Number}
 */


const isNumber = value => {
  if (!Number.isFinite(value)) {
    const err = new _errors__WEBPACK_IMPORTED_MODULE_0__[/* ErrorWithCode */ "b"]('Value is not Finite Number', 'IS_NOT_NUMBER');
    err.value = value;
    throw err;
  }

  return value;
};

/* harmony default export */ __webpack_exports__["a"] = (assertType);


/***/ }),

/***/ 22:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return StatusCodeError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AbortError; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ErrorWithCode; });
class StatusCodeError extends Error {
  constructor(statusCode, body, options, response) {
    const message = statusCode + ' - ' + JSON.stringify(body);
    super(message);
    this.name = 'StatusCodeError';
    this.statusCode = statusCode;
    this.options = options;
    this.response = response;
  }

}

class AbortError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AbortError';
    this.code = 'EABORT';
  }

}

class ErrorWithCode extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }

}



/***/ }),

/***/ 23:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(12);
var $map = __webpack_require__(97).map;
var arrayMethodHasSpeciesSupport = __webpack_require__(141);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');

// `Array.prototype.map` method
// https://tc39.es/ecma262/#sec-array.prototype.map
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});


/***/ }),

/***/ 235:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var call = __webpack_require__(13);
var uncurryThis = __webpack_require__(7);
var fixRegExpWellKnownSymbolLogic = __webpack_require__(139);
var anObject = __webpack_require__(19);
var isObject = __webpack_require__(9);
var toLength = __webpack_require__(86);
var toString = __webpack_require__(30);
var requireObjectCoercible = __webpack_require__(44);
var getMethod = __webpack_require__(58);
var advanceStringIndex = __webpack_require__(180);
var getRegExpFlags = __webpack_require__(125);
var regExpExec = __webpack_require__(140);

var stringIndexOf = uncurryThis(''.indexOf);

// @@match logic
fixRegExpWellKnownSymbolLogic('match', function (MATCH, nativeMatch, maybeCallNative) {
  return [
    // `String.prototype.match` method
    // https://tc39.es/ecma262/#sec-string.prototype.match
    function match(regexp) {
      var O = requireObjectCoercible(this);
      var matcher = isObject(regexp) ? getMethod(regexp, MATCH) : undefined;
      if (matcher) return call(matcher, regexp, O);
      var S = toString(O);
      return new RegExp(regexp)[MATCH](S);
    },
    // `RegExp.prototype[@@match]` method
    // https://tc39.es/ecma262/#sec-regexp.prototype-@@match
    function (string) {
      var rx = anObject(this);
      var S = toString(string);
      var res = maybeCallNative(nativeMatch, rx, S);

      if (res.done) return res.value;

      var flags = toString(getRegExpFlags(rx));

      if (!~stringIndexOf(flags, 'g')) return regExpExec(rx, S);

      var fullUnicode = !!~stringIndexOf(flags, 'u') || !!~stringIndexOf(flags, 'v');
      rx.lastIndex = 0;
      var A = [];
      var n = 0;
      var result;
      while ((result = regExpExec(rx, S)) !== null) {
        var matchStr = toString(result[0]);
        A[n] = matchStr;
        if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
        n++;
      }
      return n === 0 ? null : A;
    }
  ];
});


/***/ }),

/***/ 365:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// a string of all valid unicode whitespaces
module.exports = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002' +
  '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';


/***/ }),

/***/ 366:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var tryToString = __webpack_require__(59);

var $TypeError = TypeError;

module.exports = function (O, P) {
  if (!delete O[P]) throw new $TypeError('Cannot delete property ' + tryToString(P) + ' of ' + tryToString(O));
};


/***/ }),

/***/ 419:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var isObject = __webpack_require__(9);
var classof = __webpack_require__(28);
var wellKnownSymbol = __webpack_require__(10);

var MATCH = wellKnownSymbol('match');

// `IsRegExp` abstract operation
// https://tc39.es/ecma262/#sec-isregexp
module.exports = function (it) {
  var isRegExp;
  return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classof(it) === 'RegExp');
};


/***/ }),

/***/ 420:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var defineProperty = __webpack_require__(24).f;

module.exports = function (Target, Source, key) {
  key in Target || defineProperty(Target, key, {
    configurable: true,
    get: function () { return Source[key]; },
    set: function (it) { Source[key] = it; }
  });
};


/***/ }),

/***/ 421:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var uncurryThis = __webpack_require__(7);
var toObject = __webpack_require__(34);

var floor = Math.floor;
var charAt = uncurryThis(''.charAt);
var replace = uncurryThis(''.replace);
var stringSlice = uncurryThis(''.slice);
// eslint-disable-next-line redos/no-vulnerable -- safe
var SUBSTITUTION_SYMBOLS = /\$([$&'`]|\d{1,2}|<[^>]*>)/g;
var SUBSTITUTION_SYMBOLS_NO_NAMED = /\$([$&'`]|\d{1,2})/g;

// `GetSubstitution` abstract operation
// https://tc39.es/ecma262/#sec-getsubstitution
module.exports = function (matched, str, position, captures, namedCaptures, replacement) {
  var tailPos = position + matched.length;
  var m = captures.length;
  var symbols = SUBSTITUTION_SYMBOLS_NO_NAMED;
  if (namedCaptures !== undefined) {
    namedCaptures = toObject(namedCaptures);
    symbols = SUBSTITUTION_SYMBOLS;
  }
  return replace(replacement, symbols, function (match, ch) {
    var capture;
    switch (charAt(ch, 0)) {
      case '$': return '$';
      case '&': return matched;
      case '`': return stringSlice(str, 0, position);
      case "'": return stringSlice(str, tailPos);
      case '<':
        capture = namedCaptures[stringSlice(ch, 1, -1)];
        break;
      default: // \d\d?
        var n = +ch;
        if (n === 0) return match;
        if (n > m) {
          var f = floor(n / 10);
          if (f === 0) return match;
          if (f <= m) return captures[f - 1] === undefined ? charAt(ch, 1) : captures[f - 1] + charAt(ch, 1);
          return match;
        }
        capture = captures[n - 1];
    }
    return capture === undefined ? '' : capture;
  });
};


/***/ }),

/***/ 424:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// `SameValue` abstract operation
// https://tc39.es/ecma262/#sec-samevalue
// eslint-disable-next-line es/no-object-is -- safe
module.exports = Object.is || function is(x, y) {
  // eslint-disable-next-line no-self-compare -- NaN check
  return x === y ? x !== 0 || 1 / x === 1 / y : x !== x && y !== y;
};


/***/ }),

/***/ 425:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var uncurryThis = __webpack_require__(7);
var requireObjectCoercible = __webpack_require__(44);
var toString = __webpack_require__(30);
var whitespaces = __webpack_require__(365);

var replace = uncurryThis(''.replace);
var ltrim = RegExp('^[' + whitespaces + ']+');
var rtrim = RegExp('(^|[^' + whitespaces + '])[' + whitespaces + ']+$');

// `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
var createMethod = function (TYPE) {
  return function ($this) {
    var string = toString(requireObjectCoercible($this));
    if (TYPE & 1) string = replace(string, ltrim, '');
    if (TYPE & 2) string = replace(string, rtrim, '$1');
    return string;
  };
};

module.exports = {
  // `String.prototype.{ trimLeft, trimStart }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimstart
  start: createMethod(1),
  // `String.prototype.{ trimRight, trimEnd }` methods
  // https://tc39.es/ecma262/#sec-string.prototype.trimend
  end: createMethod(2),
  // `String.prototype.trim` method
  // https://tc39.es/ecma262/#sec-string.prototype.trim
  trim: createMethod(3)
};


/***/ }),

/***/ 426:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var PROPER_FUNCTION_NAME = __webpack_require__(82).PROPER;
var fails = __webpack_require__(6);
var whitespaces = __webpack_require__(365);

var non = '\u200B\u0085\u180E';

// check that a method works with the correct list
// of whitespaces and has a correct name
module.exports = function (METHOD_NAME) {
  return fails(function () {
    return !!whitespaces[METHOD_NAME]()
      || non[METHOD_NAME]() !== non
      || (PROPER_FUNCTION_NAME && whitespaces[METHOD_NAME].name !== METHOD_NAME);
  });
};


/***/ }),

/***/ 509:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sizeFormat", function() { return sizeFormat; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "monthReplace", function() { return monthReplace; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "todayReplace", function() { return todayReplace; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dateFormat", function() { return dateFormat; });
/* harmony import */ var core_js_modules_es_string_match__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(235);
/* harmony import */ var core_js_modules_es_string_match__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_match__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(124);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_modules_es_string_split__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(126);
/* harmony import */ var core_js_modules_es_string_split__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_split__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(198);
/* harmony import */ var core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_3__);




const size_check = /[^0-9.,кбмгтkmgtb]/g;
const size_kb = /кб|kb/;
const size_mb = /мб|mb/;
const size_gb = /гб|gb/;
const size_tb = /тб|tb/;
const today_now = /сейчас|now/;
const today_today = /сегодня|today/;
const today_yest = /вчера|yesterday/;
const ex_num = /[^0-9]/g;
const spaces = /\s+/g;
const timeFormat4 = /([0-9]{1,2}d)?[^0-9]*([0-9]{1,2}h)?[^0-9]*([0-9]{1,2}m)?[^0-9]*([0-9]{1,2}s)?/;

const sizeFormat = function sizeFormat(s) {
  const size = s.toLowerCase().replace(size_check, '').replace(',', '.');
  let t = size.replace(size_kb, '');
  const size_len = size.length;

  if (t.length !== size_len) {
    t = parseFloat(t);
    return Math.round(t * 1024);
  }

  t = size.replace(size_mb, '');

  if (t.length !== size_len) {
    t = parseFloat(t);
    return Math.round(t * 1024 * 1024);
  }

  t = size.replace(size_gb, '');

  if (t.length !== size_len) {
    t = parseFloat(t);
    return Math.round(t * 1024 * 1024 * 1024);
  }

  t = size.replace(size_tb, '');

  if (t.length !== size_len) {
    t = parseFloat(t);
    return Math.round(t * 1024 * 1024 * 1024 * 1024);
  }

  return 0;
};

const monthReplace = function monthReplace(t) {
  return t.toLowerCase().replace('янв', '1').replace('фев', '2').replace('мар', '3').replace('апр', '4').replace('мая', '5').replace('май', '5').replace('июн', '6').replace('июл', '7').replace('авг', '8').replace('сен', '9').replace('окт', '10').replace('ноя', '11').replace('дек', '12').replace('jan', '1').replace('feb', '2').replace('mar', '3').replace('apr', '4').replace('may', '5').replace('jun', '6').replace('jul', '7').replace('aug', '8').replace('sep', '9').replace('oct', '10').replace('nov', '11').replace('dec', '12');
};

const todayReplace = function todayReplace(t, f) {
  f = parseInt(f);
  t = t.toLowerCase();
  const tt = new Date();

  if (today_now.test(t)) {
    t = 'today ' + tt.getHours() + ':' + tt.getMinutes();
  }

  const tty = new Date((Math.round(tt.getTime() / 1000) - 24 * 60 * 60) * 1000);
  let today;
  let yesterday;

  if (f === 0) {
    today = tt.getFullYear() + ' ' + (tt.getMonth() + 1) + ' ' + tt.getDate() + ' ';
    yesterday = tty.getFullYear() + ' ' + (tty.getMonth() + 1) + ' ' + tty.getDate() + ' ';
  } else if (f === 3) {
    today = tt.getMonth() + 1 + ' ' + tt.getDate() + ' ' + tt.getFullYear() + ' ';
    yesterday = tty.getMonth() + 1 + ' ' + tty.getDate() + ' ' + tty.getFullYear() + ' ';
  } else {
    today = tt.getDate() + ' ' + (tt.getMonth() + 1) + ' ' + tt.getFullYear() + ' ';
    yesterday = tty.getDate() + ' ' + (tty.getMonth() + 1) + ' ' + tty.getFullYear() + ' ';
  }

  t = t.replace(today_today, today).replace(today_yest, yesterday);
  return t;
};

const dateFormat = function dateFormat(f, t) {
  if (f === undefined) {
    return ['2013-04-31[[[ 07]:03]:27]', '31-04-2013[[[ 07]:03]:27]', 'n day ago', '04-31-2013[[[ 07]:03]:27]', '2d 1h 0m 0s ago'];
  }

  f = parseInt(f);

  if (f === 0) {
    // || f === '2013-04-31[[[ 07]:03]:27]') {
    const dd = t.replace(ex_num, ' ').replace(spaces, ' ').trim().split(' ');

    for (let i = 0; i < 6; i++) {
      if (dd[i] === undefined) {
        dd[i] = 0;
      } else {
        dd[i] = parseInt(dd[i]);

        if (isNaN(dd[i])) {
          if (i < 3) {
            return 0;
          } else {
            dd[i] = 0;
          }
        }
      }
    }

    if (dd[0] < 10) {
      dd[0] = '200' + dd[0];
    } else if (dd[0] < 100) {
      dd[0] = '20' + dd[0];
    }

    return Math.round(new Date(dd[0], dd[1] - 1, dd[2], dd[3], dd[4], dd[5]).getTime() / 1000);
  }

  if (f === 1) {
    //  || f === '31-04-2013[[[ 07]:03]:27]') {
    const dd = t.replace(ex_num, ' ').replace(spaces, ' ').trim().split(' ');

    for (let i = 0; i < 6; i++) {
      if (dd[i] === undefined) {
        dd[i] = 0;
      } else {
        dd[i] = parseInt(dd[i]);

        if (isNaN(dd[i])) {
          if (i < 3) {
            return 0;
          } else {
            dd[i] = 0;
          }
        }
      }
    }

    if (dd[2] < 10) {
      dd[2] = '200' + dd[2];
    } else if (dd[2] < 100) {
      dd[2] = '20' + dd[2];
    }

    return Math.round(new Date(dd[2], dd[1] - 1, dd[0], dd[3], dd[4], dd[5]).getTime() / 1000);
  }

  if (f === 2) {
    //  || f === 'n day ago') {
    const old = parseFloat(t.replace(ex_num, '')) * 24 * 60 * 60;
    return Math.round(Date.now() / 1000) - old;
  }

  if (f === 3) {
    //  || f === '04-31-2013[[[ 07]:03]:27]') {
    const dd = t.replace(ex_num, ' ').replace(spaces, ' ').trim().split(' ');

    for (let i = 0; i < 6; i++) {
      if (dd[i] === undefined) {
        dd[i] = 0;
      } else {
        dd[i] = parseInt(dd[i]);

        if (isNaN(dd[i])) {
          if (i < 3) {
            return 0;
          } else {
            dd[i] = 0;
          }
        }
      }
    }

    if (dd[2] < 10) {
      dd[2] = '200' + dd[2];
    } else if (dd[2] < 100) {
      dd[2] = '20' + dd[2];
    }

    return Math.round(new Date(dd[2], dd[0] - 1, dd[1], dd[3], dd[4], dd[5]).getTime() / 1000);
  }

  if (f === 4) {
    //  || f === '2d 1h 0m 0s ago') {
    const match = t.match(timeFormat4);

    if (match) {
      const d = parseInt(match[1]) || 0;
      const h = parseInt(match[2]) || 0;
      const m = parseInt(match[3]) || 0;
      const s = parseInt(match[4]) || 0;
      const time = d * 24 * 60 * 60 + h * 60 * 60 + m * 60 + s;

      if (time === 0) {
        return 0;
      }

      return parseInt(Date.now() / 1000) - time;
    }

    return 0;
  }
};



/***/ }),

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

/***/ 518:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(21);
/* harmony import */ var core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_modules_es_regexp_constructor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(85);
/* harmony import */ var core_js_modules_es_regexp_constructor__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_constructor__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(73);
/* harmony import */ var core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(124);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(198);
/* harmony import */ var core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_trim__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(15);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _assertType__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(202);








const exKitPipelineMethods = {
  getAttr: {
    in: 'node',
    args: [{
      name: 'Attribute',
      type: 'string'
    }],
    out: 'string',

    getMethod(attr) {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isElement */ "b"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.getAttribute(attr));
    }

  },
  getProp: {
    in: 'node',
    args: [{
      name: 'Property',
      type: 'string'
    }],
    out: 'string',

    getMethod(prop) {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isElement */ "b"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value[prop]);
    }

  },
  getText: {
    in: 'node',
    out: 'string',

    getMethod() {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNode */ "c"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.textContent);
    }

  },
  getHtml: {
    in: 'node',
    out: 'string',

    getMethod() {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isElement */ "b"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.innerHTML);
    }

  },
  getChild: {
    in: 'node',
    args: [{
      name: 'Index',
      type: 'number'
    }],
    out: 'node',

    getMethod(index) {
      if (index < 0) {
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNode */ "c"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNode */ "c"], value => value.childNodes[value.childNodes.length + index]);
      } else {
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNode */ "c"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNode */ "c"], value => value.childNodes[index]);
      }
    }

  },
  trim: {
    in: 'string',
    out: 'string',

    getMethod() {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.trim());
    }

  },
  replace: {
    in: 'string',
    args: [{
      name: 'Pattern',
      type: 'string'
    }, {
      name: 'ReplaceTo',
      type: 'string'
    }],
    out: 'string',

    getMethod(pattern, replaceTo) {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.replace(pattern, replaceTo));
    }

  },
  replaceRe: {
    in: 'string',
    args: [{
      name: 'Pattern',
      type: 'string'
    }, {
      name: 'ReplaceTo',
      type: 'string'
    }],
    out: 'string',

    getMethod(reStr, replaceTo) {
      const re = new RegExp(reStr, 'ig');
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => value.replace(re, replaceTo));
    }

  },
  parseDate: {
    in: 'string',
    args: [{
      name: 'Format',
      type: 'string'
    }],
    out: 'number',

    getMethod(format) {
      return __webpack_require__.e(/* import() */ 2).then(__webpack_require__.bind(null, 550)).then(module => {
        const fechaParse = module.parse;
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => fechaParse(value, format).getTime());
      });
    }

  },
  parseSize: {
    in: 'string',
    out: 'number',

    getMethod() {
      return __webpack_require__.e(/* import() */ 3).then(__webpack_require__.t.bind(null, 551, 7)).then(module => {
        const filesizeParser = (filesizeParser => {
          return (...args) => {
            try {
              return filesizeParser(...args);
            } catch (err) {
              if (typeof err === 'string') {
                err = new Error(err);
              }

              throw err;
            }
          };
        })(module.default);

        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => filesizeParser(value));
      });
    }

  },
  toInt: {
    in: 'string',
    out: 'number',

    getMethod() {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => parseInt(value, 10));
    }

  },
  toFloat: {
    in: 'string',
    out: 'number',

    getMethod() {
      return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => parseFloat(value));
    }

  },
  legacyReplaceToday: {
    in: 'string',
    out: 'string',

    getMethod() {
      return __webpack_require__.e(/* import() */ 0).then(__webpack_require__.bind(null, 509)).then(module => {
        const legacyReplaceToday = module.todayReplace;
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => legacyReplaceToday(value));
      });
    }

  },
  legacyReplaceMonth: {
    in: 'string',
    out: 'string',

    getMethod() {
      return __webpack_require__.e(/* import() */ 0).then(__webpack_require__.bind(null, 509)).then(module => {
        const legacyReplaceMonth = module.monthReplace;
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], value => legacyReplaceMonth(value));
      });
    }

  },
  legacyParseDate: {
    in: 'string',
    args: [{
      name: 'Template',
      type: 'select',
      values: [{
        key: 0,
        text: '2013-04-31[[[ 07]:03]:27]'
      }, {
        key: 1,
        text: '31-04-2013[[[ 07]:03]:27]'
      }, {
        key: 2,
        text: 'n day ago'
      }, {
        key: 3,
        text: '04-31-2013[[[ 07]:03]:27]'
      }, {
        key: 4,
        text: '2d 1h 0m 0s ago'
      }]
    }],
    out: 'number',

    getMethod(format) {
      return __webpack_require__.e(/* import() */ 0).then(__webpack_require__.bind(null, 509)).then(module => {
        const legacyParseDate = module.dateFormat;
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => legacyParseDate(format, value));
      });
    }

  },
  legacySizeFormat: {
    in: 'string',
    out: 'number',

    getMethod() {
      return __webpack_require__.e(/* import() */ 0).then(__webpack_require__.bind(null, 509)).then(module => {
        const legacySizeFormat = module.sizeFormat;
        return Object(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* default */ "a"])(_assertType__WEBPACK_IMPORTED_MODULE_7__[/* isString */ "e"], _assertType__WEBPACK_IMPORTED_MODULE_7__[/* isNumber */ "d"], value => legacySizeFormat(value));
      });
    }

  }
};
/* harmony default export */ __webpack_exports__["a"] = (exKitPipelineMethods);

/***/ }),

/***/ 527:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;/*!
 * Sizzle CSS Selector Engine v2.3.4
 * https://sizzlejs.com/
 *
 * Copyright JS Foundation and other contributors
 * Released under the MIT license
 * https://js.foundation/
 *
 * Date: 2019-04-08
 */
(function( window ) {

var i,
	support,
	Expr,
	getText,
	isXML,
	tokenize,
	compile,
	select,
	outermostContext,
	sortInput,
	hasDuplicate,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + 1 * new Date(),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	nonnativeSelectorCache = createCache(),
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
		}
		return 0;
	},

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf as it's faster than native
	// https://jsperf.com/thor-indexof-vs-for/5
	indexOf = function( list, elem ) {
		var i = 0,
			len = list.length;
		for ( ; i < len; i++ ) {
			if ( list[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",

	// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = "(?:\\\\.|[\\w-]|[^\0-\\xa0])+",

	// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
		// Operator (capture 2)
		"*([*^$|!~]?=)" + whitespace +
		// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
		"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
		"*\\]",

	pseudos = ":(" + identifier + ")(?:\\((" +
		// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
		// 1. quoted (capture 3; capture 4 or capture 5)
		"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
		// 2. simple (capture 6)
		"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
		// 3. anything else (capture 2)
		".*" +
		")\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rwhitespace = new RegExp( whitespace + "+", "g" ),
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),
	rdescend = new RegExp( whitespace + "|>" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + identifier + ")" ),
		"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
		"TAG": new RegExp( "^(" + identifier + "|[*])" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rhtml = /HTML$/i,
	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rsibling = /[+~]/,

	// CSS escapes
	// http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox<24
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			high < 0 ?
				// BMP codepoint
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	},

	// CSS string/identifier serialization
	// https://drafts.csswg.org/cssom/#common-serializing-idioms
	rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
	fcssescape = function( ch, asCodePoint ) {
		if ( asCodePoint ) {

			// U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
			if ( ch === "\0" ) {
				return "\uFFFD";
			}

			// Control characters and (dependent upon position) numbers get escaped as code points
			return ch.slice( 0, -1 ) + "\\" + ch.charCodeAt( ch.length - 1 ).toString( 16 ) + " ";
		}

		// Other potentially-special ASCII characters get backslash-escaped
		return "\\" + ch;
	},

	// Used for iframes
	// See setDocument()
	// Removing the function wrapper causes a "Permission Denied"
	// error in IE
	unloadHandler = function() {
		setDocument();
	},

	inDisabledFieldset = addCombinator(
		function( elem ) {
			return elem.disabled === true && elem.nodeName.toLowerCase() === "fieldset";
		},
		{ dir: "parentNode", next: "legend" }
	);

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0
	// Detect silently failing push.apply
	arr[ preferredDoc.childNodes.length ].nodeType;
} catch ( e ) {
	push = { apply: arr.length ?

		// Leverage slice if possible
		function( target, els ) {
			push_native.apply( target, slice.call(els) );
		} :

		// Support: IE<9
		// Otherwise append directly
		function( target, els ) {
			var j = target.length,
				i = 0;
			// Can't trust NodeList.length
			while ( (target[j++] = els[i++]) ) {}
			target.length = j - 1;
		}
	};
}

function Sizzle( selector, context, results, seed ) {
	var m, i, elem, nid, match, groups, newSelector,
		newContext = context && context.ownerDocument,

		// nodeType defaults to 9, since context defaults to document
		nodeType = context ? context.nodeType : 9;

	results = results || [];

	// Return early from calls with invalid selector or context
	if ( typeof selector !== "string" || !selector ||
		nodeType !== 1 && nodeType !== 9 && nodeType !== 11 ) {

		return results;
	}

	// Try to shortcut find operations (as opposed to filters) in HTML documents
	if ( !seed ) {

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}
		context = context || document;

		if ( documentIsHTML ) {

			// If the selector is sufficiently simple, try using a "get*By*" DOM method
			// (excepting DocumentFragment context, where the methods don't exist)
			if ( nodeType !== 11 && (match = rquickExpr.exec( selector )) ) {

				// ID selector
				if ( (m = match[1]) ) {

					// Document context
					if ( nodeType === 9 ) {
						if ( (elem = context.getElementById( m )) ) {

							// Support: IE, Opera, Webkit
							// TODO: identify versions
							// getElementById can match elements by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}

					// Element context
					} else {

						// Support: IE, Opera, Webkit
						// TODO: identify versions
						// getElementById can match elements by name instead of ID
						if ( newContext && (elem = newContext.getElementById( m )) &&
							contains( context, elem ) &&
							elem.id === m ) {

							results.push( elem );
							return results;
						}
					}

				// Type selector
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Class selector
				} else if ( (m = match[3]) && support.getElementsByClassName &&
					context.getElementsByClassName ) {

					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// Take advantage of querySelectorAll
			if ( support.qsa &&
				!nonnativeSelectorCache[ selector + " " ] &&
				(!rbuggyQSA || !rbuggyQSA.test( selector )) &&

				// Support: IE 8 only
				// Exclude object elements
				(nodeType !== 1 || context.nodeName.toLowerCase() !== "object") ) {

				newSelector = selector;
				newContext = context;

				// qSA considers elements outside a scoping root when evaluating child or
				// descendant combinators, which is not what we want.
				// In such cases, we work around the behavior by prefixing every selector in the
				// list with an ID selector referencing the scope context.
				// Thanks to Andrew Dupont for this technique.
				if ( nodeType === 1 && rdescend.test( selector ) ) {

					// Capture the context ID, setting it first if necessary
					if ( (nid = context.getAttribute( "id" )) ) {
						nid = nid.replace( rcssescape, fcssescape );
					} else {
						context.setAttribute( "id", (nid = expando) );
					}

					// Prefix every selector in the list
					groups = tokenize( selector );
					i = groups.length;
					while ( i-- ) {
						groups[i] = "#" + nid + " " + toSelector( groups[i] );
					}
					newSelector = groups.join( "," );

					// Expand context for sibling selectors
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) ||
						context;
				}

				try {
					push.apply( results,
						newContext.querySelectorAll( newSelector )
					);
					return results;
				} catch ( qsaError ) {
					nonnativeSelectorCache( selector, true );
				} finally {
					if ( nid === expando ) {
						context.removeAttribute( "id" );
					}
				}
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed );
}

/**
 * Create key-value caches of limited size
 * @returns {function(string, object)} Returns the Object data after storing it on itself with
 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
 *	deleting the oldest entry
 */
function createCache() {
	var keys = [];

	function cache( key, value ) {
		// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
		if ( keys.push( key + " " ) > Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key + " " ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created element and returns a boolean result
 */
function assert( fn ) {
	var el = document.createElement("fieldset");

	try {
		return !!fn( el );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( el.parentNode ) {
			el.parentNode.removeChild( el );
		}
		// release memory in IE
		el = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = arr.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			a.sourceIndex - b.sourceIndex;

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for :enabled/:disabled
 * @param {Boolean} disabled true for :disabled; false for :enabled
 */
function createDisabledPseudo( disabled ) {

	// Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
	return function( elem ) {

		// Only certain elements can match :enabled or :disabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
		// https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
		if ( "form" in elem ) {

			// Check for inherited disabledness on relevant non-disabled elements:
			// * listed form-associated elements in a disabled fieldset
			//   https://html.spec.whatwg.org/multipage/forms.html#category-listed
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
			// * option elements in a disabled optgroup
			//   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
			// All such elements have a "form" property.
			if ( elem.parentNode && elem.disabled === false ) {

				// Option elements defer to a parent optgroup if present
				if ( "label" in elem ) {
					if ( "label" in elem.parentNode ) {
						return elem.parentNode.disabled === disabled;
					} else {
						return elem.disabled === disabled;
					}
				}

				// Support: IE 6 - 11
				// Use the isDisabled shortcut property to check for disabled fieldset ancestors
				return elem.isDisabled === disabled ||

					// Where there is no isDisabled, check manually
					/* jshint -W018 */
					elem.isDisabled !== !disabled &&
						inDisabledFieldset( elem ) === disabled;
			}

			return elem.disabled === disabled;

		// Try to winnow out elements that can't be disabled before trusting the disabled property.
		// Some victims get caught in our net (label, legend, menu, track), but it shouldn't
		// even exist on them, let alone have a boolean value.
		} else if ( "label" in elem ) {
			return elem.disabled === disabled;
		}

		// Remaining elements are neither :enabled nor :disabled
		return false;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Checks a node for validity as a Sizzle context
 * @param {Element|Object=} context
 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
 */
function testContext( context ) {
	return context && typeof context.getElementsByTagName !== "undefined" && context;
}

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Detects XML nodes
 * @param {Element|Object} elem An element or a document
 * @returns {Boolean} True iff elem is a non-HTML XML node
 */
isXML = Sizzle.isXML = function( elem ) {
	var namespace = elem.namespaceURI,
		docElem = (elem.ownerDocument || elem).documentElement;

	// Support: IE <=8
	// Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
	// https://bugs.jquery.com/ticket/4833
	return !rhtml.test( namespace || docElem && docElem.nodeName || "HTML" );
};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var hasCompare, subWindow,
		doc = node ? node.ownerDocument || node : preferredDoc;

	// Return early if doc is invalid or already selected
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Update global variables
	document = doc;
	docElem = document.documentElement;
	documentIsHTML = !isXML( document );

	// Support: IE 9-11, Edge
	// Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
	if ( preferredDoc !== document &&
		(subWindow = document.defaultView) && subWindow.top !== subWindow ) {

		// Support: IE 11, Edge
		if ( subWindow.addEventListener ) {
			subWindow.addEventListener( "unload", unloadHandler, false );

		// Support: IE 9 - 10 only
		} else if ( subWindow.attachEvent ) {
			subWindow.attachEvent( "onunload", unloadHandler );
		}
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8
	// Verify that getAttribute really returns attributes and not properties
	// (excepting IE8 booleans)
	support.attributes = assert(function( el ) {
		el.className = "i";
		return !el.getAttribute("className");
	});

	/* getElement(s)By*
	---------------------------------------------------------------------- */

	// Check if getElementsByTagName("*") returns only elements
	support.getElementsByTagName = assert(function( el ) {
		el.appendChild( document.createComment("") );
		return !el.getElementsByTagName("*").length;
	});

	// Support: IE<9
	support.getElementsByClassName = rnative.test( document.getElementsByClassName );

	// Support: IE<10
	// Check if getElementById returns elements by name
	// The broken getElementById methods don't pick up programmatically-set names,
	// so use a roundabout getElementsByName test
	support.getById = assert(function( el ) {
		docElem.appendChild( el ).id = expando;
		return !document.getElementsByName || !document.getElementsByName( expando ).length;
	});

	// ID filter and find
	if ( support.getById ) {
		Expr.filter["ID"] = function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				return elem.getAttribute("id") === attrId;
			};
		};
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var elem = context.getElementById( id );
				return elem ? [ elem ] : [];
			}
		};
	} else {
		Expr.filter["ID"] =  function( id ) {
			var attrId = id.replace( runescape, funescape );
			return function( elem ) {
				var node = typeof elem.getAttributeNode !== "undefined" &&
					elem.getAttributeNode("id");
				return node && node.value === attrId;
			};
		};

		// Support: IE 6 - 7 only
		// getElementById is not reliable as a find shortcut
		Expr.find["ID"] = function( id, context ) {
			if ( typeof context.getElementById !== "undefined" && documentIsHTML ) {
				var node, i, elems,
					elem = context.getElementById( id );

				if ( elem ) {

					// Verify the id attribute
					node = elem.getAttributeNode("id");
					if ( node && node.value === id ) {
						return [ elem ];
					}

					// Fall back on getElementsByName
					elems = context.getElementsByName( id );
					i = 0;
					while ( (elem = elems[i++]) ) {
						node = elem.getAttributeNode("id");
						if ( node && node.value === id ) {
							return [ elem ];
						}
					}
				}

				return [];
			}
		};
	}

	// Tag
	Expr.find["TAG"] = support.getElementsByTagName ?
		function( tag, context ) {
			if ( typeof context.getElementsByTagName !== "undefined" ) {
				return context.getElementsByTagName( tag );

			// DocumentFragment nodes don't have gEBTN
			} else if ( support.qsa ) {
				return context.querySelectorAll( tag );
			}
		} :

		function( tag, context ) {
			var elem,
				tmp = [],
				i = 0,
				// By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
				results = context.getElementsByTagName( tag );

			// Filter out possible comments
			if ( tag === "*" ) {
				while ( (elem = results[i++]) ) {
					if ( elem.nodeType === 1 ) {
						tmp.push( elem );
					}
				}

				return tmp;
			}
			return results;
		};

	// Class
	Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
		if ( typeof context.getElementsByClassName !== "undefined" && documentIsHTML ) {
			return context.getElementsByClassName( className );
		}
	};

	/* QSA/matchesSelector
	---------------------------------------------------------------------- */

	// QSA and matchesSelector support

	// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
	rbuggyMatches = [];

	// qSa(:focus) reports false when true (Chrome 21)
	// We allow this because of a bug in IE8/9 that throws an error
	// whenever `document.activeElement` is accessed on an iframe
	// So, we allow :focus to pass through QSA all the time to avoid the IE error
	// See https://bugs.jquery.com/ticket/13378
	rbuggyQSA = [];

	if ( (support.qsa = rnative.test( document.querySelectorAll )) ) {
		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( el ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explicitly
			// setting a boolean content attribute,
			// since its presence should be enough
			// https://bugs.jquery.com/ticket/12359
			docElem.appendChild( el ).innerHTML = "<a id='" + expando + "'></a>" +
				"<select id='" + expando + "-\r\\' msallowcapture=''>" +
				"<option selected=''></option></select>";

			// Support: IE8, Opera 11-12.16
			// Nothing should be selected when empty strings follow ^= or $= or *=
			// The test attribute must be unknown in Opera but "safe" for WinRT
			// https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
			if ( el.querySelectorAll("[msallowcapture^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
			}

			// Support: IE8
			// Boolean attributes and "value" are not treated correctly
			if ( !el.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
			}

			// Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+
			if ( !el.querySelectorAll( "[id~=" + expando + "-]" ).length ) {
				rbuggyQSA.push("~=");
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here and will not see later tests
			if ( !el.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}

			// Support: Safari 8+, iOS 8+
			// https://bugs.webkit.org/show_bug.cgi?id=136851
			// In-page `selector#id sibling-combinator selector` fails
			if ( !el.querySelectorAll( "a#" + expando + "+*" ).length ) {
				rbuggyQSA.push(".#.+[+~]");
			}
		});

		assert(function( el ) {
			el.innerHTML = "<a href='' disabled='disabled'></a>" +
				"<select disabled='disabled'><option/></select>";

			// Support: Windows 8 Native Apps
			// The type and name attributes are restricted during .innerHTML assignment
			var input = document.createElement("input");
			input.setAttribute( "type", "hidden" );
			el.appendChild( input ).setAttribute( "name", "D" );

			// Support: IE8
			// Enforce case-sensitivity of name attribute
			if ( el.querySelectorAll("[name=d]").length ) {
				rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here and will not see later tests
			if ( el.querySelectorAll(":enabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Support: IE9-11+
			// IE's :disabled selector does not pick up the children of disabled fieldsets
			docElem.appendChild( el ).disabled = true;
			if ( el.querySelectorAll(":disabled").length !== 2 ) {
				rbuggyQSA.push( ":enabled", ":disabled" );
			}

			// Opera 10-11 does not throw on post-comma invalid pseudos
			el.querySelectorAll("*,:x");
			rbuggyQSA.push(",.*:");
		});
	}

	if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
		docElem.webkitMatchesSelector ||
		docElem.mozMatchesSelector ||
		docElem.oMatchesSelector ||
		docElem.msMatchesSelector) )) ) {

		assert(function( el ) {
			// Check to see if it's possible to do matchesSelector
			// on a disconnected node (IE 9)
			support.disconnectedMatch = matches.call( el, "*" );

			// This should fail with an exception
			// Gecko does not error, returns false instead
			matches.call( el, "[s!='']:x" );
			rbuggyMatches.push( "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
	rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

	/* Contains
	---------------------------------------------------------------------- */
	hasCompare = rnative.test( docElem.compareDocumentPosition );

	// Element contains another
	// Purposefully self-exclusive
	// As in, an element does not contain itself
	contains = hasCompare || rnative.test( docElem.contains ) ?
		function( a, b ) {
			var adown = a.nodeType === 9 ? a.documentElement : a,
				bup = b && b.parentNode;
			return a === bup || !!( bup && bup.nodeType === 1 && (
				adown.contains ?
					adown.contains( bup ) :
					a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
			));
		} :
		function( a, b ) {
			if ( b ) {
				while ( (b = b.parentNode) ) {
					if ( b === a ) {
						return true;
					}
				}
			}
			return false;
		};

	/* Sorting
	---------------------------------------------------------------------- */

	// Document order sorting
	sortOrder = hasCompare ?
	function( a, b ) {

		// Flag for duplicate removal
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		// Sort on method existence if only one input has compareDocumentPosition
		var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
		if ( compare ) {
			return compare;
		}

		// Calculate position if both inputs belong to the same document
		compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
			a.compareDocumentPosition( b ) :

			// Otherwise we know they are disconnected
			1;

		// Disconnected nodes
		if ( compare & 1 ||
			(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

			// Choose the first element that is related to our preferred document
			if ( a === document || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
				return -1;
			}
			if ( b === document || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
				return 1;
			}

			// Maintain original order
			return sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;
		}

		return compare & 4 ? -1 : 1;
	} :
	function( a, b ) {
		// Exit early if the nodes are identical
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		var cur,
			i = 0,
			aup = a.parentNode,
			bup = b.parentNode,
			ap = [ a ],
			bp = [ b ];

		// Parentless nodes are either documents or disconnected
		if ( !aup || !bup ) {
			return a === document ? -1 :
				b === document ? 1 :
				aup ? -1 :
				bup ? 1 :
				sortInput ?
				( indexOf( sortInput, a ) - indexOf( sortInput, b ) ) :
				0;

		// If the nodes are siblings, we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );
		}

		// Otherwise we need full lists of their ancestors for comparison
		cur = a;
		while ( (cur = cur.parentNode) ) {
			ap.unshift( cur );
		}
		cur = b;
		while ( (cur = cur.parentNode) ) {
			bp.unshift( cur );
		}

		// Walk down the tree looking for a discrepancy
		while ( ap[i] === bp[i] ) {
			i++;
		}

		return i ?
			// Do a sibling check if the nodes have a common ancestor
			siblingCheck( ap[i], bp[i] ) :

			// Otherwise nodes in our document sort first
			ap[i] === preferredDoc ? -1 :
			bp[i] === preferredDoc ? 1 :
			0;
	};

	return document;
};

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	if ( support.matchesSelector && documentIsHTML &&
		!nonnativeSelectorCache[ expr + " " ] &&
		( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
		( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

		try {
			var ret = matches.call( elem, expr );

			// IE 9's matchesSelector returns false on disconnected nodes
			if ( ret || support.disconnectedMatch ||
					// As well, disconnected nodes are said to be in a document
					// fragment in IE 9
					elem.document && elem.document.nodeType !== 11 ) {
				return ret;
			}
		} catch (e) {
			nonnativeSelectorCache( expr, true );
		}
	}

	return Sizzle( expr, document, null, [ elem ] ).length > 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val !== undefined ?
		val :
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null;
};

Sizzle.escape = function( sel ) {
	return (sel + "").replace( rcssescape, fcssescape );
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	// Clear input after sorting to release objects
	// See https://github.com/jquery/sizzle/pull/225
	sortInput = null;

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		while ( (node = elem[i++]) ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (jQuery #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[6] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] ) {
				match[2] = match[4] || match[5] || "";

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== "undefined" && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result.replace( rwhitespace, " " ) + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, uniqueCache, outerCache, node, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType,
						diff = false;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) {

										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {

							// Seek `elem` from a previously-cached index

							// ...in a gzip-friendly way
							node = parent;
							outerCache = node[ expando ] || (node[ expando ] = {});

							// Support: IE <9 only
							// Defend against cloned attroperties (jQuery gh-1709)
							uniqueCache = outerCache[ node.uniqueID ] ||
								(outerCache[ node.uniqueID ] = {});

							cache = uniqueCache[ type ] || [];
							nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
							diff = nodeIndex && cache[ 2 ];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									uniqueCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						} else {
							// Use previously-cached element index if available
							if ( useCache ) {
								// ...in a gzip-friendly way
								node = elem;
								outerCache = node[ expando ] || (node[ expando ] = {});

								// Support: IE <9 only
								// Defend against cloned attroperties (jQuery gh-1709)
								uniqueCache = outerCache[ node.uniqueID ] ||
									(outerCache[ node.uniqueID ] = {});

								cache = uniqueCache[ type ] || [];
								nodeIndex = cache[ 0 ] === dirruns && cache[ 1 ];
								diff = nodeIndex;
							}

							// xml :nth-child(...)
							// or :nth-last-child(...) or :nth(-last)?-of-type(...)
							if ( diff === false ) {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ?
										node.nodeName.toLowerCase() === name :
										node.nodeType === 1 ) &&
										++diff ) {

										// Cache the index of each encountered element
										if ( useCache ) {
											outerCache = node[ expando ] || (node[ expando ] = {});

											// Support: IE <9 only
											// Defend against cloned attroperties (jQuery gh-1709)
											uniqueCache = outerCache[ node.uniqueID ] ||
												(outerCache[ node.uniqueID ] = {});

											uniqueCache[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					// Don't keep the element (issue #299)
					input[0] = null;
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			text = text.replace( runescape, funescape );
			return function( elem ) {
				return ( elem.textContent || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": createDisabledPseudo( false ),
		"disabled": createDisabledPseudo( true ),

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
			//   but not by others (comment: 8; processing instruction: 7; etc.)
			// nodeType < 6 works because attributes (2) do not appear as children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeType < 6 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&

				// Support: IE<8
				// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ?
				argument + length :
				argument > length ?
					length :
					argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( (tokens = []) );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
};

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		skip = combinator.next,
		key = skip || dir,
		checkNonElements = base && key === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
			return false;
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var oldCache, uniqueCache, outerCache,
				newCache = [ dirruns, doneName ];

			// We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});

						// Support: IE <9 only
						// Defend against cloned attroperties (jQuery gh-1709)
						uniqueCache = outerCache[ elem.uniqueID ] || (outerCache[ elem.uniqueID ] = {});

						if ( skip && skip === elem.nodeName.toLowerCase() ) {
							elem = elem[ dir ] || elem;
						} else if ( (oldCache = uniqueCache[ key ]) &&
							oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

							// Assign to newCache so results back-propagate to previous elements
							return (newCache[ 2 ] = oldCache[ 2 ]);
						} else {
							// Reuse newcache so results back-propagate to previous elements
							uniqueCache[ key ] = newCache;

							// A match means we're done; a fail means we have to keep checking
							if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
								return true;
							}
						}
					}
				}
			}
			return false;
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			var ret = ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
			// Avoid hanging onto element (issue #299)
			checkContext = null;
			return ret;
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, outermost ) {
			var elem, j, matcher,
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				setMatched = [],
				contextBackup = outermostContext,
				// We must always have either seed elements or outermost context
				elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
				len = elems.length;

			if ( outermost ) {
				outermostContext = context === document || context || outermost;
			}

			// Add elements passing elementMatchers directly to results
			// Support: IE<9, Safari
			// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
			for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					if ( !context && elem.ownerDocument !== document ) {
						setDocument( elem );
						xml = !documentIsHTML;
					}
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context || document, xml) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// `i` is now the count of elements visited above, and adding it to `matchedCount`
			// makes the latter nonnegative.
			matchedCount += i;

			// Apply set filters to unmatched elements
			// NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
			// equals `i`), unless we didn't visit _any_ elements in the above loop because we have
			// no element matchers and no seed.
			// Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
			// case, which will result in a "00" `matchedCount` that differs from `i` but is also
			// numerically zero.
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !match ) {
			match = tokenize( selector );
		}
		i = match.length;
		while ( i-- ) {
			cached = matcherFromTokens( match[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

		// Save selector and tokenization
		cached.selector = selector;
	}
	return cached;
};

/**
 * A low-level selection function that works with Sizzle's compiled
 *  selector functions
 * @param {String|Function} selector A selector or a pre-compiled
 *  selector function built with Sizzle.compile
 * @param {Element} context
 * @param {Array} [results]
 * @param {Array} [seed] A set of elements to match against
 */
select = Sizzle.select = function( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		compiled = typeof selector === "function" && selector,
		match = !seed && tokenize( (selector = compiled.selector || selector) );

	results = results || [];

	// Try to minimize operations if there is only one selector in the list and no seed
	// (the latter of which guarantees us context)
	if ( match.length === 1 ) {

		// Reduce context if the leading compound selector is an ID
		tokens = match[0] = match[0].slice( 0 );
		if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
				context.nodeType === 9 && documentIsHTML && Expr.relative[ tokens[1].type ] ) {

			context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
			if ( !context ) {
				return results;

			// Precompiled matchers will still verify ancestry, so step up a level
			} else if ( compiled ) {
				context = context.parentNode;
			}

			selector = selector.slice( tokens.shift().value.length );
		}

		// Fetch a seed set for right-to-left matching
		i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
		while ( i-- ) {
			token = tokens[i];

			// Abort if we hit a combinator
			if ( Expr.relative[ (type = token.type) ] ) {
				break;
			}
			if ( (find = Expr.find[ type ]) ) {
				// Search, expanding context for leading sibling combinators
				if ( (seed = find(
					token.matches[0].replace( runescape, funescape ),
					rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
				)) ) {

					// If seed is empty or no tokens remain, we can return early
					tokens.splice( i, 1 );
					selector = seed.length && toSelector( tokens );
					if ( !selector ) {
						push.apply( results, seed );
						return results;
					}

					break;
				}
			}
		}
	}

	// Compile and execute a filtering function if one is not provided
	// Provide `match` to avoid retokenization if we modified the selector above
	( compiled || compile( selector, match ) )(
		seed,
		context,
		!documentIsHTML,
		results,
		!context || rsibling.test( selector ) && testContext( context.parentNode ) || context
	);
	return results;
};

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome 14-35+
// Always assume duplicates if they aren't passed to the comparison function
support.detectDuplicates = !!hasDuplicate;

// Initialize against the default document
setDocument();

// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
// Detached nodes confoundingly follow *each other*
support.sortDetached = assert(function( el ) {
	// Should return 1, but returns 4 (following)
	return el.compareDocumentPosition( document.createElement("fieldset") ) & 1;
});

// Support: IE<8
// Prevent attribute/property "interpolation"
// https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
if ( !assert(function( el ) {
	el.innerHTML = "<a href='#'></a>";
	return el.firstChild.getAttribute("href") === "#" ;
}) ) {
	addHandle( "type|href|height|width", function( elem, name, isXML ) {
		if ( !isXML ) {
			return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
		}
	});
}

// Support: IE<9
// Use defaultValue in place of getAttribute("value")
if ( !support.attributes || !assert(function( el ) {
	el.innerHTML = "<input/>";
	el.firstChild.setAttribute( "value", "" );
	return el.firstChild.getAttribute( "value" ) === "";
}) ) {
	addHandle( "value", function( elem, name, isXML ) {
		if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
			return elem.defaultValue;
		}
	});
}

// Support: IE<9
// Use getAttributeNode to fetch booleans when getAttribute lies
if ( !assert(function( el ) {
	return el.getAttribute("disabled") == null;
}) ) {
	addHandle( booleans, function( elem, name, isXML ) {
		var val;
		if ( !isXML ) {
			return elem[ name ] === true ? name.toLowerCase() :
					(val = elem.getAttributeNode( name )) && val.specified ?
					val.value :
				null;
		}
	});
}

// EXPOSE
var _sizzle = window.Sizzle;

Sizzle.noConflict = function() {
	if ( window.Sizzle === Sizzle ) {
		window.Sizzle = _sizzle;
	}

	return Sizzle;
};

if ( true ) {
	!(__WEBPACK_AMD_DEFINE_RESULT__ = (function() { return Sizzle; }).call(exports, __webpack_require__, exports, module),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
// Sizzle requires that there be a global window in Common-JS like environments
} else {}
// EXPOSE

})( window );


/***/ }),

/***/ 528:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return sizzleQuerySelector; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return sizzleQuerySelectorAll; });
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14);
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(15);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var sizzle__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(527);
/* harmony import */ var sizzle__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(sizzle__WEBPACK_IMPORTED_MODULE_2__);




const sizzleQuerySelector = (target, selector) => {
  const results = [];

  if (isRequired(selector)) {
    sizzle__WEBPACK_IMPORTED_MODULE_2___default()(selector, target, results);
  } else {
    results.push(target.querySelector(selector));
  }

  return results[0] || null;
};

const sizzleQuerySelectorAll = (target, selector) => {
  const results = [];

  if (isRequired(selector)) {
    sizzle__WEBPACK_IMPORTED_MODULE_2___default()(selector, target, results);
  } else {
    results.push(...target.querySelectorAll(selector));
  }

  return results;
};

const isRequired = selector => {
  return /[^:]:(not|has|contains|empty|parent|header|first|last|eq|even|odd|lt|gt)|^\s*[~+]/.test(selector);
};



/***/ }),

/***/ 529:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(73);
/* harmony import */ var core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_regexp_to_string__WEBPACK_IMPORTED_MODULE_0__);


const encodeCp1251 = string => {
  let output = '',
      charCode,
      ExitValue,
      char;

  for (let i = 0, len = string.length; i < len; i++) {
    char = string.charAt(i);
    charCode = char.charCodeAt(0);
    let Acode = charCode;

    if (charCode > 1039 && charCode < 1104) {
      Acode -= 848;
      ExitValue = '%' + Acode.toString(16);
    } else if (charCode === 1025) {
      Acode = 168;
      ExitValue = '%' + Acode.toString(16);
    } else if (charCode === 1105) {
      Acode = 184;
      ExitValue = '%' + Acode.toString(16);
    } else if (charCode === 32) {
      Acode = 32;
      ExitValue = '%' + Acode.toString(16);
    } else if (charCode === 10) {
      ExitValue = '%0A';
    } else {
      ExitValue = char;
    }

    output = output + ExitValue;
  }

  return output;
};

/* harmony default export */ __webpack_exports__["a"] = (encodeCp1251);

/***/ }),

/***/ 534:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(27);
/* harmony import */ var core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_index_of__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(14);
/* harmony import */ var core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_iterator__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_modules_es_array_map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(23);
/* harmony import */ var core_js_modules_es_array_map__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_map__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var core_js_modules_es_array_splice__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(55);
/* harmony import */ var core_js_modules_es_array_splice__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_splice__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(21);
/* harmony import */ var core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_promise__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(124);
/* harmony import */ var core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_replace__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(138);
/* harmony import */ var core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_search__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(15);
/* harmony import */ var core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _tools_sizzleQuery__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(528);
/* harmony import */ var _tools_convertCodeV1toV2__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(511);
/* harmony import */ var _tools_convertCodeV2toV3__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(512);
/* harmony import */ var _tools_encodeCp1251__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(529);
/* harmony import */ var _tools_assertType__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(202);
/* harmony import */ var _tools_exKitPipelineMethods__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(518);














const strFields = ['categoryTitle', 'title'];
const intFields = ['categoryId', 'size', 'seeds', 'peers', 'date'];
const urlFields = ['categoryUrl', 'url', 'downloadUrl', 'nextPageUrl'];
const selectors = ['categoryTitle', 'categoryUrl', 'categoryId', 'title', 'url', 'size', 'downloadUrl', 'seeds', 'peers', 'date'];

class ExKitTracker {
  constructor() {
    this.code = null;
  }

  init(code) {
    return this.prepareCode(code).then(code => {
      this.code = code;
    });
  }

  search(session, query) {
    const searchStore = this.code.search;
    let encodedQuery = null;

    if (searchStore.encoding === 'cp1251') {
      encodedQuery = Object(_tools_encodeCp1251__WEBPACK_IMPORTED_MODULE_11__[/* default */ "a"])(query);
    } else {
      encodedQuery = encodeURIComponent(query);
    }

    const options = {
      method: searchStore.method,
      url: searchStore.url.replace('%search%', encodedQuery),
      originUrl: searchStore.originUrl,
      query: (searchStore.query || '').replace('%search%', encodedQuery),
      body: (searchStore.body || '').replace('%search%', encodedQuery),
      charset: searchStore.charset
    };
    this.setHeaders(options);
    return this.request(session, options);
  }

  searchNext(session, url) {
    const searchStore = this.code.search;
    const options = {
      method: 'GET',
      url: url,
      originUrl: searchStore.originUrl,
      charset: searchStore.charset
    };
    this.setHeaders(options);
    return this.request(session, options);
  }

  parseResponse(session, response) {
    const doc = session.doc = API_getDoc(response.body, response.url);

    if (this.code.hooks.onGetDoc) {
      this.code.hooks.onGetDoc(session, doc);
    }

    if (this.code.auth && this.code.auth.loginForm && Object(_tools_sizzleQuery__WEBPACK_IMPORTED_MODULE_8__[/* sizzleQuerySelector */ "a"])(doc, this.code.auth.loginForm.selector)) {
      throw new AuthError(this.code.auth.url);
    }

    const rows = Object(_tools_sizzleQuery__WEBPACK_IMPORTED_MODULE_8__[/* sizzleQuerySelectorAll */ "b"])(doc, this.code.selectors.row.selector);

    if (this.code.selectors.skipFromStart) {
      rows.splice(0, this.code.selectors.skipFromStart);
    }

    if (this.code.selectors.skipFromEnd) {
      rows.splice(this.code.selectors.skipFromEnd * -1);
    }

    const results = [];

    for (let i = 0, row; row = rows[i]; i++) {
      try {
        const result = this.parseRow(session, row);
        results.push(result);
      } catch (err) {
        console.error('parseRow error', err);
      }
    }

    let nextPageUrl = null;

    if (this.code.selectors.nextPageUrl) {
      try {
        nextPageUrl = this.matchSelector(session, doc, 'nextPageUrl', this.code.selectors.nextPageUrl);
      } catch (err) {
        console.error('nextPageUrl matchSelector error', err);
      }
    }

    return {
      results,
      nextPageUrl
    };
  }

  parseRow(session, row) {
    const result = {};
    const errors = [];
    const cache = {};

    for (let key, i = 0; key = selectors[i]; i++) {
      const selector = this.code.selectors[key];

      if (selector) {
        try {
          result[key] = this.matchSelector(session, row, key, selector, cache);
        } catch (err) {
          // console.log('matchSelector error', err);
          errors.push({
            key: key,
            error: err
          });
        }
      }
    }

    if (!result.title) {
      const err = new Error('Title is not exists');
      err.result = result;
      err.errors = errors;
      throw err;
    }

    if (!result.url) {
      const err = new Error('Url is not exists');
      err.result = result;
      err.errors = errors;
      throw err;
    }

    if (!result.categoryId && result.categoryId !== 0) {
      result.categoryId = -1;
    }

    if (!result.date) {
      result.date = -1;
    }

    if (errors.length) {
      console.warn('parseRow warnings', {
        row,
        result,
        errors
      });
    }

    return result;
  }
  /**
   * @param session
   * @param container
   * @param {string} key
   * @param {StringSelectorStore|NumberSelectorStore|ElementSelectorStore} selector
   * @param {{}} cache
   */


  matchSelector(session, container, key, selector, cache = {}) {
    let node = cache[selector.selector];

    if (!node) {
      node = cache[selector.selector] = Object(_tools_sizzleQuery__WEBPACK_IMPORTED_MODULE_8__[/* sizzleQuerySelector */ "a"])(container, selector.selector);
    }

    let result = node;

    if (selector.pipelineBuild) {
      result = selector.pipelineBuild(result);
    }

    if (this.code.hooks.transform[key]) {
      result = this.code.hooks.transform[key](session, result, container);
    }

    if (intFields.indexOf(key) !== -1) {
      if (typeof result !== 'number') {
        result = Object(_tools_assertType__WEBPACK_IMPORTED_MODULE_12__[/* isNumber */ "d"])(parseInt(Object(_tools_assertType__WEBPACK_IMPORTED_MODULE_12__[/* isString */ "e"])(result), 10));
      } else {
        result = Object(_tools_assertType__WEBPACK_IMPORTED_MODULE_12__[/* isNumber */ "d"])(result);
      }
    } else if (urlFields.indexOf(key) !== -1) {
      result = API_normalizeUrl(session.response.url, Object(_tools_assertType__WEBPACK_IMPORTED_MODULE_12__[/* isString */ "e"])(result));
    } else if (strFields.indexOf(key) !== -1) {
      result = Object(_tools_assertType__WEBPACK_IMPORTED_MODULE_12__[/* isString */ "e"])(result);
    }

    return result;
  }

  setHeaders(options) {
    let headers = null;

    if (this.code.search.headers) {
      headers = JSON.parse(this.code.search.headers);
    }

    options.headers = headers;
  }

  request(session, options) {
    if (this.code.hooks.onBeforeRequest) {
      this.code.hooks.onBeforeRequest(session, options);
    }

    return API_request(options).then(response => {
      session.response = response;

      if (this.code.hooks.onAfterRequest) {
        this.code.hooks.onAfterRequest(session, response);
      }

      return response;
    });
  }

  prepareCode(code) {
    return Promise.resolve().then(() => {
      if (code.version === 1) {
        code = Object(_tools_convertCodeV1toV2__WEBPACK_IMPORTED_MODULE_9__[/* default */ "a"])(code);
      }

      if (code.version === 2) {
        code = Object(_tools_convertCodeV2toV3__WEBPACK_IMPORTED_MODULE_10__[/* default */ "a"])(code);
      }

      if (!code.hooks) {
        code.hooks = {};
      }

      if (!code.hooks.transform) {
        code.hooks.transform = {};
      }

      const promiseList = Object.keys(code.selectors).map(key => {
        const value = code.selectors[key];

        if (value && value.pipeline) {
          return this.buildPipeline(value.pipeline).then(pipelineBuild => {
            value.pipelineBuild = pipelineBuild;
          });
        }
      });
      return Promise.all(promiseList).then(() => code);
    });
  }

  buildPipeline(pipeline) {
    return Promise.resolve().then(() => {
      if (!Array.isArray(pipeline) || !pipeline.length) {
        return null;
      }

      const promiseList = pipeline.map(method => {
        const pipelineMethod = _tools_exKitPipelineMethods__WEBPACK_IMPORTED_MODULE_13__[/* default */ "a"][method.name];
        const args = method.args || [];
        return pipelineMethod.getMethod(...args);
      });
      return Promise.all(promiseList).then(line => {
        return value => {
          for (let i = 0, method; method = line[i]; i++) {
            value = method(value);
          }

          return value;
        };
      });
    });
  }

}

class AuthError extends Error {
  constructor(url) {
    super('Auth required');
    this.code = 'AUTH_REQUIRED';
    this.url = url;
  }

}

/* harmony default export */ __webpack_exports__["a"] = (ExKitTracker);

/***/ }),

/***/ 55:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $ = __webpack_require__(12);
var toObject = __webpack_require__(34);
var toAbsoluteIndex = __webpack_require__(88);
var toIntegerOrInfinity = __webpack_require__(45);
var lengthOfArrayLike = __webpack_require__(31);
var setArrayLength = __webpack_require__(127);
var doesNotExceedSafeInteger = __webpack_require__(144);
var arraySpeciesCreate = __webpack_require__(143);
var createProperty = __webpack_require__(90);
var deletePropertyOrThrow = __webpack_require__(366);
var arrayMethodHasSpeciesSupport = __webpack_require__(141);

var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('splice');

var max = Math.max;
var min = Math.min;

// `Array.prototype.splice` method
// https://tc39.es/ecma262/#sec-array.prototype.splice
// with adding support of @@species
$({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT }, {
  splice: function splice(start, deleteCount /* , ...items */) {
    var O = toObject(this);
    var len = lengthOfArrayLike(O);
    var actualStart = toAbsoluteIndex(start, len);
    var argumentsLength = arguments.length;
    var insertCount, actualDeleteCount, A, k, from, to;
    if (argumentsLength === 0) {
      insertCount = actualDeleteCount = 0;
    } else if (argumentsLength === 1) {
      insertCount = 0;
      actualDeleteCount = len - actualStart;
    } else {
      insertCount = argumentsLength - 2;
      actualDeleteCount = min(max(toIntegerOrInfinity(deleteCount), 0), len - actualStart);
    }
    doesNotExceedSafeInteger(len + insertCount - actualDeleteCount);
    A = arraySpeciesCreate(O, actualDeleteCount);
    for (k = 0; k < actualDeleteCount; k++) {
      from = actualStart + k;
      if (from in O) createProperty(A, k, O[from]);
    }
    setArrayLength(A, actualDeleteCount);
    if (insertCount < actualDeleteCount) {
      for (k = actualStart; k < len - actualDeleteCount; k++) {
        from = k + actualDeleteCount;
        to = k + insertCount;
        if (from in O) O[to] = O[from];
        else deletePropertyOrThrow(O, to);
      }
      for (k = len; k > len - actualDeleteCount + insertCount; k--) deletePropertyOrThrow(O, k - 1);
    } else if (insertCount > actualDeleteCount) {
      for (k = len - actualDeleteCount; k > actualStart; k--) {
        from = k + actualDeleteCount - 1;
        to = k + insertCount - 1;
        if (from in O) O[to] = O[from];
        else deletePropertyOrThrow(O, to);
      }
    }
    for (k = 0; k < insertCount; k++) {
      O[k + actualStart] = arguments[k + 2];
    }
    setArrayLength(O, len - actualDeleteCount + insertCount);
    return A;
  }
});


/***/ }),

/***/ 661:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.index-of.js
var es_array_index_of = __webpack_require__(27);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.match.js
var es_string_match = __webpack_require__(235);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.search.js
var es_string_search = __webpack_require__(138);

// EXTERNAL MODULE: ./src/tools/exKitLegacyFn.js
var exKitLegacyFn = __webpack_require__(509);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.map.js
var es_array_map = __webpack_require__(23);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.array.splice.js
var es_array_splice = __webpack_require__(55);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.promise.js
var es_promise = __webpack_require__(21);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.replace.js
var es_string_replace = __webpack_require__(124);

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.string.trim.js
var es_string_trim = __webpack_require__(198);

// CONCATENATED MODULE: ./src/sandbox/legacyExKit.js







const legacyExKit = {
  prepareTrackerR: {
    hasEndSlash: /\/$/
  },
  prepareTracker: function prepareTracker(tracker) {
    const itemList = ['onGetValue', 'onSelectorIsNotFound', 'onEmptySelectorValue'];

    for (let i = 0, item; item = itemList[i]; i++) {
      if (!tracker.search[item]) {
        tracker.search[item] = {};
      }
    }

    if (!tracker.search.requestType) {
      tracker.search.requestType = 'GET';
    } else {
      tracker.search.requestType = tracker.search.requestType.toUpperCase();
    }

    if (tracker.search.rootUrl && !legacyExKit.prepareTrackerR.hasEndSlash.test(tracker.search.rootUrl)) {
      tracker.search.rootUrl = tracker.search.rootUrl + '/';
    }

    if (tracker.search.baseUrl && !legacyExKit.prepareTrackerR.hasEndSlash.test(tracker.search.baseUrl)) {
      tracker.search.baseUrl = tracker.search.baseUrl + '/';
    }

    return tracker;
  },
  parseHtml: function parseHtml(html, location) {
    return API_getDoc(html, location);
  },
  intList: ['categoryId', 'size', 'seed', 'peer', 'date'],
  isUrlList: ['categoryUrl', 'url', 'downloadUrl', 'nextPageUrl'],
  urlCheck: function urlCheck(details, tracker, value) {
    return API_normalizeUrl(details.responseUrl, value);
  },
  matchSelector: function matchSelector(result, details) {
    const _this = this;

    const key = details.key;
    let item = details.item;
    const $dom = details.$dom;
    const tracker = details.tracker;
    const search = tracker.search;
    const error = {};

    if (typeof item === 'string') {
      item = {
        selector: item
      };
    }

    let node = $dom.find(item.selector).get(0);

    if (!node && search.onSelectorIsNotFound[key]) {
      node = search.onSelectorIsNotFound[key](details);
    }

    if (item.childNodeIndex !== undefined && node) {
      let childNodeIndex = item.childNodeIndex;

      if (childNodeIndex < 0) {
        childNodeIndex = node.childNodes.length + item.childNodeIndex;
      }

      node = node.childNodes[childNodeIndex];
    }

    if (!node) {
      error[key] = node;
      error[key + '!'] = 'Selector is not found!';
      error[key + 'Selector'] = item.selector;
      return;
    }

    let value = null;

    if (item.attr) {
      value = node.getAttribute(item.attr);
    } else if (item.prop) {
      value = node[item.prop];
    } else if (item.html) {
      value = node.innerHTML;
    } else {
      value = node.textContent;
    }

    if (value) {
      value = $.trim(value);
    }

    if (!value && search.onEmptySelectorValue[key]) {
      value = search.onEmptySelectorValue[key](details);
    }

    if (!value && value !== 0) {
      error[key] = value;

      if (item.attr) {
        error[key + '!'] = 'Attribute is not found!';
      } else if (item.prop) {
        error[key + '!'] = 'Property is not found!';
      } else if (item.html) {
        error[key + '!'] = 'Html content is empty!';
      } else {
        error[key + '!'] = 'Text content is empty!';
      }

      return;
    }

    if (search.onGetValue[key]) {
      value = search.onGetValue[key](details, value);
    }

    if (legacyExKit.intList.indexOf(key) !== -1) {
      let intValue = parseInt(value);

      if (isNaN(intValue)) {
        intValue = -1;
        error[key] = value;
        error[key + '!'] = 'isNaN';
      }

      value = intValue;
    } else {
      if (legacyExKit.isUrlList.indexOf(key) !== -1) {
        value = legacyExKit.urlCheck(details, tracker, value);
      }
    }

    result[key] = value;
  },
  matchTorrentSelector: function matchTorrentSelector(trObj, details) {
    const _this = this;

    const key = details.key;
    let item = details.item;
    const $node = details.$node;
    const tracker = details.tracker;
    const search = tracker.search;

    if (typeof item === 'string') {
      item = {
        selector: item
      };
    }

    let node = trObj.cache[item.selector];

    if (!node) {
      node = trObj.cache[item.selector] = $node.find(item.selector).get(0);
    }

    if (!node && search.onSelectorIsNotFound[key]) {
      node = search.onSelectorIsNotFound[key](details);
    }

    if (item.childNodeIndex !== undefined && node) {
      let childNodeIndex = item.childNodeIndex;

      if (childNodeIndex < 0) {
        childNodeIndex = node.childNodes.length + item.childNodeIndex;
      }

      node = node.childNodes[childNodeIndex];
    }

    if (!node) {
      trObj.error[key] = node;
      trObj.error[key + '!'] = 'Selector is not found!';
      trObj.error[key + 'Selector'] = item.selector;
      return;
    }

    let value = null;

    if (item.attr) {
      value = node.getAttribute(item.attr);
    } else if (item.prop) {
      value = node[item.prop];
    } else if (item.html) {
      value = node.innerHTML;
    } else {
      value = node.textContent;
    }

    if (value) {
      value = $.trim(value.replace(/\r?\n/g, ' '));
    }

    if (!value && search.onEmptySelectorValue[key]) {
      value = search.onEmptySelectorValue[key](details);
    }

    if (!value && value !== 0) {
      trObj.error[key] = value;

      if (item.attr) {
        trObj.error[key + '!'] = 'Attribute is not found!';
      } else if (item.prop) {
        trObj.error[key + '!'] = 'Property is not found!';
      } else if (item.html) {
        trObj.error[key + '!'] = 'Html content is empty!';
      } else {
        trObj.error[key + '!'] = 'Text content is empty!';
      }

      return;
    }

    if (search.onGetValue[key]) {
      value = search.onGetValue[key](details, value);
    }

    if (legacyExKit.intList.indexOf(key) !== -1) {
      let intValue = parseInt(value);

      if (isNaN(intValue)) {
        intValue = -1;
        trObj.error[key] = value;
        trObj.error[key + '!'] = 'isNaN';
      }

      value = intValue;
    } else {
      if (legacyExKit.isUrlList.indexOf(key) !== -1) {
        value = legacyExKit.urlCheck(details, tracker, value);
      }
    }

    trObj.column[key] = value;
    return value;
  },
  isEmptyObject: function isEmptyObject(obj) {
    for (let item in obj) {
      return false;
    }

    return true;
  },
  matchTorrentItem: function matchTorrentItem($node, details) {
    const _this = this;

    details.$node = $node;
    const tracker = details.tracker;
    const search = tracker.search;

    if (search.onGetListItem) {
      search.onGetListItem(details);
    }

    const trObj = Object.create({
      cache: {}
    });
    trObj.column = {};
    trObj.error = {};

    for (let key in search.torrentSelector) {
      const selDetails = Object.create(details);
      selDetails.item = search.torrentSelector[key];
      selDetails.key = key;

      _this.matchTorrentSelector(trObj, selDetails);
    }

    if (!trObj.column.title || !trObj.column.url) {
      console.debug('[' + tracker.id + ']', 'Skip torrent:', trObj);
      return;
    }

    if (!trObj.column.categoryId && trObj.column.categoryId !== 0) {
      trObj.column.categoryId = -1;
    }

    if (!trObj.column.date) {
      trObj.column.date = -1;
    }

    if (!_this.isEmptyObject(trObj.error)) {
      console.debug('[' + tracker.id + ']', 'Torrent has problems:', trObj);
    }

    return trObj.column;
  },
  parseDom: function parseDom(details) {
    const _this = this;

    const tracker = details.tracker;
    const search = tracker.search;

    if (search.onBeforeDomParse) {
      search.onBeforeDomParse(details);
    }

    if (details.result) {
      return details.result;
    }

    const dom = legacyExKit.parseHtml(details.data, details.responseUrl);
    const $dom = details.$dom = $(dom);

    if (search.onAfterDomParse) {
      search.onAfterDomParse(details);

      if (details.result) {
        return details.result;
      }
    }

    if (search.loginFormSelector && $dom.find(search.loginFormSelector).length) {
      return {
        requireAuth: 1
      };
    }

    const torrentElList = $dom.find(search.listItemSelector);

    if (search.listItemSplice) {
      if (search.listItemSplice[0] !== 0) {
        torrentElList.splice(0, search.listItemSplice[0]);
      }

      if (search.listItemSplice[1] !== 0) {
        torrentElList.splice(search.listItemSplice[1]);
      }
    }

    const resultObj = {};
    const torrentList = resultObj.torrentList = [];
    let item;

    for (let i = 0, len = torrentElList.length; i < len; i++) {
      item = _this.matchTorrentItem(torrentElList.eq(i), Object.create(details));
      item && torrentList.push(item);
    }

    if (search.nextPageSelector) {
      const selDetails = Object.create(details);
      selDetails.item = search.nextPageSelector;
      selDetails.key = 'nextPageUrl';

      _this.matchSelector(resultObj, selDetails);
    }

    return resultObj;
  },
  search: function search(tracker, _details) {
    const _this = this;

    const query = _details.query;
    const details = {
      tracker: tracker,
      query: query
    };
    let charset = tracker.search.charset;

    if (!charset && tracker.search.requestMimeType) {
      const m = /charset=([^;]+)/.exec(tracker.search.requestMimeType);

      if (m) {
        charset = m[1];
      }
    }

    if (tracker.search.onBeforeRequest) {
      tracker.search.onBeforeRequest(details);
    } else {
      details.query = encodeURIComponent(details.query);
    }

    const requestOptions = {};
    let headers = {};

    if (tracker.search.requestHeaders) {
      headers = JSON.parse(tracker.search.requestHeaders);
    }

    if (!_details.url) {
      Object.assign(requestOptions, {
        method: tracker.search.requestType,
        url: tracker.search.searchUrl.replace('%search%', details.query),
        data: (tracker.search.requestData || '').replace('%search%', details.query),
        charset: charset,
        headers: headers
      });
    } else {
      Object.assign(requestOptions, {
        method: 'GET',
        url: _details.url,
        charset: charset,
        headers: headers
      });
    }

    return API_request(requestOptions).then(function (response) {
      details.data = response.body;
      details.responseUrl = response.url;
      details.requestUrl = requestOptions.url;
    }).then(function () {
      if (tracker.search.onAfterRequest) {
        tracker.search.onAfterRequest(details);

        if (details.result) {
          return details.result;
        }
      }

      return _this.parseDom(details);
    }).then(function (result) {
      if (result.requireAuth) {
        result.requireAuth = tracker.search.loginUrl;
      }

      return result;
    });
  }
};

const API_legacyExKit = function API_legacyExKit(trackerObj) {
  return API_async(() => {
    return __webpack_require__.e(/* import() */ 4).then(__webpack_require__.t.bind(null, 652, 7)).then(jQuery => {
      window.$ = window.jQuery = jQuery.default;
    }).then(() => {
      const tracker = trackerObj;
      legacyExKit.prepareTracker(tracker);

      const search = function search(query, nextPageUrl) {
        return legacyExKit.search(tracker, {
          query: query,
          url: nextPageUrl
        }).then(function (result) {
          if (result.requireAuth) {
            const err = new Error('Auth required');
            err.code = 'AUTH_REQUIRED';
            err.url = result.requireAuth;
            throw err;
          }

          return {
            success: true,
            results: result.torrentList.map(item => {
              return {
                categoryTitle: item.categoryTitle,
                categoryUrl: item.categoryUrl,
                categoryId: item.categoryId,
                title: item.title,
                url: item.url,
                size: item.size,
                downloadUrl: item.downloadUrl,
                seeds: item.seed,
                peers: item.peer,
                date: item.date
              };
            }),
            nextPageRequest: result.nextPageUrl && {
              event: 'getNextPage',
              url: result.nextPageUrl,
              query: query
            }
          };
        });
      };

      API_event('getNextPage', function (request) {
        return search(request.query, request.url);
      });
      API_event('search', function (request) {
        return search(request.query);
      });
    });
  });
};


// EXTERNAL MODULE: ./src/sandbox/exKitTracker.js
var sandbox_exKitTracker = __webpack_require__(534);

// EXTERNAL MODULE: ./src/tools/encodeCp1251.js
var encodeCp1251 = __webpack_require__(529);

// CONCATENATED MODULE: ./src/sandbox/exKit.js
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "exKit", function() { return exKit; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "API_exKit", function() { return API_exKit; });







const exKit = {
  funcList: {
    encodeCp1251: encodeCp1251["a" /* default */],
    idInCategoryList: function idInCategoryList(tracker, cId) {
      const mapNameId = {
        serials: 0,
        music: 1,
        games: 2,
        films: 3,
        cartoon: 4,
        books: 5,
        soft: 6,
        anime: 7,
        doc: 8,
        sport: 9,
        xxx: 10,
        humor: 11
      };

      for (let key in tracker.categoryList) {
        const list = tracker.categoryList[key];

        if (list.indexOf(cId) !== -1) {
          return mapNameId[key];
        }
      }

      return -1;
    },
    idInCategoryListInt: function idInCategoryListInt(tracker, url, regexp) {
      let cId = url.match(regexp);
      cId = cId && cId[1];

      if (cId === null) {
        return -1;
      }

      cId = parseInt(cId);
      return this.idInCategoryList(tracker, cId);
    },
    idInCategoryListStr: function idInCategoryListStr(tracker, url, regexp) {
      let cId = url.match(regexp);
      cId = cId && cId[1];

      if (cId === null) {
        return -1;
      }

      return this.idInCategoryList(tracker, cId);
    }
  }
};
exKit.funcList.dateFormat = exKitLegacyFn["dateFormat"];
exKit.funcList.monthReplace = exKitLegacyFn["monthReplace"];
exKit.funcList.sizeFormat = exKitLegacyFn["sizeFormat"];
exKit.funcList.todayReplace = exKitLegacyFn["todayReplace"];

const API_exKit = code => {
  return API_async(() => {
    if (!code.version) {
      return API_legacyExKit(code);
    }

    const exKitTracker = new sandbox_exKitTracker["a" /* default */]();
    return exKitTracker.init(code).then(() => {
      const onResult = result => {
        let nextPageRequest = null;

        if (result.nextPageUrl) {
          nextPageRequest = {
            url: result.nextPageUrl
          };
        }

        return {
          success: true,
          results: result.results,
          nextPageRequest: nextPageRequest
        };
      };

      API_event('search', request => {
        const session = {
          tracker: exKitTracker,
          event: 'search',
          request
        };
        return exKitTracker.search(session, request.query).then(response => {
          return exKitTracker.parseResponse(session, response);
        }).then(onResult);
      });
      API_event('getNextPage', request => {
        const session = {
          tracker: exKitTracker,
          event: 'getNextPage',
          request
        };
        return exKitTracker.searchNext(session, request.url).then(response => {
          return exKitTracker.parseResponse(session, response);
        }).then(onResult);
      });
    });
  });
};



/***/ }),

/***/ 73:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var PROPER_FUNCTION_NAME = __webpack_require__(82).PROPER;
var defineBuiltIn = __webpack_require__(26);
var anObject = __webpack_require__(19);
var $toString = __webpack_require__(30);
var fails = __webpack_require__(6);
var getRegExpFlags = __webpack_require__(125);

var TO_STRING = 'toString';
var RegExpPrototype = RegExp.prototype;
var nativeToString = RegExpPrototype[TO_STRING];

var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) !== '/a/b'; });
// FF44- RegExp#toString has a wrong name
var INCORRECT_NAME = PROPER_FUNCTION_NAME && nativeToString.name !== TO_STRING;

// `RegExp.prototype.toString` method
// https://tc39.es/ecma262/#sec-regexp.prototype.tostring
if (NOT_GENERIC || INCORRECT_NAME) {
  defineBuiltIn(RegExpPrototype, TO_STRING, function toString() {
    var R = anObject(this);
    var pattern = $toString(R.source);
    var flags = $toString(getRegExpFlags(R));
    return '/' + pattern + '/' + flags;
  }, { unsafe: true });
}


/***/ }),

/***/ 85:
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var DESCRIPTORS = __webpack_require__(11);
var globalThis = __webpack_require__(5);
var uncurryThis = __webpack_require__(7);
var isForced = __webpack_require__(89);
var inheritIfRequired = __webpack_require__(98);
var createNonEnumerableProperty = __webpack_require__(35);
var create = __webpack_require__(46);
var getOwnPropertyNames = __webpack_require__(71).f;
var isPrototypeOf = __webpack_require__(51);
var isRegExp = __webpack_require__(419);
var toString = __webpack_require__(30);
var getRegExpFlags = __webpack_require__(125);
var stickyHelpers = __webpack_require__(166);
var proxyAccessor = __webpack_require__(420);
var defineBuiltIn = __webpack_require__(26);
var fails = __webpack_require__(6);
var hasOwn = __webpack_require__(17);
var enforceInternalState = __webpack_require__(25).enforce;
var setSpecies = __webpack_require__(96);
var wellKnownSymbol = __webpack_require__(10);
var UNSUPPORTED_DOT_ALL = __webpack_require__(200);
var UNSUPPORTED_NCG = __webpack_require__(201);

var MATCH = wellKnownSymbol('match');
var NativeRegExp = globalThis.RegExp;
var RegExpPrototype = NativeRegExp.prototype;
var SyntaxError = globalThis.SyntaxError;
var exec = uncurryThis(RegExpPrototype.exec);
var charAt = uncurryThis(''.charAt);
var replace = uncurryThis(''.replace);
var stringIndexOf = uncurryThis(''.indexOf);
var stringSlice = uncurryThis(''.slice);
// TODO: Use only proper RegExpIdentifierName
var IS_NCG = /^\?<[^\s\d!#%&*+<=>@^][^\s!#%&*+<=>@^]*>/;
var re1 = /a/g;
var re2 = /a/g;

// "new" should create a new object, old webkit bug
var CORRECT_NEW = new NativeRegExp(re1) !== re1;

var MISSED_STICKY = stickyHelpers.MISSED_STICKY;
var UNSUPPORTED_Y = stickyHelpers.UNSUPPORTED_Y;

var BASE_FORCED = DESCRIPTORS &&
  (!CORRECT_NEW || MISSED_STICKY || UNSUPPORTED_DOT_ALL || UNSUPPORTED_NCG || fails(function () {
    re2[MATCH] = false;
    // RegExp constructor can alter flags and IsRegExp works correct with @@match
    // eslint-disable-next-line sonarjs/inconsistent-function-call -- required for testing
    return NativeRegExp(re1) !== re1 || NativeRegExp(re2) === re2 || String(NativeRegExp(re1, 'i')) !== '/a/i';
  }));

var handleDotAll = function (string) {
  var length = string.length;
  var index = 0;
  var result = '';
  var brackets = false;
  var chr;
  for (; index < length; index++) {
    chr = charAt(string, index);
    if (chr === '\\') {
      result += chr + charAt(string, ++index);
      continue;
    }
    if (!brackets && chr === '.') {
      result += '[\\s\\S]';
    } else {
      if (chr === '[') {
        brackets = true;
      } else if (chr === ']') {
        brackets = false;
      } result += chr;
    }
  } return result;
};

var handleNCG = function (string) {
  var length = string.length;
  var index = 0;
  var result = '';
  var named = [];
  var names = create(null);
  var brackets = false;
  var ncg = false;
  var groupid = 0;
  var groupname = '';
  var chr;
  for (; index < length; index++) {
    chr = charAt(string, index);
    if (chr === '\\') {
      chr += charAt(string, ++index);
      // use `\x5c` for escaped backslash to avoid corruption by `\k<name>` to `\N` replacement below
      if (!ncg && charAt(chr, 1) === '\\') {
        result += '\\x5c';
        continue;
      }
    } else if (chr === ']') {
      brackets = false;
    } else if (!brackets) switch (true) {
      case chr === '[':
        brackets = true;
        break;
      case chr === '(':
        result += chr;
        if (exec(IS_NCG, stringSlice(string, index + 1))) {
          index += 2;
          ncg = true;
          groupid++;
        } else if (charAt(string, index + 1) !== '?') {
          groupid++;
        }
        continue;
      case chr === '>' && ncg:
        if (groupname === '' || hasOwn(names, groupname)) {
          throw new SyntaxError('Invalid capture group name');
        }
        names[groupname] = true;
        named[named.length] = [groupname, groupid];
        ncg = false;
        groupname = '';
        continue;
    }
    if (ncg) groupname += chr;
    else result += chr;
  }
  // convert `\k<name>` backreferences to numbered backreferences
  for (var ni = 0; ni < named.length; ni++) {
    var backref = '\\k<' + named[ni][0] + '>';
    var numRef = '\\' + named[ni][1];
    while (stringIndexOf(result, backref) > -1) {
      result = replace(result, backref, numRef);
    }
  } return [result, named];
};

// `RegExp` constructor
// https://tc39.es/ecma262/#sec-regexp-constructor
if (isForced('RegExp', BASE_FORCED)) {
  var RegExpWrapper = function RegExp(pattern, flags) {
    var thisIsRegExp = isPrototypeOf(RegExpPrototype, this);
    var patternIsRegExp = isRegExp(pattern);
    var flagsAreUndefined = flags === undefined;
    var groups = [];
    var rawPattern = pattern;
    var rawFlags, dotAll, sticky, handled, result, state;

    if (!thisIsRegExp && patternIsRegExp && flagsAreUndefined && pattern.constructor === RegExpWrapper) {
      return pattern;
    }

    if (patternIsRegExp || isPrototypeOf(RegExpPrototype, pattern)) {
      pattern = pattern.source;
      if (flagsAreUndefined) flags = getRegExpFlags(rawPattern);
    }

    pattern = pattern === undefined ? '' : toString(pattern);
    flags = flags === undefined ? '' : toString(flags);
    rawPattern = pattern;

    if (UNSUPPORTED_DOT_ALL && 'dotAll' in re1) {
      dotAll = !!flags && stringIndexOf(flags, 's') > -1;
      if (dotAll) flags = replace(flags, /s/g, '');
    }

    rawFlags = flags;

    if (MISSED_STICKY && 'sticky' in re1) {
      sticky = !!flags && stringIndexOf(flags, 'y') > -1;
      if (sticky && UNSUPPORTED_Y) flags = replace(flags, /y/g, '');
    }

    if (UNSUPPORTED_NCG) {
      handled = handleNCG(pattern);
      pattern = handled[0];
      groups = handled[1];
    }

    result = inheritIfRequired(NativeRegExp(pattern, flags), thisIsRegExp ? this : RegExpPrototype, RegExpWrapper);

    if (dotAll || sticky || groups.length) {
      state = enforceInternalState(result);
      if (dotAll) {
        state.dotAll = true;
        state.raw = RegExpWrapper(handleDotAll(pattern), rawFlags);
      }
      if (sticky) state.sticky = true;
      if (groups.length) state.groups = groups;
    }

    if (pattern !== rawPattern) try {
      // fails in old engines, but we have no alternatives for unsupported regex syntax
      createNonEnumerableProperty(result, 'source', rawPattern === '' ? '(?:)' : rawPattern);
    } catch (error) { /* empty */ }

    return result;
  };

  for (var keys = getOwnPropertyNames(NativeRegExp), index = 0; keys.length > index;) {
    proxyAccessor(RegExpWrapper, NativeRegExp, keys[index++]);
  }

  RegExpPrototype.constructor = RegExpWrapper;
  RegExpWrapper.prototype = RegExpPrototype;
  defineBuiltIn(globalThis, 'RegExp', RegExpWrapper, { constructor: true });
}

// https://tc39.es/ecma262/#sec-get-regexp-@@species
setSpecies('RegExp');


/***/ })

}]);
//# sourceMappingURL=chunk-11.js.map