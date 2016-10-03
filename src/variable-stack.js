/**
 * The VariableStack is a special kind of stack.
 * It allows corrode to do black magic like loops in loops and other crazy stuff.
 *
 * To enable this we define a stack as an object, containing other objects.
 * Seen this way it looks more like a TreeStructure which layers you can
 * push and pop as you like.
 *
 * The VariableStack starts as an "empty" object.
 * "empty" meaning, that each layer is an object consisting of two/three values:
 * * `isRoot` telling the user whether this layer is the uppermost one.
 * * `value` holding the value for this layer.
 * * `[name]` name of this layer (root-layer won't have one)
 *
 * Pushing a new layer means adding a new object to the `value`-object of
 * the current layer and setting the current layer to our newly created one.
 *
 * Actually, the object getting added to the `value`-object is not just any object.
 * It itself is an object like `{ isRoot: false, value: {} }`.
 *
 * The root-layer (layer-object where `isRoot === true`) is the lowest layer.
 * The current layer is the topmost one.
 *
 * @example
 *  +--------------------------+                +-----------------+
 *  | VariableStack#value:     |                |                 | current layer
 *  | {                        |                | {}              |
 *  |   value_1: { foo: 'bar' }|                |                 | isRoot: false
 *  | }                        |                +-----------------+
 *  +------------+-------------+                |                 |
 *               |                              | {               |
 *               +                              |   foo: 'bar',   | VariableStack
 *         .push('value_1')                     |   value_2: {}   | #peek(1)
 *               +                +---------->  | }               |
 *               |                              |                 | isRoot: false
 *               v                +---------->  +-----------------+
 *   +-----------+----------+                   |                 |
 *   |#value: { foo: 'bar' }|                   | {               |
 *   +-----------+----------+                   |   value_1: {    | VariableStack
 *               |                              |     foo: 'bar', | #peek(2)
 *               +                              |     value_2: {} |
 *       .push('value_2')                       |   }             | isRoot: true
 *               +                              | }               |
 *               |                              |                 |
 *               v                              +-----------------+
 *          +----+-----+
 *          |#value: {}|
 *          +----------+
 *
*/
export default class VariableStack {

    /**
     * internal storage for the stack
     * @access public
     * @type {Array<Object>}
     */
    stack = [{ isRoot: true, value: {} }];

    /**
     * retrieve the top-layer
     * @return {Object} the current layer
     */
    get top(){
        return this.peekLayer(0);
    }

    /**
     * retrieve the value of the top.layer
     * @return {Object|*} the current value
     */
    get value(){
        return this.top.value;
    }

    /**
     * set the current value
     * this also updates the value in the parent-layer
     * @param {Object|*} val the new value
     */
    set value(val){
        if(!this.top.isRoot){
            this.peek()[this.top.name] = val;
        }
        this.top.value = val;
    }

    /**
     * get a layer below the current one
     * @param {number} layerCount how many layers deeper relative from the current
     * @return {Object} layer-object
     */
    peekLayer(layerCount = 1){
        if(layerCount > this.stack.length - 1){
            throw new ReferenceError(`can't retrieve layer ${layerCount}, stack is ${this.stack.length - 1} layers`);
        }
        return this.stack[this.stack.length - 1 - layerCount];
    }

    /**
     * get the value of a layer below the current one
     * @param {number} layerCount how many layers deeper relative from the current
     * @return {Object|*} value
     */
    peek(layerCount = 1){
        return this.peekLayer(layerCount).value;
    }

    /**
     * push a value onto the stack
     *
     * The value doesn't have to be a object, but only objects will properly support child-layers.
     * When pushing the new layer the current one will receive a reference to the pushed
     * object as a value at the given name.
     *
     * Note, that if you're pushing a non-object value this reference will not work,
     * as only arrays & objects are passed by reference. Instead the value in the
     * layer above will be updated, when the current layer's value will be set.
     *
     * If the value you want to push already exists at the current layer
     * VariableStack ignores your value and just re-uses the old one, so no
     * layer will be replaced.
     *
     * @example
     * varStack.push('foo');
     * varStack.value.bar = 'baz';
     * // varStack.value => { bar: 'baz' }
     * // varStack.peek() => { foo: { bar: 'baz' } }
     *
     * @param {string} name name of the new layer
     * @param {Object|*} [value={}] value-object of the new layer
     */
    push(name, value = {}){
        if(typeof this.value[name] === 'undefined'){
            // only push new value if there's no old one
            this.value[name] = value;
        } else {
            // otherwise re-push the current one
            value = this.value[name];
        }

        this.stack.push({
            isRoot: false,
            name,
            value
        });
    }

    /**
     * pop the current layer
     * @throws {ReferenceError} thrown if the layer to be popped is the root-layer
     */
    pop(){
        const popLayer = this.top;
        if(popLayer.isRoot){
            throw new ReferenceError('can\'t pop root layer');
        }

        this.stack.pop();

        // reassure that the value in the layer above is right
        // (in case of non-object values)
        this.value[popLayer.name] = popLayer.value;
    }

    /**
     * pop all layers until the root-layer is reached
     */
    popAll(){
        while(!this.top.isRoot){
            this.pop();
        }
    }
}
