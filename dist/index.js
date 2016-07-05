'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CorrodeBase = require('./base');
var utils = require('./utils');

var lodash = require('lodash');
var fnName = require('function-name');

var EXTENSIONS = {};
var MAPPERS = require('./map');
var ASSERTIONS = require('./assert');

var Corrode = function (_CorrodeBase) {
    _inherits(Corrode, _CorrodeBase);

    function Corrode() {
        _classCallCheck(this, Corrode);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Corrode).apply(this, arguments));

        _this.ext = utils.bindObject(EXTENSIONS, _this);
        _this.map = utils.tapBindObject(MAPPERS, _this);
        _this.assert = utils.tapBindObject(ASSERTIONS, _this);
        return _this;
    }

    _createClass(Corrode, [{
        key: 'loopMax',
        value: function loopMax(name, length, fn) {
            if (length === 0) {
                this.vars[name] = [];
                return this;
            }

            var currentPosition = 0;

            var loopGuard = function loopGuard(end, discard) {
                fn.call(this, currentPosition, end, discard);

                if (++currentPosition > length - 1) {
                    currentPosition = 0;
                    end();
                }
            };

            if (typeof name === 'number') {
                fn = length;
                length = name;
                name = undefined;
            }

            if (!name) {
                return this.loop(loopGuard);
            }

            return this.loop(name, loopGuard);
        }
    }, {
        key: 'array',
        value: function array(name) {
            var terminator = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
            var type = arguments.length <= 2 || arguments[2] === undefined ? 'uint8' : arguments[2];

            terminator = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;

            return this.loop(name, function (end) {
                this[type]('__value').tap(function () {
                    if (this.vars.__value === terminator) {
                        end(true);
                    }
                });
            }).tap(function () {
                this.vars[name] = this.vars[name].map(function (val) {
                    return val.__value;
                });
            });
        }
    }, {
        key: 'terminatedString',
        value: function terminatedString(name) {
            var terminator = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
            var encoding = arguments.length <= 2 || arguments[2] === undefined ? 'ascii' : arguments[2];

            terminator = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;

            return this.array(name, terminator).tap(function () {
                if (!this.vars[name] || this.vars[name].length === 0) {
                    this.vars[name] = '';
                } else {
                    this.vars[name] = new Buffer(this.vars[name]).toString(encoding);
                }
            });
        }
    }, {
        key: 'pointer',
        value: function pointer(name, array) {
            var type = arguments.length <= 2 || arguments[2] === undefined ? 'int64' : arguments[2];

            return this[type](name).map.abs(name).assert.inArrayBounds(name, array).map.fromArray(name, array);
        }
    }, {
        key: 'position',
        value: function position(offset) {
            return this.tap(function () {
                if (typeof offset === 'string') {
                    this.assert.exists(offset);
                    offset = this.vars[offset];
                }

                this.skip(offset - this.streamOffset);
            });
        }
    }, {
        key: 'pushVars',
        value: function pushVars() {
            var name = arguments.length <= 0 || arguments[0] === undefined ? 'values' : arguments[0];

            return this.assert.exists(name).tap(function () {
                this.vars = this.vars[name];
            });
        }
    }, {
        key: 'debug',
        value: function debug() {
            return this.tap(function () {
                console.log(this.vars);
            });
        }
    }, {
        key: 'fromBuffer',
        value: function fromBuffer(buffer) {
            this.write(buffer);
            return this.vars_list.length > 0 ? this.vars_list[0] : this.vars;
        }
    }]);

    return Corrode;
}(CorrodeBase);

module.exports = function () {
    return new (Function.prototype.bind.apply(Corrode, [null].concat(Array.prototype.slice.call(arguments))))();
};

module.exports.addExtension = function (name, fn, extension) {
    fnName(fn, name);

    EXTENSIONS[name] = function () {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        var name = arguments.length <= 0 || arguments[0] === undefined ? 'values' : arguments[0];

        this.tap(name, function () {
            fn.apply(this, args);
        });

        if (typeof extension !== 'undefined') {
            this.tap(function () {
                lodash.extend(this.vars[name], extension);
            });
        }

        return this;
    };

    EXTENSIONS[name].orgFn = fn;
};

module.exports.EXTENSIONS = EXTENSIONS;
module.exports.MAPPERS = MAPPERS;
module.exports.ASSERTIONS = ASSERTIONS;
//# sourceMappingURL=index.js.map