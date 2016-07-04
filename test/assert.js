const expect = require('chai').expect;
const assert = require('../src/assert');
const utils = require('../src/utils');

beforeEach(function(){
    this.fixture = {
        string: 'fixture',
        number: 1337,
        object: {
            has: 'to',
            deep: ['equal', 'this', 1337],
            me: 1337
        },
        objectWithSameValues: {
            val1: 'fixture',
            val2: 'fixture',
            val3: 'fixture',
            val4: 'fixture',
        },
        array: ['fixture', 'string', 1337],
        negative: -1,
        zero: 0,
        one: 1,
        two: 2,
        three: 3
    };

    this.assert = function(name, ...args){
        let assertFn = utils.bindObject(assert, { vars: this.fixture });
        return assertFn[name].bind(assertFn, ...args);
    };
});

it('should correctly assert equal', function(){
    expect(this.assert('equal', 'string', 'fixture')).to.not.throw(Error);
    expect(this.assert('equal', 'string', 'wrong')).to.throw(Error);
    expect(this.assert('equal', 'number', 1337)).to.not.throw(Error);
    expect(this.assert('equal', 'number', 0)).to.throw(Error);
});

it('should correctly assert allEqual', function(){
    expect(this.assert('allEqualObject', 'objectWithSameValues', 'fixture')).to.not.throw(Error);
    expect(this.assert('allEqualObject', 'objectWithSameValues', 'wrong')).to.throw(Error);
    expect(this.assert('allEqualObject', 'object', 'wrong')).to.throw(Error);
});

it('should correctly assert deepEqual', function(){
    expect(this.assert('deepEqualObject', 'objectWithSameValues', this.fixture.objectWithSameValues)).to.not.throw(Error);
    expect(this.assert('deepEqualObject', 'objectWithSameValues', this.fixture.object)).to.throw(Error);
    expect(this.assert('deepEqualObject', 'object', this.fixture.object)).to.not.throw(Error);
    expect(this.assert('deepEqualObject', 'object', this.fixture.objectWithSameValues)).to.throw(Error);
});

it('should correctly assert inArray for arrays', function(){
    expect(this.assert('inArray', 'string', ['fixture'])).to.not.throw(Error);
    expect(this.assert('inArray', 'string', ['wrong'])).to.throw(Error);
});

it('should correctly assert inArray for objects', function(){
    expect(this.assert('inArray', 'string', { child: 'fixture' })).to.not.throw(Error);
    expect(this.assert('inArray', 'string', { child: 'wrong' })).to.throw(Error);
});

it('should correctly assert inArrayBounds', function(){
    expect(this.assert('inArrayBounds', 'negative', this.fixture.array)).to.throw(Error);
    expect(this.assert('inArrayBounds', 'zero', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inArrayBounds', 'one', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inArrayBounds', 'two', this.fixture.array)).to.not.throw(Error);
    expect(this.assert('inArrayBounds', 'three', this.fixture.array)).to.throw(Error);
});

it('should correctly assert via callback', function(){
    expect(this.assert('callback', 'string', val => true)).to.not.throw(Error);
    expect(this.assert('callback', 'string', val => false)).to.throw(Error);
    expect(this.assert('callback', 'string', val => true, 'custom')).to.not.throw(Error);
    expect(this.assert('callback', 'string', val => false, 'custom')).to.throw(Error);
});

it('should correctly assert arrayLength', function(){
    expect(this.assert('arrayLength', 'array', 3)).to.not.throw(Error);
    expect(this.assert('arrayLength', 'array', -1)).to.throw(Error);
    expect(this.assert('arrayLength', 'array', 2)).to.throw(Error);
    expect(this.assert('arrayLength', 'array', 4)).to.throw(Error);
});

it('should correctly assert exists', function(){
    expect(this.assert('exists', 'array')).to.not.throw(Error);
    expect(this.assert('exists', 'string')).to.not.throw(Error);
    expect(this.assert('exists', 'number')).to.not.throw(Error);
    expect(this.assert('exists', 'wrong')).to.throw(Error);
    expect(this.assert('exists', -1)).to.throw(Error);
});
