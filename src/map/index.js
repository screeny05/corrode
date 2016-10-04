/**
 * These functions provide basic mapping-abilities to Corrode's VariableStack
 * {@link Corrode#vars}
 *
 * Imagine them like this:
 * ```
 * const parser = new Corrode();
 * parser.uint8('value').map.double('value');
 * ```
 *
 * Of course there's no real mapping-function which doubles a value.
 * But the concept is that they are functions receiving a value, processing it
 * and saving a new value in the {@link VariableStack} in place of the old one.
 *
 * The imaginary code above would yield `{ value: 4 }`, parsing a buffer like this `[2]`.
 *
 * There are two ways to create a mapper. Either by using the {bind} helper-function
 * which simply receives a value and returns one, or by defining the function yourself.
 *
 * The bind-utility only allows for simple functions with no additional parameters.
 * Our double-mapper would be a perfect example: `export const double = bind(val => val * 2)`.
 * These should be pure functions.
 *
 * The other way - defining your own mapper-function accepts deals with the {@link VariableStack}
 * at {@link Corrode#vars} by itself. This means: reads and writes from {@link Corrode#vars}. Because of that
 * they are inherently impure. A next step should be to move all mappers to pure functions.
 * (see Issue #28)
 *
 * Note that all mappers don't check for existance, validity or other assumptions.
 * You have to do that yourself with assertions.
 */

/**
 * helper function to bind a mapper
 * mappers created with this utility accept two parameters:
 * name and src, with the src defaulting to name.
 * This way, we get a mapper which per-default takes the target as the source
 * but also accepts a different source.
 * @param {function(val: *)} fn map-function
 * @return {function}         function ready to use in tap
 */
const bind = function(fn){
    return function(name, src = name){
        this.vars[name] = fn(this.vars[src]);
    };
};

/**
 * replace a variable in the stack by a mapped version of itself
 * @param {string}           name identifier of the variable to map
 * @param {function(val: *)} fn   map-function
 * @example
 * parser.uint8('value').map.callback('value', val => (val - 1) * 2)
 *
 * // [21] => { value: 10 }
 */
export function callback(name, fn){
    this.vars[name] = fn(this.vars[name]);
}

/**
 * retrieve a value from an accessable type (like array[0] or object['foo'])
 * @param {string} name                    identifier of the variable to map
 * @param {array|object|string} accessable accessable variable
 * @param {string} [src=name]              identifier of the variable in {@link Corrode#vars} by which to access `accessable`
 * @example <caption>get from array</caption>
 * parser.uint8('accessor').map.get('accessor', ['A', 'B', 'C', 'D'])
 *
 * // [2] => { accessor: 'C' }
 *
 * @example <caption>get from object</caption>
 * parser.terminatedString('accessor').map.get('accessor', { foo: 'A', bar: 'B', qux: 'C' })
 *
 * // ['q', 'u', 'x', 0x00] => { accessor: 'C' }
 */
export function get(name, accessable, src = name){
    this.vars[name] = accessable[this.vars[src]];
}

/**
 * retrieve a filtered array of objects from an array of objects, matching a specified attribute against a specified value
 * @param {string} name         identifier of the variable, to write to {@link Corrode#vars}
 * @param {Array<Object>} array array, containing the objects to filter
 * @param {string} attr         identifier of the attribute from an object of `array` to compare against
 * @param {string} [src=name]   {@link Corrode#vars}-identifier to read from
 * @throws {Error} when no object can be found
 * @example
 * parser.uint8('matchAgainst').map.findAll('matchAgainst', [
 *   { children: 1, name: 'foo' },
 *   { children: 2, name: 'bar' },
 *   { children: 2, name: 'qux' }
 * ], 'children')
 *
 * // [2] => { matchAgainst: [
 * //   { children: 2, name: 'bar' },
 * //   { children: 2, name: 'qux' }
 * // ]}
 *
 * // [1] => { matchAgainst: [
 * //   { children: 1, name: 'foo' }
 * // ]}
 */
export function findAll(name, array, attr, src = name){
    const filtered = array.filter(item => item[attr] === this.vars[src]);
    if(filtered.length === 0){
        throw new Error(`cannot find object in array with ${attr} === ${src}(${this.vars[src]})`);
    }
    this.vars[name] = filtered;
}

/**
 * retrieve the first object from an array of objects, matching a specified attribute against a specified value
 * like {@link findAll}, but returning only the first element
 * @param {string} name         identifier of the variable, to write to {@link Corrode#vars}
 * @param {Array<Object>} array array, containing the objects to filter
 * @param {string} attr         identifier of the attribute from an object of `array` to compare against
 * @param {string} [src=name]   {@link Corrode#vars}-identifier to read from
 * @throws {Error} when no object can be found
 * @example
 * parser.uint8('matchAgainst').map.find('matchAgainst', [
 *   { id: 1, name: 'foo' },
 *   { id: 7, name: 'bar' },
 *   { id: 4, name: 'qux' }
 * ], 'id')
 *
 * // [4] => { matchAgainst: { id: 4, name: 'qux' } }
 *
 * // [2] => Error cannot find object!
 */
export function find(name, array, attr, src = name){
    findAll.call(this, name, array, attr, src);
    this.vars[name] = this.vars[name][0];
}

/**
 * replace {@link Corrode#vars} completely with a value from {@link Corrode#vars}
 * especially useful when pushing a variable further up in the stack
 *
 * @example <caption>push loop-variables up</caption>
 * parser.loop('array', function(){
 *     this
 *         .uint8('value')
 *         .map.double()
 *         .map.push('value');
 * });
 *
 * // [1, 2, 3, 4] => { array: [2, 4, 6, 8] }
 *
 * @example <caption>push values in an extension</caption>
 * Corrode.addExtension('doStuff', function(){
 *     this
 *         .uint32('address')
 *         .tap(function(){
 *             this.vars.address = `0x${this.vars.address.toString(16)}`;
 *         })
 *         .map.push('address');
 * });
 *
 * parser.ext.doStuff('hexAddress');
 *
 * // [245] => { hexAddress: '0xf5' }
 *
 * @param {string} [name='values'] identifier of the variable being used as replacement
 */
export function push(name = 'values'){
    this.vars = this.vars[name];
}

/**
 * map a value by checking whether it has some bits set
 * @param {string} name    identifier of the variable, to write to {@link Corrode#vars}
 * @param  {Object|number} maskObject Object or number by which to check the bits of the variable to map
 * @example <caption>map via number</caption>
 * parser.uint8('bits').map.bitmask('bits', 0x80)
 *
 * // [0b10111110] => { bits: true }
 *
 * @example <caption>map via object</caption>
 * parser.uint8('bits').map.bitmask('bits', {
 *   isCompressed: 0x80,
 *   isReadOnly: 0x40
 * })
 *
 * // [0b10111110] => { bits: { isCompressed: true, isReadOnly: false } }
 */
export function bitmask(name, maskObject){
    const bits = this.vars[name];

    // shortcut for single values
    if(typeof maskObject === 'number'){
        return this.vars[name] = (bits & maskObject) === maskObject;
    }

    const values = {};
    Object.keys(maskObject).forEach(maskName => {
        const mask = maskObject[maskName];
        values[maskName] = (bits & mask) === mask;
    });
    this.vars[name] = values;
}

/**
 * retrieve absolute value of a number
 * {@link Math.abs}
 * @type {function}
 * @example
 * this.int8('value').map.abs('value')
 *
 * // [-14] => { value: 14 }
 */
export const abs = bind(Math.abs);

/**
 * retrieve inverted number
 * @type {function}
 * @example
 * this.uint8('value').map.abs('value')
 *
 * // [27] => { value: -27 }
 */
export const invert = bind(val => val * -1);

/**
 * retrieve trimmed string
 * @type {function}
 * @example
 * this.terminatedString('value').map.trim('value')
 *
 * // [' ', '\t', 'f', 'o', 'b', 'r', '\n'] => { value: 'fobr' }
 */
export const trim = bind(str => str.trim());
