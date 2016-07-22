const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
});


it('named loop', function(){
    this.base.loop('fix', function(){
        this.uint8('var');
    });

    this.eqArray([0, 1, 2], {
        fix: [{
            var: 0
        }, {
            var: 1
        }, {
            var: 2
        }]
    });
});

it('named loop (scope)', function(){
    this.base
        .uint8('rootFix')
        .loop('fix', function(){
            if(typeof this.vars.fix === 'undefined'){
                this.vars.fix = -1;
            }
            this.vars.fix++;
            this.varStack.peekLayer().rootFix++;
            this.uint8('var');
        });

    this.eqArray([0, 0, 1, 2], {
        rootFix: 3,
        fix: [{
            fix: 0,
            var: 0
        }, {
            fix: 0,
            var: 1
        }, {
            fix: 0,
            var: 2
        }]
    });
});

it('named loop ', function(){

});
