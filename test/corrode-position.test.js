const { expect } = require('chai');
const Corrode = require('../src');

/** @test {Corrode#position} */
describe('Corrode#position', () => {
    beforeEach(function(){
        this.base = new Corrode();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });

    it('jumps to absolute positions', function(done){
        this.base.isSeeking = true;

        this.base
            .uint8('var_1')
            .position(0)
            .uint8('var_2')
            .position(3)
            .uint8('var_3')
            .position('var_3')
            .uint8('var_4')

        this.eqArray([0, 1, 2, 5, 4, 3, 7], done, {
            var_1: 0,
            var_2: 0,
            var_3: 5,
            var_4: 3
        });
    });

    it('prevents jumps to invalid negative positions', function(){
        this.base.isSeeking = true;

        this.base.position(-1);

        expect(this.eqArray.bind(this, [0], () => {}, {})).to.throw(RangeError);
    });

    it('allows jumps to future positive positions', function(done){
        this.base.isSeeking = true;

        this.base
            .uint8('var_1')
            .position(10)
            .uint8('var_2');

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            var_1: 0
        });
    });
});
