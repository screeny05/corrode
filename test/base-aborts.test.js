const { expect } = require('chai');
const Base = require('../src/base');

/** @test {CorrodeBase} */
describe('CorrodeBase - Aborts', () => {
    beforeEach(function(){
        this.base = new Base();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });

    it('correctly aborts too short int16', function(done){
        this.base.int16('val');
        this.eqArray([1], done, {});
    });

    it('correctly aborts too short int32', function(done){
        this.base.int32('val');
        this.eqArray([1, 2, 3], done, {});
    });

    it('correctly aborts too short int64', function(done){
        this.base.int64('val');
        this.eqArray([1, 2, 3, 4, 5, 6, 7], done, {});
    });

    it('correctly aborts too short float', function(done){
        this.base.float('val');
        this.eqArray([1, 2, 3], done, {});
    });

    it('correctly aborts too short double', function(done){
        this.base.double('val');
        this.eqArray([1, 2, 3, 4, 5, 6, 7], done, {});
    });

    it('correctly aborts too short string', function(done){
        this.base.string('foo', 2);
        this.eqArray([1], done, {});
    });

    it('correctly aborts too short buffer', function(done){
        this.base.buffer('foo', 2);
        this.eqArray([1], done, {});
    });

    it('correctly aborts too short skip', function(done){
        this.base
            .uint8('var_1')
            .skip(10)
            .uint8('var_2');

        this.eqArray([2, 0], done, {
            var_1: 2
        });
    });
});
