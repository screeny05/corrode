const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
});

it('correctly aborts to short int16', function(done){
    this.base.int16('val');
    this.eqArray([1], done, {});
});

it('correctly aborts to short int32', function(done){
    this.base.int32('val');
    this.eqArray([1, 2, 3], done, {});
});

it('correctly aborts to short int64', function(done){
    this.base.int64('val');
    this.eqArray([1, 2, 3, 4, 5, 6, 7], done, {});
});

it('correctly aborts to short float', function(done){
    this.base.float('val');
    this.eqArray([1, 2, 3], done, {});
});

it('correctly aborts to short double', function(done){
    this.base.double('val');
    this.eqArray([1, 2, 3, 4, 5, 6, 7], done, {});
});

it('correctly aborts to short string', function(done){
    this.base.string('foo', 2);
    this.eqArray([1], done, {});
});

it('correctly aborts to short blob', function(done){
    this.base.blob('foo', 2);
    this.eqArray([1], done, {});
});
