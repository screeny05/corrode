const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
});

it('pushes and pops', function(done){
    this.base
        .uint8('val_0')
        .push('child')
        .uint8('val_1')
        .push('child')
        .uint8('val_2')
        .pop()
        .uint8('val_3')
        .pop()
        .uint8('val_4');

    this.eqArray([0, 1, 2, 3, 4, 5], done, {
        val_0: 0,
        val_4: 4,
        child: {
            val_1: 1,
            val_3: 3,
            child: {
                val_2: 2,
            }
        }
    })
});

it('denies popping the root-layer', function(){
    this.base.pop();
    expect(this.eqArray.bind(this, [], () => {}, {})).to.throw(ReferenceError);
});

it('pushes back into old layers', function(done){
    this.base
        .uint8('val_0')
        .push('child')
        .uint8('val_1')
        .pop()
        .uint8('val_2')
        .push('child')
        .uint8('val_3')
        .pop()
        .uint8('val_4');

    this.eqArray([0, 1, 2, 3, 4], done, {
        val_0: 0,
        val_2: 2,
        val_4: 4,
        child: {
            val_1: 1,
            val_3: 3
        }
    });
});

it('automatically unpushes as it unwinds', function(done){
    this.base
        .uint8('var_0')
        .push('child')
        .uint8('var_1');

    this.eqArray([0, 1, 2], done, {
        var_0: 0,
        child: {
            var_1: 1
        }
    });
});

it('denies pushing into non-object vars', function(){
    this.base
        .uint8('var_0')
        .push('var_0')
        .uint8('var_1');

    expect(this.eqArray.bind(this, [0, 1, 2], () => {}, {})).to.throw(TypeError);
});
