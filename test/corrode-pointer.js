const { expect } = require('chai');
const Corrode = require('../src');

beforeEach(function(){
    this.base = new Corrode();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
});

it('retrieves from array', function(done){
    this.base
        .loop('array', function(end, discard, i){
            if(i >= 3){
                return end();
            }
            this
                .uint8('values')
                .map.push();
        })
        .pointer('alphabet', ['a', 'b', 'c'], 'uint8')
        .pointer('numeric', 'array', 'uint8');

    this.eqArray([3, 5, 7, 1, 2], done, {
        array: [3, 5, 7],
        alphabet: 'b',
        numeric: 7
    });
});

it('retrieves from object', function(done){
    this.base
        .tap('obj', function(){
            this.loop(function(end, discard, i){
                if(i >= 3){
                    return end();
                }
                this.uint8(i);
            });
        })
        .pointer('alphabet', { 0: 'a', 1: 'b', 2: 'c' }, 'uint8')
        .pointer('numeric', 'obj', 'uint8');

    this.eqArray([3, 5, 7, 1, 2], done, {
        obj: { 0: 3, 1: 5, 2: 7},
        alphabet: 'b',
        numeric: 7
    });
});

// why not?
it('retrieves from string', function(done){
    this.base
        .terminatedString('string')
        .pointer('numeric', 'string', 'uint8');

    this.eqArray([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0, 4], done, {
        string: 'hello',
        numeric: 'o'
    });
});
