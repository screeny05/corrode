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
    expect(this.assert('equal', 'string', 'fixture')).to.not.throw(Error);
    expect(this.assert('equal', 'string', 'wrong')).to.throw(Error);
    expect(this.assert('equal', 'number', 1337)).to.not.throw(Error);
    expect(this.assert('equal', 'number', 0)).to.throw(Error);
});

it('asserts allEqual for objects', function(){
    expect(this.assert('allEqual', 'objectWithSameValues', 'fixture')).to.not.throw(Error);
    expect(this.assert('allEqual', 'objectWithSameValues', 'wrong')).to.throw(Error);
    expect(this.assert('allEqual', 'objectWithSameValues')).to.not.throw(Error);
    expect(this.assert('allEqual', 'object', 'wrong')).to.throw(Error);
    expect(this.assert('allEqual', 'object')).to.throw(Error);
});

it('asserts allEqual for arrays', function(){
    expect(this.assert('allEqual', 'arrayWithSameValues', 'fixture')).to.not.throw(Error);
    expect(this.assert('allEqual', 'arrayWithSameValues', 'wrong')).to.throw(Error);
    expect(this.assert('allEqual', 'arrayWithSameValues')).to.not.throw(Error);
    expect(this.assert('allEqual', 'array', 'wrong')).to.throw(Error);
    expect(this.assert('allEqual', 'array')).to.throw(Error);
});

it('asserts deepEqual', function(){
    expect(this.assert('deepEqual', 'objectWithSameValues', this.fixture.objectWithSameValues)).to.not.throw(Error);
    expect(this.assert('deepEqual', 'objectWithSameValues', this.fixture.object)).to.throw(Error);
    expect(this.assert('deepEqual', 'object', this.fixture.object)).to.not.throw(Error);
    expect(this.assert('deepEqual', 'object', this.fixture.objectWithSameValues)).to.throw(Error);
});

it('asserts includes for arrays', function(){
    expect(this.assert('includes', 'string', ['fixture'])).to.not.throw(Error);
    expect(this.assert('includes', 'string', ['wrong'])).to.throw(Error);
});

it('asserts includes for objects', function(){
    expect(this.assert('includes', 'string', { child: 'fixture' })).to.not.throw(Error);
    expect(this.assert('includes', 'string', { child: 'wrong' })).to.throw(Error);
});

it('asserts inBounds', function(){
    expect(this.assert('inBounds', 'negative', this.fixture.array)).to.throw(Error);
    expect(this.assert('inBounds', 'zero', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inBounds', 'one', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inBounds', 'two', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inBounds', 'three', this.fixture.array)).to.throw(Error);
});

it('asserts via callback', function(){
    expect(this.assert('callback', 'string', val => true)).to.not.throw(Error);
    expect(this.assert('callback', 'string', val => false)).to.throw(Error);
    expect(this.assert('callback', 'string', val => true, 'custom')).to.not.throw(Error);
    expect(this.assert('callback', 'string', val => false, 'custom')).to.throw(Error);
});

it('asserts arrayLength', function(){
    expect(this.assert('arrayLength', 'array', 3)).to.not.throw(Error);
    expect(this.assert('arrayLength', 'array', -1)).to.throw(Error);
    expect(this.assert('arrayLength', 'array', 2)).to.throw(Error);
    expect(this.assert('arrayLength', 'array', 4)).to.throw(Error);
});

it('asserts exists', function(){
    expect(this.assert('exists', 'array')).to.not.throw(Error);
    expect(this.assert('exists', 'string')).to.not.throw(Error);
    expect(this.assert('exists', 'number')).to.not.throw(Error);
    expect(this.assert('exists', 'wrong')).to.throw(Error);
    expect(this.assert('exists', -1)).to.throw(Error);
});
