const { expect } = require('chai');
const Corrode = require('../src');

beforeEach(function(){
    this.base = new Corrode();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    this.eqMultiArray = require('./helpers/asserts').eqMultiArray.bind(this);
});

it('retrieves a terminated buffer', function(done){
    this.base
        .terminatedBuffer('buffer_1')
        .terminatedBuffer('buffer_2');

    this.eqArray([3, 5, 7, 0, 9, 1, 2, 4, 0, 6, 8], done, {
        buffer_1: Buffer.from([3, 5, 7]),
        buffer_2: Buffer.from([9, 1, 2, 4])
    });
});

it('retrieves a terminated buffer spanned over multiple buffers', function(done){
    this.base
        .terminatedBuffer('buffer_1')
        .terminatedBuffer('buffer_2');

    this.eqMultiArray([[2, 4, 6], [8], [0], [1, 3], [5, 7], [0, 0]], done, {
        buffer_1: Buffer.from([2, 4, 6, 8]),
        buffer_2: Buffer.from([1, 3, 5, 7])
    });
});

it('retrieves a terminated buffer spanned over multiple buffers with options', function(done){
    this.base
        .terminatedBuffer('buffer_1', 8, false)
        .terminatedBuffer('buffer_2', 3)
        .uint8('terminator')
        .terminatedBuffer('buffer_3', 'terminator');

    this.eqMultiArray([[2, 4, 6], [8], [0], [1, 3], [5, 7], [0, 0, 2, 5]], done, {
        buffer_1: Buffer.from([2, 4, 6, 8]),
        buffer_2: Buffer.from([0, 1]),
        terminator: 5,
        buffer_3: Buffer.from([7, 0, 0, 2])
    });
});

it('retrieves a terminated buffer in a complex parser', function(done){
    this.base
        .uint8('terminator_1')
        .loop('buffers', function(end, discard, i){
            if(i >= 3){
                return end();
            }

            this
                .uint8('prefix')
                .terminatedBuffer('buffer', this.varStack.peek().terminator_1)
        })
        .terminatedBuffer('buffer_1', 'terminator_1')
        .terminatedBuffer('buffer_2', 3);

    this.eqMultiArray([[2, 7, 4, 6], [8, 2], [7, 0], [1, 2, 7, 3], [5, 7, 2], [0, 0, 2, 5, 6, 3]], done, {
        terminator_1: 2,
        buffers: [{
            prefix: 7,
            buffer: Buffer.from([4, 6, 8])
        }, {
            prefix: 7,
            buffer: Buffer.from([0, 1])
        }, {
            prefix: 7,
            buffer: Buffer.from([3, 5, 7])
        }],
        buffer_1: Buffer.from([0, 0]),
        buffer_2: Buffer.from([5, 6])
    });
});
