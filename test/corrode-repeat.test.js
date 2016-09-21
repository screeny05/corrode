const { expect } = require('chai');
const Corrode = require('../src');

/** @test {Corrode#repeat} */
describe('Corrode#repeat', () => {
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

    it('shortcuts anonymous repeats', function(done){
        this.base.repeat(0, function(end, discard, i){
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2], done, {});
    });

    it('shortcuts named repeats', function(done){
        this.base.repeat('repeat', 0, function(end, discard, i){
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2], done, { repeat: [] });
    });

    // finishing & discarding
    it('repeats (no discard, finish after)', function(done){
        this.base.repeat('repeat', 5, function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 2){
                finish();
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            repeat: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('repeats (no discard, finish before)', function(done){
        this.base.repeat('repeat', 5, function(finish, discard, i){
            if(i >= 3){
                return finish();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            repeat: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('repeats (discard before, no finish)', function(done){
        this.base.repeat('repeat', 5, function(finish, discard, i){
            if(i % 2 !== 0){
                discard();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6], done, {
            repeat: [{
                var_0: 0
            }, {
                var_2: 2
            }, {
                var_4: 4
            }]
        });
    });

    it('repeat (discard after, no finish)', function(done){
        this.base
            .uint8('rootFix')
            .repeat('repeat', 5, function(finish, discard, i){
                this
                    .uint8('var_' + i)
                    .tap(function(){
                        if(this.vars['var_' + i] % 2 !== 0){
                            discard();
                        }
                    });
                this.varStack.peek().rootFix++;
                if(i % 3 === 0){
                    discard();
                }
            });

        this.eqArray([0, 0, 1, 2, 3, 4, 5, 6], done, {
            rootFix: 5,
            repeat: [{
                var_2: 2
            }, {
                var_4: 4
            }]
        });
    });

    it('repeats (discard, finish before)', function(done){
        this.base.repeat('repeat', 5, function(finish, discard, i){
            if(i >= 3){
                finish(true);
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            repeat: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('repeats (discard, finish after)', function(done){
        this.base.repeat('repeat', 5, function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 3){
                finish(true);
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            repeat: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('repeats replaced var', function(done){
        this.base.repeat('repeat', 5, function(){
            this
                .uint8('value')
                .tap(function(){
                    this.vars = this.vars.value;
                });
        });

        this.eqArray([0, 1, 2, 3, 4], done, {
            repeat: [0, 1, 2, 3, 4]
        });
    });
});
