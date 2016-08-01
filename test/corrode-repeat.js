const { expect } = require('chai');
const Corrode = require('../src');

beforeEach(function(){
    this.base = new Corrode();
    this.eqArray = require('./helpers/asserts').eqArray.bind(this);
});

it('repeats anonymously', function(done){
    this.base.repeat(5, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], done, {
        var_0: 0,
        var_1: 1,
        var_2: 2,
        var_3: 3,
        var_4: 4
    });
});

it('repeats named', function(done){
    this.base.repeat('repeat', 5, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], done, {
        repeat: [{
            var_0: 0
        }, {
            var_1: 1
        }, {
            var_2: 2
        }, {
            var_3: 3
        }, {
            var_4: 4
        }]
    });
});

it('repeats anonymously as long as possible', function(done){
    this.base.repeat(10, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2, 3, 4], done, {
        var_0: 0,
        var_1: 1,
        var_2: 2,
        var_3: 3,
        var_4: 4
    });
});

it('repeats named as long as possible', function(done){
    this.base.repeat('repeat', 10, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2, 3, 4], done, {
        repeat: [{
            var_0: 0
        }, {
            var_1: 1
        }, {
            var_2: 2
        }, {
            var_3: 3
        }, {
            var_4: 4
        }]
    });
});

it('repeats anonymously with the right scope', function(done){
    this.base.repeat(5, function(){
        if(typeof this.vars.iterations === 'undefined'){
            this.vars.iterations = 0;
        }
        this.vars.iterations++;

        this.uint8('var');
    });

    this.eqArray([0, 1, 2, 3, 4, 5, 6], done, {
        var: 4,
        iterations: 5
    });
});

it('repeats named with the right scope', function(done){
    this.base
        .uint8('rootFix')
        .repeat('repeat', 5, function(){
            if(typeof this.vars.fix === 'undefined'){
                this.vars.fix = -1;
            }
            this.vars.fix++;
            this.varStack.peek().rootFix++;
            this.uint8('var');
        });

    this.eqArray([0, 0, 1, 2, 3, 4, 5, 6], done, {
        rootFix: 5,
        repeat: [{
            fix: 0,
            var: 0
        }, {
            fix: 0,
            var: 1
        }, {
            fix: 0,
            var: 2
        }, {
            fix: 0,
            var: 3
        }, {
            fix: 0,
            var: 4
        }]
    });
});

it('repeats anonymously with a string as length', function(done){
    this.base
        .uint8('iterations')
        .repeat('iterations', function(end, discard, i){
            this.uint8('var_' + i);
        });

    this.eqArray([4, 0, 1, 2, 3, 4, 5, 6], done, {
        iterations: 4,
        var_0: 0,
        var_1: 1,
        var_2: 2,
        var_3: 3
    });
});


it('repeats named with a string as length', function(done){
    this.base
        .uint8('iterations')
        .repeat('repeat', 'iterations', function(){
            this.uint8('var');
        });

    this.eqArray([4, 0, 1, 2, 3, 4, 5, 6], done, {
        iterations: 4,
        repeat: [{
            var: 0
        }, {
            var: 1
        }, {
            var: 2
        }, {
            var: 3
        }]
    });
});

it('shortcuts anonymously loops', function(done){
    this.base.repeat(0, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2], done, {});
});

it('shortcuts named loops', function(done){
    this.base.repeat('repeat', 0, function(end, discard, i){
        this.uint8('var_' + i);
    });

    this.eqArray([0, 1, 2], done, { repeat: [] });
});
