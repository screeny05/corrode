const { expect } = require('chai');
const Base = require('../src/base');

/** @test {CorrodeBase#loop} */
describe('CorrodeBase#loop - named', () => {
    beforeEach(function(){
        this.base = new Base();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });


    it('named loop', function(done){
        this.base.loop('fix', function(){
            this.uint8('var');
        });

        this.eqArray([0, 1, 2], done, {
            fix: [{
                var: 0
            }, {
                var: 1
            }, {
                var: 2
            }]
        });
    });

    it('named loop (scope)', function(done){
        this.base
            .uint8('rootFix')
            .loop('fix', function(){
                if(typeof this.vars.fix === 'undefined'){
                    this.vars.fix = -1;
                }
                this.vars.fix++;
                this.varStack.peek().rootFix++;
                this.uint8('var');
            });

        this.eqArray([0, 0, 1, 2], done, {
            rootFix: 3,
            fix: [{
                fix: 0,
                var: 0
            }, {
                fix: 0,
                var: 1
            }, {
                fix: 0,
                var: 2
            }]
        });
    });

    it('named loop (no discard, finish after)', function(done){
        this.base.loop('loop', function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 2){
                finish();
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            loop: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('named loop (no discard, finish before)', function(done){
        this.base.loop('loop', function(finish, discard, i){
            if(i >= 3){
                return finish();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            loop: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('named loop (discard before, no finish)', function(done){
        this.base.loop('loop', function(finish, discard, i){
            if(i % 2 !== 0){
                discard();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6], done, {
            loop: [{
                var_0: 0
            }, {
                var_2: 2
            }, {
                var_4: 4
            }, {
                var_6: 6
            }]
        });
    });

    it('named loop (discard after, no finish)', function(done){
        this.base
            .uint8('rootFix')
            .loop('loop', function(finish, discard, i){
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
            rootFix: 7,
            loop: [{
                var_2: 2
            }, {
                var_4: 4
            }]
        });
    });

    it('named loop (discard, finish before)', function(done){
        this.base.loop('loop', function(finish, discard, i){
            if(i >= 3){
                finish(true);
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            loop: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('named loop (discard, finish after)', function(done){
        this.base.loop('loop', function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 3){
                finish(true);
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5], done, {
            loop: [{
                var_0: 0
            }, {
                var_1: 1
            }, {
                var_2: 2
            }]
        });
    });

    it('named loops replaced var', function(done){
        this.base.loop('loop', function(){
            this
                .uint8('value')
                .tap(function(){
                    this.vars = this.vars.value;
                });
        });

        this.eqArray([0, 1, 2, 3, 4], done, {
            loop: [0, 1, 2, 3, 4]
        });
    });
});
