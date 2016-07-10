const lodash = require('lodash');

module.exports = {

    /**
     * assert strict equal single value
     * @param {string} name   key of the value to test
     * @param {mixed}  value  comparision
     * @throws TypeError assertion-error
     */
    equal(name, value){
        if(this.vars[name] !== value){
            throw new TypeError(`Expected ${value}, found ${this.vars[name]} at ${name}`);
        }
    },

    /**
     * assert deep equality each value in Object|Array
     * @param {string} name  key of the object|array to test
     * @param {mixed} value comparision, undefined for auto-detect
     * @throws TypeError assertion-error
     */
    allEqual(name, testValue){
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
    },

    /**
     * assert equality objects
     * @param {string} name  key of the object to test
     * @param {object} value comparision
     * @throws TypeError assertion-error
     */
    deepEqual(name, value){
        const binaryValue = this.vars[name];
        if(!lodash.isEqual(binaryValue, value)){
            throw new TypeError(`Expected ${JSON.stringify(value)}, found ${JSON.stringify(binaryValue)}`);
        }
    },

    /**
     * assert array to contain item
     * @param {string} name key of the value to test
     * @param {array} arr   comparision
     * @throws TypeError assertion-error
     */
    includes(name, arr){
        if(!lodash.includes(arr, this.vars[name])){
            throw new TypeError(`Expected ${JSON.stringify(arr)} to include ${this.vars[name]}`);
        }
    },

    /**
     * assert value to be within the bounds of an array
     * @param {string} name  key of the number to test
     * @param {array} value comparision
     * @throws TypeError assertion-error
     */
    inBounds(name, value){
        const index = this.vars[name];

        if(index < 0 || index >= value.length){
            throw new TypeError(`Expected Array of ${value.length} items to be at least ${this.vars[name]} long`);
        }
    },

    /**
     * assert value via callback
     * @param {string}   name   key of the value to test
     * @param {function} value  comparator
     * @param {string}   fnName optional test-name
     * @throws TypeError assertion-error
     */
    callback(name, fn, fnName = fn.name){
        if(!fn(this.vars[name])){
            throw new TypeError(`Callback failed at ${fnName}(${this.vars[name]})`);
        }
    },

    /**
     * assert array to be a given length
     * @param {string}   name   key of the value to test
     * @param {number} length comparision
     * @throws TypeError assertion-error
     */
    arrayLength(name, length){
        if(typeof this.vars[name] === 'undefined' || this.vars[name].length !== length){
            throw new TypeError(`Expected array to have a length of ${length}, has ${this.vars[name].length}`);
        }
    },

    /**
     * asserts a variable exists in the first place
     * @param {string}   name   key of the value to test
     * @throws TypeError assertion-error
     */
    exists(name){
        if(typeof this.vars[name] === 'undefined'){
            throw new TypeError(`Expected var ${name} to exist`);
        }
    }
};
