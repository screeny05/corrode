'use strict';

var lodash = require('lodash');

exports.tapBindObject = function (obj, ctx) {
    return lodash.mapValues(obj, function (fn) {
        return function () {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            return ctx.tap(fn.bind.apply(fn, [ctx].concat(args)));
        };
    });
};

exports.bindObject = function (obj, ctx) {
    return lodash.mapValues(obj, function (fn) {
        return fn.bind(ctx);
    });
};
//# sourceMappingURL=utils.js.map