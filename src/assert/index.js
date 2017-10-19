/**
 * Asserts help you to make sure, the buffer you're parsing
 * is in the correct format. These assertions are like chai, throwing an error
 * when an assertion doesn't hold.
 *
 * These functions won't modify {@link Corrode#vars}.
 */

import lodash from 'lodash';

/**
 * assert strict equal single value
 * @param {string} name   key of the value to test
 * @param {mixed}  value  comparision
 * @throws TypeError assertion-error
 */
export function equal(name, value){
    if(this.vars[name] !== value){
        throw new TypeError(`Expected ${value}, found ${this.vars[name]} at ${name}`);
    }
}

/**
 * assert deep equality each value in Object|Array
 * @param {string} name     key of the object|array to test
 * @param {mixed} testValue comparision, undefined for auto-detect
 * @throws TypeError assertion-error
 */
export function allEqual(name, testValue){
    let values = this.vars[name];
    if(!Array.isArray(values)){
        values = lodash.values(values);
    }

    if(typeof testValue === 'undefined'){
        testValue = values[0];
    }

    const notEqualObjects = values.filter(varValue => varValue !== testValue);
    if(notEqualObjects.length !== 0){
        throw new TypeError(`Expected values in ${JSON.stringify(this.vars[name])} to all be ${testValue}`);
    }
}

/**
 * assert equality objects
 * @param {string} name  key of the object to test
 * @param {object} value comparision
 * @throws TypeError assertion-error
 */
export function deepEqual(name, value){
    const binaryValue = this.vars[name];
    if(!lodash.isEqual(binaryValue, value)){
        throw new TypeError(`Expected ${JSON.stringify(value)}, found ${JSON.stringify(binaryValue)}`);
    }
}

/**
 * assert array|object to contain item
 * @param {string} name key of the value to test
 * @param {array|object} arr comparision
 * @throws TypeError assertion-error
 */
export function includes(name, arr){
    if(!lodash.includes(arr, this.vars[name])){
        throw new TypeError(`Expected ${JSON.stringify(arr)} to include ${this.vars[name]}`);
    }
}

/**
 * assert value to be within the bounds of an array
 * @param {string} name  key of the number to test
 * @param {array} value comparision
 * @throws TypeError assertion-error
 */
export function inBounds(name, value){
    const index = this.vars[name];

    if(index < 0 || index >= value.length){
        throw new TypeError(`Expected Array of ${value.length} items to be at least ${index} long`);
    }
}

/**
 * assert value via callback
 * @param {string}   name   key of the value to test
 * @param {function} fn     callback
 * @param {string}   testname optional test-name
 * @throws TypeError assertion-error
 */
export function callback(name, fn, testname = fn.name){
    if(!fn(this.vars[name])){
        throw new TypeError(`Callback failed at ${testname}(${this.vars[name]})`);
    }
}

/**
 * assert array to be a given length
 * @param {string}        name   key of the value to test
 * @param {number|string} length comparision
 * @throws TypeError assertion-error
 */
export function arrayLength(name, length){
    // try to get the length param from the vars if available
    if(typeof length === 'string' && this.vars[length] !== 'undefined'){
        length = this.vars[length];
    }

    if(typeof this.vars[name] === 'undefined' || this.vars[name].length !== length){
        throw new TypeError(`Expected array to have a length of ${length}, has ${this.vars[name].length}`);
    }
}

/**
 * asserts a variable exists in the first place
 * @param {string}   name   key of the value to test
 * @throws TypeError assertion-error
 */
export function exists(name){
    if(typeof this.vars[name] === 'undefined'){
        throw new TypeError(`Expected var ${name} to exist`);
    }
}

/**
 * asserts a variable matches a given bitmask
 * @param  {string} name         key of the value to test
 * @param  {number} mask         bitmask to match
 * @param  {boolean} assertMatch true: should match; false: shouldn't match
 * @throws TypeError assertion-error
 */
export function bitmask(name, mask, assertMatch = true){
    const val = this.vars[name];

    if((val & mask) === mask === !assertMatch){
        throw new TypeError(`Expected var ${name} to ${assertMatch ? '' : 'not '}match bitmask (value: 0b${val.toString(2)} assert: 0b${mask.toString(2)})`);
    }
}
