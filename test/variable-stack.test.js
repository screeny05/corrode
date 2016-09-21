const expect = require('chai').expect;
const VarStack = require('../src/variable-stack');


beforeEach(function(){
    this.stack = new VarStack();
});

/** @test {VariableStack} */
it('starts as an empty object', function(){
    expect(this.stack.stack).to.have.length.of(1);
    expect(this.stack.top.isRoot).to.be.true;
    expect(this.stack.value).to.be.object;
    expect(this.stack.value).to.be.empty;
});

/** @test {VariableStack#constructor} */
it('allows properties on layer 0', function(){
    this.stack.value.foo = 'bar';
    expect(this.stack.value.foo).to.equal('bar');
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#top}
 * @test {VariableStack#value}
 */
it('allows object-descension', function(){
    this.stack.push('child');
    expect(this.stack.value).to.be.object;
    expect(this.stack.value).to.be.empty;
    expect(this.stack.top.name).to.equal('child');
    expect(this.stack.top.isRoot).to.be.false;
});

/** @test {VariableStack#push} */
it('haves correct value-shortcut', function(){
    this.stack.push('child');
    this.stack.value.val = 'fixture';
    expect(this.stack.value).to.deep.equal(this.stack.top.value);
});

/** @test {VariableStack#push} */
it('allows deep-adding', function(){
    this.stack.push('child');
    this.stack.value.fixture = 'fixture';
    expect(this.stack.value.fixture).to.equal('fixture');
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#pop}
 */
it('allows object-popping', function(){
    this.stack.push('child');
    this.stack.pop();
    expect(this.stack.top.isRoot).to.be.true;
    expect(this.stack.value.child).to.be.object;
    expect(this.stack.value.child).to.be.empty;
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#pop}
 */
it('allows object-popping with values', function(){
    this.stack.push('child');
    this.stack.value.fixture = 'fixture';
    this.stack.pop();
    expect(this.stack.value.child.fixture).to.equal('fixture');
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#pop}
 */
it('allows multiple pushed objects', function(){
    this.stack.push('child-1');
    this.stack.value.fixture = 'fixture-1';
    this.stack.pop();

    this.stack.push('child-2');
    this.stack.value.fixture = 'fixture-2';
    this.stack.pop();

    expect(Object.keys(this.stack.value)).to.have.length.of(2);
    expect(this.stack.value['child-1']).to.be.object;
    expect(this.stack.value['child-1']).to.not.be.empty;
    expect(this.stack.value['child-2']).to.be.object;
    expect(this.stack.value['child-2']).to.not.be.empty;
    expect(this.stack.value['child-1'].fixture).to.equal('fixture-1');
    expect(this.stack.value['child-2'].fixture).to.equal('fixture-2');
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#pop}
 */
it('allows object-repushing', function(){
    this.stack.push('child');
    this.stack.value.val = 'fixture';
    this.stack.pop();
    this.stack.push('child');
    expect(this.stack.value).to.not.be.empty;
    expect(this.stack.value.val).to.equal('fixture');
});

/** @test {VariableStack#push} */
it('allows array-repushing', function(){
    this.stack.push('child', []);
    this.stack.value.push('fixture');
    this.stack.pop();
    this.stack.push('child');
    expect(this.stack.value).to.not.be.empty;
    expect(this.stack.value[0]).to.equal('fixture');
});

/** @test {VariableStack#push} */
it('allows primitive-repushing', function(){
    this.stack.push('child', 2);
    this.stack.value *= 2;
    this.stack.pop();
    this.stack.push('child');
    expect(this.stack.value).to.equal(4);
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#pop}
 */
it('repushes the same instance', function(){
    this.stack.push('child-1');
    this.stack.value.val = 'fixture';
    expect(this.stack.peek()['child-1']).to.equal(this.stack.value);
    expect(this.stack.peek()['child-1'].val).to.equal(this.stack.value.val);

    this.stack.pop();
    this.stack.push('child-2', []);
    this.stack.pop();
    expect(this.stack.value['child-2']).to.be.array;
    expect(this.stack.value['child-2']).to.be.empty;
});

/**
 * @test {VariableStack#push}
 * @test {VariableStack#value}
 */
it('allows object-repushing on user-defined objects', function(){
    this.stack.value.child = { val: 'fixture' };
    this.stack.push('child');
    expect(this.stack.value).to.not.be.empty;
    expect(this.stack.value.val).to.equal('fixture');
});

/**
 * @test {VariableStack#peek}
 * @test {VariableStack#peekLayer}
 * @test {VariableStack#popAll}
 */
it('allows layer-peeking & allPop', function(){
    this.stack.push('child');
    this.stack.value.val = 'val'
    expect(this.stack.peekLayer().isRoot).to.be.true;
    expect(this.stack.peek().child.val).to.equal('val');
    expect(this.stack.peek(0).val).to.equal('val');

    this.stack.push('child');
    expect(this.stack.peekLayer().isRoot).to.be.false;
    expect(this.stack.peekLayer(2).isRoot).to.be.true;

    this.stack.push('child');
    expect(this.stack.peekLayer().isRoot).to.be.false;
    expect(this.stack.peekLayer(2).isRoot).to.be.false;
    expect(this.stack.peekLayer(3).isRoot).to.be.true;

    this.stack.push('child');
    this.stack.value.fixture = 'fixture';
    expect(this.stack.peekLayer().isRoot).to.be.false;
    expect(this.stack.peekLayer(2).isRoot).to.be.false;
    expect(this.stack.peekLayer(3).isRoot).to.be.false;
    expect(this.stack.peekLayer(4).isRoot).to.be.true;

    this.stack.popAll();
    expect(this.stack.top.isRoot).to.be.true;
    expect(this.stack.value).to.not.be.empty;
    expect(this.stack.value.child.child.child.child.fixture).to.equal('fixture');
});

/** @test {VariableStack#peek} */
it('properly supports layer-peeking', function(){
    this.stack.push('child1');
    this.stack.value.val = 'val-1';
    this.stack.pop();

    this.stack.push('child2');
    this.stack.value.val = 'val-2';
    this.stack.pop();

    this.stack.push('child3');
    this.stack.value.val = 'val-3';
    expect(this.stack.peek().child1.val).to.equal('val-1');
    expect(this.stack.peek().child2.val).to.equal('val-2');

    this.stack.push('child31');
    this.stack.value.val = 'val-3-1';
    expect(this.stack.peek().val).to.equal('val-3');
    expect(this.stack.peek(2).child1.val).to.equal('val-1');
    expect(this.stack.peek(2).child2.val).to.equal('val-2');

    this.stack.push('child311');
    expect(this.stack.peek(3).child1.val).to.equal('val-1');
});

/** @test {VariableStack#pop} */
it('prevents invalid popping', function(){
    expect(this.stack.pop.bind(this.stack)).to.throw(ReferenceError);

    this.stack.push('child');
    expect(this.stack.pop.bind(this.stack)).to.not.throw(ReferenceError);
});

/** @test {VariableStack#peek} */
it('prevents invalid peeking', function(){
    expect(this.stack.peek.bind(this.stack)).to.throw(ReferenceError);

    this.stack.push('child');
    expect(this.stack.peek.bind(this.stack)).to.not.throw(ReferenceError);
});

/** @test {VariableStack#push} */
it('allows array pushing', function(){
    this.stack.push('child', []);
    this.stack.value.push('fixture');

    expect(this.stack.value).to.be.array;
    expect(this.stack.value).to.have.length.of(1);

    this.stack.pop();
    expect(this.stack.value.child[0]).to.equal('fixture');
});

/** @test {VariableStack#push} */
it('allows full primitive value-replacing', function(){
    this.stack.push('child');
    this.stack.value = 'fixture';

    expect(this.stack.value).to.equal('fixture');
});

/** @test {VariableStack#push} */
it('allows full object value-replacing', function(){
    this.stack.push('child');
    this.stack.value.fixture = 'fixture';

    this.stack.value = {};
    expect(this.stack.value).to.be.empty;
});

/** @test {VariableStack#push} */
it('allows full array value-replacing', function(){
    this.stack.push('child', []);
    this.stack.value.push('fixture');

    this.stack.value = [];
    expect(this.stack.value).to.be.empty;
});

/** @test {VariableStack#set} */
it('updates the parent-layers value', function(){
    this.stack.push('child', 10);
    this.stack.value = 20;
    expect(this.stack.peek().child).to.equal(20);

    this.stack.pop();
    expect(this.stack.value.child).to.equal(20);
});
