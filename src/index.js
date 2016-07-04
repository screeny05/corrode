const CorrodeBase = require('./corrode-base');
const utils = require('./utils');

const lodash = require('lodash');
const fnName = require('function-name');

const EXTENSIONS = {};
const MAPPERS = require('./map');
const ASSERTIONS = require('./assert');

class Corrode extends CorrodeBase {
    constructor(){
        super(...arguments);

        this.ext = utils.bindObject(EXTENSIONS, this);
        this.map = utils.tapBindObject(MAPPERS, this);
        this.assert = utils.tapBindObject(ASSERTIONS, this);
    }

    loopMax(name, length, fn){
        if(length === 0){
            this.vars[name] = [];
            return this;
        }

        let currentPosition = 0;

        let loopGuard = function(end, discard){
            fn.call(this, currentPosition, end, discard);

            if(++currentPosition > length - 1){
                currentPosition = 0;
                end();
            }
        };

        if(typeof name === 'number'){
            fn = length;
            length = name;
            name = undefined;
        }

        if(!name){
            return this.loop(loopGuard);
        }

        return this.loop(name, loopGuard);
    }

    array(name, terminator = 0, type = 'uint8'){
        terminator = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;

        return this
            .loop(name, function(end){
                this
                    [type]('__value')
                    .tap(function(){
                        if(this.vars.__value === terminator){
                            end(true);
                        }
                    });
            })
            .tap(function(){
                this.vars[name] = this.vars[name].map(val => val.__value);
            });
    }

    terminatedString(name, terminator = 0, encoding = 'ascii'){
        terminator = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;

        return this
            .array(name, terminator)
            .tap(function(){
                if(!this.vars[name] || this.vars[name].length === 0){
                    this.vars[name] = '';
                } else {
                    this.vars[name] = new Buffer(this.vars[name]).toString(encoding);
                }
            });
    }

    pointer(name, array, type = 'int64'){
        return this
            [type](name)
            .map.abs(name)
            .assert.inArrayBounds(name, array)
            .map.fromArray(name, array);
    }

    position(offset){
        return this
            .tap(function(){
                if(typeof offset === 'string'){
                    this.assert.exists(offset);
                    offset = this.vars[offset];
                }

                this.skip(offset - this.streamOffset);
            });
    }

    pushVars(name = 'values'){
        return this
            .assert.exists(name)
            .tap(function(){
                this.vars = this.vars[name];
            });
    }

    debug(){
        return this.tap(function(){
            console.log(this.vars);
        });
    }

    fromBuffer(buffer){
        this.write(buffer);
        return this.vars_list.length > 0 ? this.vars_list[0] : this.vars;
    }
}

module.exports = function(){
    return new Corrode(...arguments);
};

module.exports.addExtension = function(name, fn, extension){
    fnName(fn, name);

    EXTENSIONS[name] = function(name = 'values', ...args){
        this.tap(name, function(){
            fn.apply(this, args);
        });

        if(typeof extension !== 'undefined'){
            this.tap(function(){
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
