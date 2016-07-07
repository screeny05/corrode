const bind = function(fn){
    return function(name, src = name){
        this.vars[name] = fn(this.vars[src]);
    };
};

module.exports = {
    map(name, fn){
        this.vars[name] = fn(this.vars[name]);
    },

    get(name, array, src = name){
        this.vars[name] = array[this.vars[src]];
    },

    fromObjectArray(name, array, attr, src = name){
        const filtered = array.filter(item => item[attr] === this.vars[src]);
        if(filtered.length === 0){
            throw new Error(`cannot find object in array with ${attr} === ${src}(${this.vars[src]})`);
        }
        this.vars[name] = filtered[0];
    },

    abs: bind(Math.abs),
    invert: bind(val => val * -1),
    trim: bind(str => str.trim())
};
