import CorrodeBase from './base';
import * as utils from './utils';
import { isPlainObject } from 'lodash';

import * as MAPPERS from './map';
import * as ASSERTIONS from './assert';

import { inspect } from 'util';

/**
 * Corrode
 * A batteries-included library for reading your binary data.
 * It helps you converting that blob-mess into readable data.
 *
 * It inherits from {@link CorrodeBase} to make the abstraction between these
 * two components more obvious. CorrodeBase does all the dirty low-level work
 * reading bytes, managing jobs, etc. This class however doesn't manipulate
 * the {@link CorrodeBase#jobs}-array or messes in other ways with the {@link CorrodeBase#jobLoop}.
 *
 * This class builds on loop and tap to provide more complex functionality.
 */
export default class Corrode extends CorrodeBase {

    /**
     * object holding all the user-defined extensions.
     * these will get bound to the corrode-instance on calling the constructor
     * @type {Object<Function>}
     */
    static EXTENSIONS = {};

    /**
     * mappers-object
     * @type {Object<Function>}
     */
    static MAPPERS = MAPPERS;

    /**
     * assertions-object
     * @type {Object<Function>}
     */
    static ASSERTIONS = ASSERTIONS;

    /**
     * initializes mappers, assertions and extensions
     * @param {object} options {@link CorrodeBase#constructor}
     */
    constructor(options){
        super(...arguments);

        // bind ext, map & assert onto this instance
        /** @type {Object<bound Function>} ext {@link Corrode.EXTENSIONS} bound to this instance */
        this.ext = utils.bindObject(Corrode.EXTENSIONS, this);
        /** @type {Object<bound Function>} map {@link Corrode.MAPPERS} bound to this instance */
        this.map = utils.tapBindObject(Corrode.MAPPERS, this);
        /** @type {Object<bound Function>} assert {@link Corrode.ASSERTIONS} bound to this instance */
        this.assert = utils.tapBindObject(Corrode.ASSERTIONS, this);
    }

    /**
     * pushes a repeat-job onto the job-array
     * a repeat-job repeats itself a given number of times and then ends.
     * it's also possible to end the job prematurely or discard it.
     * This is nothing else than a proxy to {@link CorrodeBase#loop}
     * @param {string} [name] name of the new variable-layer. if none is provided, the current layer will be used
     * @param {number} length iteration-count as number or as string referencing a variable from {@link CorrodeBase#vars}
     * @param {function(end: function, discard: function, i: number)} fn called until `end()` is called.
     *        `end(true)` can be used to end and discard the current loop.
     *        `discard()` can be used to reset the current layer ({@link CorrodeBase#options.anonymousLoopDiscardDeep}).
     *        `i` is the current iteration count
     * @return {Corrode} this
     */
    repeat(name, length, fn){
        if(typeof name === 'number' || typeof length === 'function'){
            fn = length;
            length = name;
            name = undefined;
        }

        return this.tap(function(){
            if(typeof length === 'string'){
                length = this.vars[length];
            }

            if(length === 0){
                if(name){
                    this.vars[name] = [];
                }
                return this;
            }

            const loopGuard = function(end, discard, i){
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

    /**
     * pushes a terminatedBuffer-job onto the job-array
     * The returned Buffer will be a slice (not a copy) of the underlying {@link CorrodeBase#streamBuffer}
     * internally this method uses the isSeeking-property to prevent flushing of the
     * underlying buffer.
     * @param {string} name name of the buffer-variable
     * @param {number} [terminator=0] uint8-value indicating the end of the buffer
     * @param {boolean} [discardTerminator=true] whether or not to include the terminator in the resulting buffer
     * @return {Corrode} this
     */
    terminatedBuffer(name, terminator = 0, discardTerminator = true){
        let bufferLength = null;
        const loopVar = Symbol.for('terminatedBufferTmp');

        return this
            .tap(function(){
                terminator = typeof terminator === 'string' ? this.vars[terminator] : terminator;
                /** @type {boolean} isSeeking {@link CorrodeBase#isSeeking} */
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

    /**
     * pushes a terminatedString-job onto the job-array
     * Returns a string ranging from the current offset until the given terminator is found
     * @param {string} name name of the string-variable
     * @param {number} [terminator=0] uint8-value indicating the end of the buffer
     * @param {boolean} [discardTerminator=true] whether or not to include the terminator in the resulting buffer
     * @param {string} [encoding=CorrodeBase#options.encoding] encoding encoding used to decode the string, defaults to 'utf8'.
     *                 available encodings can be found here https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
     * @return {Corrode} this
     */
    terminatedString(name, terminator = 0, discardTerminator = true, encoding = this.options.encoding){
        return this
            .terminatedBuffer(name, terminator, discardTerminator)
            .tap(function(){
                if(!this.vars[name] || this.vars[name].length === 0){
                    // in case nothing is found, return an empty string
                    this.vars[name] = '';
                } else {
                    this.vars[name] = this.vars[name].toString(encoding);
                }
            });
    }

    /**
     * pushes a pointer-job onto the job-array
     * returns an item of an accessable type (object property, array element)
     * being given an accessable type. the offset used to access the accessable type
     * is determined by reading a value of the given type
     * @param {string} name name of the item-variable
     * @param {Object|Array} obj accessable type variable
     * @param {string} type name of the type which should be used to read the index (int8, uint32, etc)
     * @return {Corrode} this
     */
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

    /**
     * sets {@link CorrodeBase#streamOffset} to a given absolute position
     * like skip, but absolute
     * If you want to set the offset to something lower than the current offset, you should
     * enable {@link CorrodeBase#isSeeking} asap, as otherwise there's no guarantee that the buffer is still available
     * or already flushed.
     * @param {number|string} offset as number or as string referencing a variable from {@link CorrodeBase#vars}
     * @return {Corrode} this
     */
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

    /**
     * helper utility logging the current vars
     * @return {Corrode} this
     */
    debug(){
        return this.tap(function(){
            console.log(inspect(this.vars, {
                showHidden: false,
                depth: null
            }));
        });
    }

    /**
     * helper utility, parsing a given buffer async
     * @param {Buffer} buffer data
     * @param {function(error: *, data: object)} done callback
     * @return {Corrode} this
     */
    fromBuffer(buffer, done){
        this.end(buffer);
        this.on('finish', () => done(this.vars));
        return this;
    }

    /**
     * adds an extension to corrode.
     * extensions are user-defined functions allowing you to better abstract upon corrode
     * an extension can accept parameters and receives the current available variables.
     * it can either directly return values or read them from the buffer with corrode's functions.
     * @param {string} name of the extension
     * @param {function(...args: *)} fn function receiving arguments given when calling the extension
     * @example <caption>Extension reading values</caption>
     * Corrode.addExtension('foo', function(arg1){ this.uint8(arg1); });
     * (new Corrode()).ext.foo('foo_value', 'arg1');
     * @example <caption>Extension returning values</caption>
     * Corrode.addExtension('bar', function(arg1){ return this.vars[arg1] * this.vars[arg1] });
     * (new Corrode()).ext.bar('bar_value', 'arg1')
     */
    static addExtension(name, fn){
        Corrode.EXTENSIONS[name] = function(name = 'values', ...args){
            return this.tap(name, function(){
                const value = fn.apply(this, args);

                if(typeof value !== 'undefined'){
                    if(this.options.strictObjectMode && this.jobs.length > 0 && value !== this && !isPlainObject(value)){
                        throw new TypeError(`Can't mix immediate returns with later reads on a non-object value (${JSON.stringify(value)}) in strictObjectMode`);
                    }
                    /** @type {Object} vars {@link CorrodeBase#vars} */
                    this.vars = value;
                }
            });
        };

        Corrode.EXTENSIONS[name].orgFn = fn;
    }
}
