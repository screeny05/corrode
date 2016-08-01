module.exports = class VariableStack {

    stack = [{ isRoot: true, value: {} }];

    get top(){
        return this.peekLayer(0);
    }

    get value(){
        return this.top.value;
    }

    set value(val){
        this.top.value = val;
    }

    peekLayer(layerCount = 1){
        if(layerCount > this.stack.length - 1){
            throw new ReferenceError(`can't retrieve layer ${layerCount}, stack is ${this.stack.length - 1} layers`);
        }
        return this.stack[this.stack.length - 1 - layerCount];
    }

    peek(layerCount = 1){
        return this.peekLayer(layerCount).value;
    }

    push(name, value = {}){
        if(typeof this.top.value[name] !== 'undefined'){
            value = this.value[name];
        } else {
            this.top.value[name] = value;
        }

        this.stack.push({
            isRoot: false,
            name,
            value
        });
    }

    pop(){
        let popLayer = this.top;
        if(popLayer.isRoot){
            throw new ReferenceError('can\'t pop root layer');
        }

        this.stack.pop();

        this.value[popLayer.name] = popLayer.value;
    }

    popAll(){
        while(!this.top.isRoot){
            this.pop();
        }
    }
};
