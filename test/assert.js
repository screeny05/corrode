const expect = require('chai').expect;
const fixture = require('./fixtures/vars');
const assert = require('../src/assert');
const utils = require('../src/utils');

beforeEach(function(){
    this.fixture = fixture.clone();

    this.assert = function(name, ...args){
        let assertFn = utils.bindObject(assert, { vars: this.fixture });
        return assertFn[name].bind(assertFn, ...args);
    };
});

it('asserts equal', function(){
    expect(this.assert('equal', 'string', 'fixture')).to.not.throw(TypeError);
    expect(this.assert('equal', 'string', 'wrong')).to.throw(TypeError);
    expect(this.assert('equal', 'number', 1337)).to.not.throw(TypeError);
    expect(this.assert('equal', 'number', 0)).to.throw(TypeError);
});

it('asserts allEqual for objects', function(){
    expect(this.assert('allEqual', 'objectWithSameValues', 'fixture')).to.not.throw(TypeError);
    expect(this.assert('allEqual', 'objectWithSameValues', 'wrong')).to.throw(TypeError);
    expect(this.assert('allEqual', 'objectWithSameValues')).to.not.throw(TypeError);
    expect(this.assert('allEqual', 'object', 'wrong')).to.throw(TypeError);
    expect(this.assert('allEqual', 'object')).to.throw(TypeError);
});

it('asserts allEqual for arrays', function(){
    expect(this.assert('allEqual', 'arrayWithSameValues', 'fixture')).to.not.throw(TypeError);
    expect(this.assert('allEqual', 'arrayWithSameValues', 'wrong')).to.throw(TypeError);
    expect(this.assert('allEqual', 'arrayWithSameValues')).to.not.throw(TypeError);
    expect(this.assert('allEqual', 'array', 'wrong')).to.throw(TypeError);
    expect(this.assert('allEqual', 'array')).to.throw(TypeError);
});

it('asserts deepEqual', function(){
    expect(this.assert('deepEqual', 'objectWithSameValues', this.fixture.objectWithSameValues)).to.not.throw(TypeError);
    expect(this.assert('deepEqual', 'objectWithSameValues', this.fixture.object)).to.throw(TypeError);
    expect(this.assert('deepEqual', 'object', this.fixture.object)).to.not.throw(TypeError);
    expect(this.assert('deepEqual', 'object', this.fixture.objectWithSameValues)).to.throw(TypeError);
});

it('asserts includes for arrays', function(){
    expect(this.assert('includes', 'string', ['fixture'])).to.not.throw(TypeError);
    expect(this.assert('includes', 'string', ['wrong'])).to.throw(TypeError);
});

it('asserts includes for objects', function(){
    expect(this.assert('includes', 'string', { child: 'fixture' })).to.not.throw(TypeError);
    expect(this.assert('includes', 'string', { child: 'wrong' })).to.throw(TypeError);
});

it('asserts inBounds', function(){
    expect(this.assert('inBounds', 'negative', this.fixture.array)).to.throw(TypeError);
    expect(this.assert('inBounds', 'zero', this.fixture.array)).to.not.throw(TypeError);
    expect(this.assert('inBounds', 'one', this.fixture.array)).to.not.throw(TypeError);
    expect(this.assert('inBounds', 'two', this.fixture.array)).to.not.throw(TypeError);
    expect(this.assert('inBounds', 'three', this.fixture.array)).to.throw(TypeError);
});

it('asserts via callback', function(){
    expect(this.assert('callback', 'string', val => true)).to.not.throw(TypeError);
    expect(this.assert('callback', 'string', val => false)).to.throw(TypeError);
    expect(this.assert('callback', 'string', val => true, 'custom')).to.not.throw(TypeError);
    expect(this.assert('callback', 'string', val => false, 'custom')).to.throw(TypeError);
});

it('asserts arrayLength', function(){
    expect(this.assert('arrayLength', 'array', 3)).to.not.throw(TypeError);
    expect(this.assert('arrayLength', 'array', -1)).to.throw(TypeError);
    expect(this.assert('arrayLength', 'array', 2)).to.throw(TypeError);
    expect(this.assert('arrayLength', 'array', 4)).to.throw(TypeError);
});

it('asserts exists', function(){
    expect(this.assert('exists', 'array')).to.not.throw(TypeError);
    expect(this.assert('exists', 'string')).to.not.throw(TypeError);
    expect(this.assert('exists', 'number')).to.not.throw(TypeError);
    expect(this.assert('exists', 'wrong')).to.throw(TypeError);
    expect(this.assert('exists', -1)).to.throw(TypeError);
});

it('asserts bitmask', function(){
    expect(this.assert('bitmask', 'bitmask1', this.fixture.bitmask1)).to.not.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask1', this.fixture.bitmask2)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask2', this.fixture.bitmask1)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask2', this.fixture.bitmask2)).to.not.throw(TypeError);
    expect(this.assert('bitmask', 'bitmaskMatch', this.fixture.bitmask1)).to.not.throw(TypeError);
    expect(this.assert('bitmask', 'bitmaskMatch', this.fixture.bitmask2)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask1', this.fixture.bitmask1, false)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask1', this.fixture.bitmask2, false)).to.not.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask2', this.fixture.bitmask1, false)).to.not.throw(TypeError);
    expect(this.assert('bitmask', 'bitmask2', this.fixture.bitmask2, false)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmaskMatch', this.fixture.bitmask1, false)).to.throw(TypeError);
    expect(this.assert('bitmask', 'bitmaskMatch', this.fixture.bitmask2, false)).to.not.throw(TypeError);
});
