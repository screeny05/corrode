const expect = require('chai').expect;
const fixture = require('./fixtures/vars');
const map = require('../src/map');

describe('Map', () => {
    beforeEach(function(){
        this.fixture = fixture.clone();

        this.map = function(fn, on, ...args){
            map[fn].call({ vars: this.fixture }, on, ...args);
            return this.fixture[on];
        };
    });

    /** @test {map} */
    it('maps via callback', function(){
        expect(this.map('callback', 'number', val => val * 2)).to.equal(fixture.number * 2);
    });

    /** @test {get} */
    it('maps via get - array', function(){
        expect(this.map('get', 'zero', ['fixture'])).to.equal('fixture');
        expect(this.map('get', 'one', [0, {}])).to.be.object;
        expect(this.map('get', 'two', [0, 0, {}])).to.be.empty;
    });

    /** @test {get} */
    it('maps via get - object', function(){
        expect(this.map('get', 'string', { fixture: 'string' })).to.equal('string');
        expect(this.map('get', 'string2', { fixture: {} })).to.be.object;
    });

    /** @test {findAll} */
    it('maps via findAll', function(){
        expect(this.map('findAll', 'one', fixture.objectArray, 'id')).to.deep.equal([fixture.objectArray[0]]);
        expect(this.map('findAll', 'two', fixture.objectArray, 'id')).to.have.length.of(2);
        expect(this.map('findAll', 'id', fixture.objectArray, 'id')[0].name).to.equal('quxbaz');
        expect(this.map.bind(this, 'findAll', 'three', fixture.objectArray, 'id')).to.throw(Error);
    });

    /** @test {find} */
    it('maps via find', function(){
        expect(this.map('find', 'one', fixture.objectArray, 'id')).to.deep.equal(fixture.objectArray[0]);
        expect(this.map('find', 'id', fixture.objectArray, 'id').name).to.equal('quxbaz');
        expect(this.map.bind(this, 'find', 'three', fixture.objectArray, 'id')).to.throw(Error);
    });

    /** @test {abs} */
    it('maps via abs', function(){
        expect(this.map('abs', 'negative')).to.equal(1);
        expect(this.map('abs', 'two')).to.equal(2);
    });

    /** @test {invert} */
    it('maps via invert', function(){
        expect(this.map('invert', 'negative')).to.equal(1);
        expect(this.map('invert', 'three')).to.equal(-3);
    });

    /** @test {trim} */
    it('maps via trim', function(){
        expect(this.map('trim', 'untrimmed')).to.equal(fixture.trimmed);
        expect(this.map('trim', 'trimmed')).to.equal(fixture.trimmed);
    });

    /** @test {push} */
    it('pushes', function(){
        let that = { vars: fixture.clone() };
        map.push.call(that, 'object');
        expect(that.vars).to.deep.equal(fixture.object);
    });

    /** @test {bitmask} */
    it('maps via bitmask', function(){
        expect(this.map('bitmask', 'bitmaskMatch', {
            isX80: 0x80,
            isX40: 0x40,
            isX20: 0x20,
            isX10: 0x10,
            isX08: 0x08,
            isX04: 0x04,
            isX02: 0x02,
            isX01: 0x01
        })).to.deep.equal({
            isX80: true,
            isX40: false,
            isX20: true,
            isX10: true,
            isX08: true,
            isX04: true,
            isX02: true,
            isX01: false
        });
    });

    /** @test {bitmask} */
    it('maps single values via bitmask', function(){
        expect(this.map('bitmask', 'bitmaskMatch', 0x80)).to.be.true;
    });
});
