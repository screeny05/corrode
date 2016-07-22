const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
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
        .blob('buffer', 'length');

    this.eqArray([2, 0x21, 0x22], done, {
        length: 2,
        buffer: Buffer.from([0x21, 0x22])
    });
});
