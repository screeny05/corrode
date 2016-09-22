const expect = require('chai').expect;
const utils = require('../src/utils');

describe('Utils', () => {
    beforeEach(function(){
        this.context = {
            fixture: 'fixture'
        };
    });

    /** @test {tapBindObject} */
    it('binds object with tap', function(){
        let boundFixture = utils.tapBindObject({
            fnFixture: function(argOne, argTwo){
                expect(argOne).to.equal('foo');
                expect(argTwo).to.equal('bar');
            }
        }, {
            tap: function(fn){
                return fn;
            },
            ...this.context
        });

        boundFixture.fnFixture('foo', 'bar')();
    });

    /** @test {bindObject} */
    it('binds object with data', function(){
        let obj = {
            fnFixture: function(){
                expect(this).to.not.be.empty;
                expect(this.fixture).to.equal('fixture');
            },
            fnEmpty: function(){
                expect(this).to.be.empty;
            }
        };

        let boundFixture = utils.bindObject(obj, this.context);
        boundFixture.fnFixture();

        let boundObj = utils.bindObject(obj, {});
        boundObj.fnEmpty();
    });
});
