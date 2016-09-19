const { expect } = require('chai');
const Base = require('../src/base');

beforeEach(function(){
    this.base = new Base();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    this.eqMultiArray = require('./helpers/asserts').eqMultiArray.bind(this);
});

it('correctly finishes primitive jobs on EOF', function(done){
    this.base
        .uint8('var_1')
        .uint8('var_2')
        .uint8('var_3')
        .uint8('var_4')
        .uint8('var_5');

    this.eqArray([1, 2, 3], done, vars => {
        expect(vars).to.deep.equal({
            var_1: 1,
            var_2: 2,
            var_3: 3
        });
        expect(this.base.jobs).to.be.empty;
    });
});

it('correctly finishes tap jobs on EOF', function(done){
    this.base
        .uint8('var_1')
        .tap('struct', function(){
            this
                .uint8('var_2')
                .uint8('var_3')
                .uint8('var_4');
        });

    this.eqArray([1, 2, 3], done, vars => {
        expect(vars).to.deep.equal({
            var_1: 1,
            struct: {
                var_2: 2,
                var_3: 3
            }
        });
        expect(this.base.jobs).to.be.empty;
    });
});

it('correctly finishes loop jobs on EOF', function(done){
    this.base
        .uint8('var_1')
        .loop('loop', function(){
            this
                .uint8('var_2')
                .uint8('var_3');
        });

    this.eqArray([1, 2, 3, 4, 5, 6], done, vars => {
        expect(vars).to.deep.equal({
            var_1: 1,
            loop: [{
                var_2: 2,
                var_3: 3
            }, {
                var_2: 4,
                var_3: 5
            }, {
                var_2: 6
            }]
        });
        expect(this.base.jobs).to.be.empty;
    });
});

it('correctly finishes nested jobs on EOF', function(done){
    this.base
        .uint8('var_1')
        .loop('loop', function(){
            this
                .uint8('var_2')
                .uint8('var_3')
                .tap('innerStruct', function(){
                    this
                        .uint8('var_4')
                        .loop('innerLoop', function(finish, discard, i){
                            this
                                .uint8('var_5')
                                .uint8('var_6');

                            if(i >= 1){
                                finish();
                            }
                        });
                });
        });

    this.eqArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], done, {
        var_1: 1,
        loop: [{
            var_2: 2,
            var_3: 3,
            innerStruct: {
                var_4: 4,
                innerLoop: [{
                    var_5: 5,
                    var_6: 6
                }, {
                    var_5: 7,
                    var_6: 8
                }]
            }
        }, {
            var_2: 9,
            var_3: 10,
            innerStruct: {
                var_4: 11,
                innerLoop: [{
                    var_5: 12,
                    var_6: 13
                }, {
                    var_5: 14
                }]
            }
        }]
    });
});

it('correctly rests in the current state when finishJobsOnEOF is false - tap', function(done){
    this.base = new Base({ finishJobsOnEOF: false });

    this.base
        .uint8('var_1')
        .tap('struct', function(){
            this
                .uint8('var_2')
                .uint8('var_3')
                .uint8('var_4');
        });

    this.eqArray([1, 2, 3], done, () => {
        expect(this.base.varStack.top.isRoot).to.not.be.true;
        expect(this.base.varStack.stack.length).to.be.greaterThan(1);
        expect(this.base.jobs).to.not.be.empty;
    });
});

it('correctly rests in the current state when finishJobsOnEOF is false - loop', function(done){
    this.base = new Base({ finishJobsOnEOF: false });

    this.base
        .uint8('var_1')
        .loop('loop', function(){
            this
                .uint8('var_2')
                .uint8('var_3')
                .uint8('var_4');
        });

    this.eqArray([1, 2, 3], done, () => {
        expect(this.base.varStack.peek()[this.base.options.loopVarName]).to.exist;
        expect(this.base.varStack.top.isRoot).to.not.be.true;
        expect(this.base.varStack.stack.length).to.be.greaterThan(1);
        expect(this.base.jobs).to.not.be.empty;
    });
});

it('should not be disturbed, when changing the loopVarName', function(done){
    this.base = new Base({ loopVarName: '__loop' });

    this.base.loop('loop', function(){
        this.uint8('var');
    });

    this.eqArray([1, 2, 3], done, {
        loop: [{
            var: 1
        }, {
            var: 2
        }, {
            var: 3
        }]
    });
});

it('flushes when isSeeking = false', function(done){
    this.base.loop('loop', function(){
        this.uint8('var');
    });

    this.eqMultiArray([[1], [2], [3], [4, 5], [6], [7], [8, 9], [0]], done, () => {
        expect(this.base.streamBuffer.length).to.equal(0);
    });
});

it('prevents flushes when isSeeking = true', function(done){
    this.base.isSeeking = true;

    this.base.loop('loop', function(){
        this.uint8('var');
    });

    this.eqMultiArray([[1], [2], [3], [4, 5], [6], [7], [8, 9], [0]], done, () => {
        expect(this.base.streamBuffer.length).to.equal(10);
    });
});

it('allows mixing of isSeeking-modes', function(done){
    this.base.loop('loop', function(end, discard, i){
        this.uint8('var');

        if(i >= 8){
            this.isSeeking = true;
        }
    });

    this.eqMultiArray([[1], [2], [3], [4], [5], [6], [7], [8], [9], [0]], done, () => {
        expect(this.base.streamBuffer.length).to.equal(2);
    });
});
