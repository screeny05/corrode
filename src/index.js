import CorrodeBase from './base';
import utils from './utils';

import MAPPERS from './map';
import ASSERTIONS from './assert';
const EXTENSIONS = {};

module.exports = class Corrode extends CorrodeBase {
    constructor(){
        super(...arguments);

        this.ext = utils.bindObject(EXTENSIONS, this);
        this.map = utils.tapBindObject(MAPPERS, this);
        this.assert = utils.tapBindObject(ASSERTIONS, this);
    }

    repeat(name, length, fn){
        if(typeof name === 'number' || typeof length === 'function'){
            fn = length;
            length = name;
            name = undefined;
        }

        this.tap(function(){
            if(typeof length === 'string'){
                length = this.vars[length];
            }

            if(length === 0){
                if(name){
                    this.vars[name] = [];
                }
                return this;
            }

            let loopGuard = function(end, discard, i){
                fn.call(this, end, discard, i);

                if(i >= length - 1){
                    end();
                }
            };

            if(!name){
                return this.loop(loopGuard);
            }

            return this.loop(name, loopGuard);
        });
    }

    terminatedBuffer(name, terminator = 0, type = 'uint8', discardTerminator = true){
        terminator = typeof terminator === 'string' ? terminator.charCodeAt(0) : terminator;

        let bufferLength = 0;

        return this
            .loop(function(end, discard, i){
                this
                    [type]('__value')
                    .tap(function(){
                        if(this.vars.__value === terminator){
                            bufferLength = i;
                            end();
                        }
                    });
            })
            .tap(function(){
                this.vars[name] = this.streamBuffer.slice(this.streamOffset - bufferLength, bufferLength + (discardTerminator ? -1 : 0));
            });
    }

    terminatedString(name, terminator = 0, encoding = 'ascii', discardTerminator = true){
        return this
            .terminatedBuffer(name, terminator, 'uint8', discardTerminator)
            .tap(function(){
                if(!this.vars[name] || this.vars[name].length === 0){
                    this.vars[name] = '';
                } else {
                    this.vars[name] = this.vars[name].toString(encoding);
                }
            });
    }

    pointer(name, obj, type = 'int64'){
        if(typeof obj === 'string'){
            obj = this.vars[obj];
        }

        return this
            [type](name)
            .map.abs(name)
            .assert.includes(name, obj)
            .map.get(name, obj);
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

    debug(){
        return this.tap(function(){
            console.log(this.vars);
        });
    }

    fromBuffer(buffer, done){
        this.end(buffer);
        this.on('finish', done.bind(this));
        return this;
    }
}

module.exports.addExtension = function(name, fn){
    EXTENSIONS[name] = function(name = 'values', ...args){
        return this.tap(name, function(){
            const value = fn.apply(this, args);

            if(typeof value !== 'undefined'){
                this.vars = value;
            }
        });
    };

    EXTENSIONS[name].orgFn = fn;
};

module.exports.EXTENSIONS = EXTENSIONS;
module.exports.MAPPERS = MAPPERS;
module.exports.ASSERTIONS = ASSERTIONS;
