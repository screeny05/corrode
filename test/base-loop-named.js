const expect = require('chai').expect;
const Base = require('../src/base');
const fs = require('fs');

beforeEach(function(){
    this.base = new Base();

    this.eqArray = (arr, obj) => {
        let arrMiddle = Math.floor(arr.length / 2);
        let arrFirst = arr.slice(0, arrMiddle);
        let arrSecond = arr.slice(arrMiddle);
        this.base.write(Buffer.from(arrFirst));
        this.base.end(Buffer.from(arrSecond));
        this.base.on('finish', () => {
            if(typeof obj === 'function'){
                return obj(this.base.vars);
            }
            expect(this.base.vars).to.deep.equal(obj);
        });
    };
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
