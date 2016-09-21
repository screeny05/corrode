const { expect } = require('chai');
const Base = require('../src/base');

/** @test {CorrodeBase#tap} */
describe('CorrodeBase#tap', () => {
    beforeEach(function(){
        this.base = new Base();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });

    it('taps into the current state', function(done){
        this.base
            .uint8('var_1')
            .tap(function(){
                expect(this.vars.var_1).to.equal(1);
            });

        this.eqArray([1, 2, 3], done, {
            var_1: 1
        });
    });

    it('taps into a named var', function(done){
        this.base
            .uint8('var_1')
            .tap('struct', function(){
                this
                    .uint8('var_2')
                    .uint8('var_3');
            });

        this.eqArray([1, 2, 3], done, {
            var_1: 1,
            struct: {
                var_2: 2,
                var_3: 3
            }
        });
    });

    it('re-taps into existing objects', function(done){
        this.base
            .uint8('var_1')
            .tap('structure', function(){
                this
                    .uint8('var_2')
                    .uint8('var_3')
            })
            .uint8('var_4')
            .tap('structure', function(){
                this
                    .uint8('var_5')
                    .uint8('var_6');
            });

        this.eqArray([1, 2, 3, 4, 5, 6], done, {
            var_1: 1,
            var_4: 4,
            structure: {
                var_2: 2,
                var_3: 3,
                var_5: 5,
                var_6: 6
            }
        });
    });

    it('does not allow tapping into other objects', function(){
        this.base
            .uint8('var_1')
            .tap('var_1', function(){
                this.uint8('var_2');
            })
            .uint8('var_3');

        expect(this.eqArray.bind(this, [1, 2, 3], () => {}, {})).to.throw(TypeError);
    });

    it('allows tapping into other objects when strictObjectMode is false', function(done){
        this.base = new Base({ strictObjectMode: false });

        this.base
            .uint8('var_1')
            .tap('var_1', function(){
                expect(this.vars).to.be.a.number;
            });

        this.eqArray([1, 2, 3], done, {
            var_1: 1
        });
    });
});
