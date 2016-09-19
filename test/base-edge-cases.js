const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    this.eqMultiArray = require('./helpers/asserts').eqMultiArray.bind(this);
});

it('correctly overrides primitves', function(done){
    this.base
        .uint8('var')
        .uint8('var');

    this.eqArray([1, 2, 3], done, {
        var: 2
    });
});

it('considers strings as length as references to vars - strings', function(done){
    this.base
        .uint8('length')
        .string('string', 'length');

    this.eqArray([2, 0x21, 0x22], done, {
        length: 2,
        string: '!"'
    });
});

it('considers strings as length as references to vars - buffers', function(done){
    this.base
        .uint8('length')
        .buffer('buffer', 'length');

    this.eqArray([2, 0x21, 0x22], done, {
        length: 2,
        buffer: Buffer.from([0x21, 0x22])
    });
});

it('considers strings as length as references to vars - skip', function(done){
    this.base
        .uint8('length')
        .skip('length')
        .uint8('var_1')

    this.eqArray([2, 1, 2, 3, 4], done, {
        length: 2,
        var_1: 3
    });
});

it('has the correct offset', function(done){
    this.base
        .uint8('var_1')
        .tap(function(){
            expect(this.chunkOffset).to.equal(1);
            expect(this.streamOffset).to.equal(1);
        })
        .uint8('var_2')
        .uint8('var_3')
        .tap(function(){
            expect(this.chunkOffset).to.equal(1);
            expect(this.streamOffset).to.equal(3);
        });

    this.eqMultiArray([[1, 2], [3], [4]], done, {
        var_1: 1,
        var_2: 2,
        var_3: 3
    });
});
