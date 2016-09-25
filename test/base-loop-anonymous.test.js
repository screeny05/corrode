const expect = require('chai').expect;
const Base = require('../src/base');

/** @test {CorrodeBase#loop} */
describe('CorrodeBase#loop - anonymous', () => {
    beforeEach(function(){
        this.base = new Base();
        this.eqArray = require('./helpers/asserts').eqArray.bind(this);
    });


    it('anonymous loop (overriding)', function(done){
        this.base.loop(function(finish, discard, i){
            this.uint8('var');
            this.vars.iterations = i + 1;
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var: 5,
            iterations: 5
        });
    });

    it('anonymous loop (scope)', function(done){
        this.base.loop(function(){
            if(typeof this.vars.iterations === 'undefined'){
                this.vars.iterations = 0;
            }
            this.vars.iterations++;

            this.uint8('var');
        });

        this.eqArray([1, 2, 3], done, {
            iterations: 3,
            var: 3
        });
    });

    it('anonymous loop (no discard, no finish)', function(done){
        this.base.loop(function(finish, discard, i){
            this.vars['it_' + i] = i;
            this.uint8('var_' + i);
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var_0: 1,
            var_1: 2,
            var_2: 3,
            var_3: 4,
            var_4: 5,
            it_0: 0,
            it_1: 1,
            it_2: 2,
            it_3: 3,
            it_4: 4
        });
    });

    it('anonymous loop (no discard, finish after)', function(done){
        this.base.loop(function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 2){
                finish();
            }
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var_0: 1,
            var_1: 2,
            var_2: 3
        });
    });

    it('anonymous loop (no discard, finish before)', function(done){
        this.base.loop(function(finish, discard, i){
            if(i >= 3){
                return finish();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var_0: 1,
            var_1: 2,
            var_2: 3
        });
    });

    it('anonymous loop (discard before, no finish)', function(done){
        this.base.loop(function(finish, discard, i){
            if(i % 2 !== 0){
                discard();
            }
            this.uint8('var_' + i);
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6], done, {
            var_0: 0,
            var_2: 2,
            var_4: 4,
            var_6: 6
        });
    });

    it('anonymous loop (discard after, no finish)', function(done){
        this.base.loop(function(finish, discard, i){
            this
                .uint8('var_' + i)
                .tap(function(){
                    if(this.vars['var_' + i] % 2 !== 0){
                        discard();
                    }
                });
            if(i % 3 === 0){
                discard();
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6], done, {
            var_2: 2,
            var_4: 4
        });
    });

    /** @test {CorrodeBase#options.anonymousLoopDiscardDeep} */
    it('anonymous loop (discard deep, no finish)', function(done){
        this.base = new Base({ anonymousLoopDiscardDeep: true });

        this.base.loop(function(finish, discard, i){
            if(!this.vars['fix']){
                this.vars['fix'] = { iterations: 0, arr: [] };
            }
            this.vars.fix.iterations++;
            this.vars.fix.arr.push(i);

            this.uint8('var_' + i);
            if(i % 2 !== 0){
                discard();
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6, 7], done, {
            fix: {
                iterations: 4,
                arr: [0, 2, 4, 6]
            },
            var_0: 0,
            var_2: 2,
            var_4: 4,
            var_6: 6
        });
    });

    /** @test {CorrodeBase#options.anonymousLoopDiscardDeep} */
    it('anonymous loop (discard shallow, no finish)', function(done){
        this.base.loop(function(finish, discard, i){
            if(!this.vars['fix']){
                this.vars['fix'] = { iterations: 0, arr: [] };
            }
            this.vars.fix.iterations++;
            this.vars.fix.arr.push(i);

            this.uint8('var_' + i);
            if(i % 2 !== 0){
                discard();
            }
        });

        this.eqArray([0, 1, 2, 3, 4, 5, 6, 7], done, {
            fix: {
                iterations: 8,
                arr: [0, 1, 2, 3, 4, 5, 6, 7]
            },
            var_0: 0,
            var_2: 2,
            var_4: 4,
            var_6: 6
        });
    });

    it('anonymous loop (discard, finish before)', function(done){
        this.base.loop(function(finish, discard, i){
            if(i >= 3){
                finish(true);
            }
            this.uint8('var_' + i);
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var_0: 1,
            var_1: 2,
            var_2: 3
        });
    });

    it('anonymous loop (discard, finish after)', function(done){
        this.base.loop(function(finish, discard, i){
            this.uint8('var_' + i);
            if(i >= 3){
                finish(true);
            }
        });

        this.eqArray([1, 2, 3, 4, 5], done, {
            var_0: 1,
            var_1: 2,
            var_2: 3
        });
    });
});
