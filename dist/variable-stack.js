'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function VariableStack() {
        _classCallCheck(this, VariableStack);

        this.stack = [{ isRoot: true, value: {} }];
    }

    _createClass(VariableStack, [{
        key: 'peekLayer',
        value: function peekLayer() {
            var layerCount = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

            if (layerCount > this.stack.length - 1) {
                throw new Error('can\'t retireve layer ' + layerCount + ', stack is ' + (this.stack.length - 1) + ' layers' + (this.stack.length === 1 ? ' (only root)' : ''));
            }
            return this.stack[this.stack.length - 1 - layerCount];
        }
    }, {
        key: 'peek',
        value: function peek() {
            var layerCount = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

            return this.peekLayer(layerCount).value;
        }
    }, {
        key: 'push',
        value: function push(name) {
            var value = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            if (_typeof(this.top.value[name]) === 'object' && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object') {
                value = this.value[name];
            } else {
                this.top.value[name] = value;
            }

            this.stack.push({
                isRoot: false,
                name: name,
                value: value
            });
        }
    }, {
        key: 'pop',
        value: function pop() {
            var popLayer = this.top;
            if (popLayer.isRoot) {
                throw new Error('can\'t pop root layer');
            }

            this.stack.pop();

            this.value[popLayer.name] = popLayer.value;
        }
    }, {
        key: 'popAll',
        value: function popAll() {
            while (!this.top.isRoot) {
                this.pop();
            }
        }
    }, {
        key: 'top',
        get: function get() {
            return this.peekLayer(0);
        }
    }, {
        key: 'value',
        get: function get() {
            return this.top.value;
        },
        set: function set(val) {
            this.top.value = val;
        }
    }]);

    return VariableStack;
}();
//# sourceMappingURL=variable-stack.js.map