const expect = require('chai').expect;
const lodash = require('lodash');
const fixture = require('./fixtures/vars');
const map = require('../src/map');


beforeEach(function(){
    this.fixture = fixture.clone();

    this.map = function(fn, on, ...args){
        map[fn].call({ vars: this.fixture }, on, ...args);
        return this.fixture[on];
    };
});

it('should correctly map via callback', function(){
    expect(this.map('map', 'number', val => val * 2)).to.equal(fixture.number * 2);
});

it('should correctly map via get - array', function(){
    expect(this.map('get', 'zero', ['fixture'])).to.equal('fixture');
    expect(this.map('get', 'one', [0, {}])).to.be.object;
    expect(this.map('get', 'two', [0, 0, {}])).to.be.empty;
});

it('should correctly map via get - object', function(){
    expect(this.map('get', 'string', { fixture: 'string' })).to.equal('string');
    expect(this.map('get', 'string2', { fixture: {} })).to.be.object;
});
