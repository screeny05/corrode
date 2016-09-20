import CorrodeBase from './base';
import utils from './utils';
import { isPlainObject } from 'lodash';

import * as MAPPERS from './map';
import * as ASSERTIONS from './assert';
const EXTENSIONS = {};

export default class Corrode extends CorrodeBase {
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

    terminatedBuffer(name, terminator = 0, discardTerminator = true){
        let bufferLength = null;
        const loopVar = Symbol.for('terminatedBufferTmp');

        return this
            .tap(function(){
                terminator = typeof terminator === 'string' ? this.vars[terminator] : terminator;
                this.isSeeking = true;
            })
            .loop(function(end, discard, i){
                this
                    .uint8(loopVar)
                    .tap(function(){
                        if(this.vars[loopVar] === terminator){
                            bufferLength = i + 1;
                            end();
                        }
                    });
            })
            .tap(function(){
                delete this.vars[loopVar];
                this.vars[name] = this.streamBuffer.slice(this.chunkOffset - bufferLength, this.chunkOffset + (discardTerminator ? -1 : 0));
                this.isSeeking = false;
            });
    }

    terminatedString(name, terminator = 0, discardTerminator = true, encoding = 'utf8'){
        return this
            .terminatedBuffer(name, terminator, discardTerminator)
            .tap(function(){
                if(!this.vars[name] || this.vars[name].length === 0){
                    this.vars[name] = '';
                } else {
                    this.vars[name] = this.vars[name].toString(encoding);
                }
            });
    }

    pointer(name, obj, type = 'int64'){
        return this
            .tap(function(){
                if(typeof obj === 'string'){
                    obj = this.vars[obj];
                }

                this
                    [type](name)
                    .map.abs(name)
                    .map.get(name, obj);
            });
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
        this.on('finish', () => done(this.vars));
        return this;
    }
}

Corrode.addExtension = function(name, fn){
    EXTENSIONS[name] = function(name = 'values', ...args){
        return this.tap(name, function(){
            const value = fn.apply(this, args);

            if(typeof value !== 'undefined'){
                if(this.options.strictObjectMode && this.jobs.length > 0 && !isPlainObject(value)){
                    throw new TypeError(`Can't mix immediate returns with later reads on a non-object value (${JSON.stringify(value)}) in strictObjectMode`);
                }
                this.vars = value;
            }
        });
    };

    EXTENSIONS[name].orgFn = fn;
};

Corrode.EXTENSIONS = EXTENSIONS;
Corrode.MAPPERS = MAPPERS;
Corrode.ASSERTIONS = ASSERTIONS;
