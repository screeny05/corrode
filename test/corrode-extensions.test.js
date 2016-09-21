const { expect } = require('chai');
const Corrode = require('../src');

/** @test {Corrode#ext} */
describe('Corrode#ext', () => {
    beforeEach(function(){
        this.base = new Corrode();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });


    Corrode.addExtension('simpleRepeat', function(arg1, arg2){
        this
            .loop('values', function(end, discard, i){
                if(i >= 3){
                    return end();
                }

                this
                    .uint8(arg1)
                    .uint8(arg2);
            })
            .map.push();
    });

    it('supports extensions', function(done){
        this.base.ext.simpleRepeat('extObj', 'val_1', 'val_2');

        this.eqArray([1, 2, 3, 4, 5, 6], done, {
            extObj: [{
                val_1: 1,
                val_2: 2
            }, {
                val_1: 3,
                val_2: 4
            }, {
                val_1: 5,
                val_2: 6
            }]
        });
    });


    Corrode.addExtension('simpleReturn', function(arg1, arg2){
        return this.varStack.peek()[arg1] + this.varStack.peek()[arg2];
    });

    it('supports extensions with return values and scope-access', function(done){
        this.base
            .uint8('val_1')
            .uint8('val_2')
            .ext.simpleReturn('extReturn', 'val_1', 'val_2');

        this.eqArray([2, 3, 4, 5, 6], done, {
            val_1: 2,
            val_2: 3,
            extReturn: 5
        });
    });


    Corrode.addExtension('mixReturnReadNonObject', function(){
        this.uint8('fix');
        return 4; // chosen by fair dice roll
    });

    it('supports extensions with return and read', function(){
        this.base
            .uint8('var_1')
            .ext.mixReturnReadNonObject('extObj');

        expect(this.eqArray.bind(this, [1, 2, 3], () => {}, {})).to.throw(TypeError);
    });


    Corrode.addExtension('mixReturnReadObject', function(){
        this.uint8('fix');
        return {
            objVal: 'foo'
        };
    });

    it('supports extensions with return and read', function(done){
        this.base
            .uint8('var_1')
            .ext.mixReturnReadObject('extObj');

        this.eqArray([1, 2, 3], done, {
            var_1: 1,
            extObj: {
                fix: 2,
                objVal: 'foo'
            }
        });
    });


    Corrode.addExtension('simpleRead', function(arg1, arg2){
        this
            .uint8(arg1)
            .uint8(arg2)
            .ext.simpleReturn('added', arg1, arg2);
    });

    Corrode.addExtension('callProxy', function(extName, ...args){
        this
            .ext[extName]('values', ...args)
            .map.push();
    });

    it('supports calling extensions within extensions', function(done){
        this.base
            .uint8('var_1')
            .ext.callProxy('proxyVal1', 'simpleRead', 'val_2', 'val_3')
            .ext.callProxy('proxyVal2', 'simpleRead', 'val_4', 'val_5');

        this.eqArray([1, 2, 3, 4, 5, 6], done, {
            var_1: 1,
            proxyVal1: {
                val_2: 2,
                val_3: 3,
                added: 5
            },
            proxyVal2: {
                val_4: 4,
                val_5: 5,
                added: 9
            }
        });
    });
});
