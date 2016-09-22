const { expect } = require('chai');
const Corrode = require('../src');

/** @test {Corrode} */
describe('Corrode - Helpers', () => {
    beforeEach(function(){
        this.base = new Corrode();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });

    /**
     * coverage fix
     * @test {Corrode#debug}
     */
    it('debugs', function(done){
        this.base
            .loop('array', function(end, discard, i){
                this
                    .uint8('values')
                    .map.push();
            })
            .debug();

        this.eqArray([3, 5, 7], done, {
            array: [3, 5, 7],
        });
    });

    /** @test {Corrode#fromBuffer} */
    it('converts from buffer', function(){
        this.base
            .loop('array', function(end, discard, i){
                this
                    .uint8('values')
                    .map.push();
            })
            .fromBuffer(Buffer.from([0, 1, 2, 3, 4, 5]), vars => {
                expect(vars).to.deep.equal({
                    array: [0, 1, 2, 3, 4, 5]
                });
            });
    });
});
