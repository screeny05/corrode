"use strict";

var bind = function bind(fn) {
    return function (name) {
        var src = arguments.length <= 1 || arguments[1] === undefined ? name : arguments[1];

        this.vars[name] = fn(this.vars[src]);
    };
};

module.exports = {
    map: function map(name, fn) {
        this.vars[name] = fn(this.vars[name]);
    },
    fromArray: function fromArray(name, array) {
        var src = arguments.length <= 2 || arguments[2] === undefined ? name : arguments[2];

        this.vars[name] = array[this.vars[src]];
    },
    fromObjectArray: function fromObjectArray(name, array, attr) {
        var _this = this;

        var src = arguments.length <= 3 || arguments[3] === undefined ? name : arguments[3];

        var filtered = array.filter(function (item) {
            return item[attr] === _this.vars[src];
        });
        if (filtered.length === 0) {
            throw new Error("cannot find object in array with " + attr + " === " + src + "(" + this.vars[src] + ")");
        }
        this.vars[name] = filtered[0];
    },


    abs: bind(Math.abs),
    invert: bind(function (val) {
        return val * -1;
    }),
    trim: bind(function (str) {
        return str.trim();
    })
};
//# sourceMappingURL=map.js.map