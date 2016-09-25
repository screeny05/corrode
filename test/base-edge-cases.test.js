const { expect } = require('chai');
const Base = require('../src/base');

/** @test {CorrodeBase} */
describe('CorrodeBase - Edge Cases', () => {
    beforeEach(function(){
        this.base = new Base();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
        this.eqMultiArray = require('./helpers/asserts').eqMultiArray.bind(this);
    });

    /** @test {CorrodeBase#jobLoop} */
    it('correctly overrides primitves', function(done){
        this.base
            .uint8('var')
            .uint8('var');

        this.eqArray([1, 2, 3], done, {
            var: 2
        });
    });

    /** @test {CorrodeBase#string} */
    it('considers strings as length as references to vars - strings', function(done){
        this.base
            .uint8('length')
            .string('string', 'length');

        this.eqArray([2, 0x21, 0x22], done, {
            length: 2,
            string: '!"'
        });
    });

    /** @test {CorrodeBase#buffer} */
    it('considers strings as length as references to vars - buffers', function(done){
        this.base
            .uint8('length')
            .buffer('buffer', 'length');

        this.eqArray([2, 0x21, 0x22], done, {
            length: 2,
            buffer: Buffer.from([0x21, 0x22])
        });
    });

    /** @test {CorrodeBase#skip} */
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

    /** @test {CorrodeBase#string} */
    it('throws errors for invalid variables when using strings as length as references to vars - strings', function(){
        this.base
            .uint8('unknown')
            .string('string', 'length');

        expect(this.eqArray.bind(this, [2, 0x21, 0x22], () => {}, {})).to.throw(TypeError);
    });

    /** @test {CorrodeBase#buffer} */
    it('throws errors for invalid variables when using strings as length as references to vars - buffers', function(){
        this.base
            .uint8('unknown')
            .buffer('buffer', 'length');

        expect(this.eqArray.bind(this, [2, 0x21, 0x22], () => {}, {})).to.throw(TypeError);
    });

    /** @test {CorrodeBase#skip} */
    it('throws errors for invalid variables when using strings as length as references to vars - skip', function(){
        this.base
            .uint8('unknown')
            .skip('length')
            .uint8('var_1')

        expect(this.eqArray.bind(this, [2, 1, 2, 3, 4], () => {}, {})).to.throw(TypeError);
    });

    /**
     * @test {CorrodeBase#chunkOffset}
     * @test {CorrodeBase#streamOffset}
    */
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
});
