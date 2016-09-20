const bind = function(fn){
    return function(name, src = name){
        this.vars[name] = fn(this.vars[src]);
    };
};

export function map(name, fn){
    this.vars[name] = fn(this.vars[name]);
};

export function get(name, array, src = name){
    this.vars[name] = array[this.vars[src]];
};

export function findAll(name, array, attr, src = name){
    const filtered = array.filter(item => item[attr] === this.vars[src]);
    if(filtered.length === 0){
        throw new Error(`cannot find object in array with ${attr} === ${src}(${this.vars[src]})`);
    }
    this.vars[name] = filtered;
};

export function find(name, array, attr, src = name){
    findAll.call(this, name, array, attr, src);
    this.vars[name] = this.vars[name][0];
};

export function push(name = 'values'){
    this.vars = this.vars[name];
};

export const abs = bind(Math.abs);
export const invert = bind(val => val * -1);
export const trim = bind(str => str.trim());
