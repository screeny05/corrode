const { expect } = require('chai');
const Corrode = require('../src');

beforeEach(function(){
    this.base = new Corrode();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    this.eqMultiArray = require('./helpers/asserts').eqMultiArray.bind(this);
});

it('retrieves a terminated string', function(done){
    this.base
        .terminatedString('string_1')
        .terminatedString('string_2')
        .terminatedString('string_3');

    this.eqArray([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x00, 0x6f, 0x6f], done, {
        string_1: 'hello',
        string_2: ', world',
        string_3: ''
    });
});

it('retrieves a terminated string spanned over multiple buffers', function(done){
    this.base
        .terminatedString('string_1')
        .terminatedString('string_2')
        .terminatedString('string_3');

    this.eqMultiArray([[0x68, 0x65], [0x6c], [0x6c, 0x6f, 0x00], [0x2c], [0x20, 0x77], [0x6f, 0x72], [0x6c], [0x64], [0x00, 0x6f, 0x6f]], done, {
        string_1: 'hello',
        string_2: ', world',
        string_3: ''
    });
});

it('retrieves a terminated string with options', function(done){
    this.base
        .terminatedString('string_1', 0x2c)
        .terminatedString('string_2', 0x64, false)
        .terminatedString('string_3');

    this.eqMultiArray([[0x68, 0x65], [0x6c], [0x6c, 0x6f], [0x2c], [0x20, 0xe2, 0x9a, 0xa1, 0x20, 0x77], [0x6f, 0x72], [0x6c], [0x64], [0x00, 0x6f, 0x6f]], done, {
        string_1: 'hello',
        string_2: ' ⚡ world',
        string_3: ''
    });
});

it('accepts custom encoding', function(done){
    this.base.terminatedString('string', 0, true, 'ascii');

    this.eqArray([0xe2, 0x9a, 0xa1, 0x00], done, {
        string: 'b\u001a!'
    });
});
