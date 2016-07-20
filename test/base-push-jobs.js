const expect = require('chai').expect;
const Base = require('../src/base');
const fixture = require('./fixtures/vars');

beforeEach(function(){
    this.base = new Base();
});

it('pushes int8 jobs', function(){
    this.base
        .int8('int8')
        .int8le('int8le')
        .int8be('int8be')
        .uint8('uint8')
        .uint8le('uint8le')
        .uint8be('uint8be');

    expect(this.base.jobs).to.deep.equal([
        { name: 'int8', type: 'int8le', length: 1 },
        { name: 'int8le', type: 'int8le', length: 1 },
        { name: 'int8be', type: 'int8be', length: 1 },
        { name: 'uint8', type: 'uint8le', length: 1 },
        { name: 'uint8le', type: 'uint8le', length: 1 },
        { name: 'uint8be', type: 'uint8be', length: 1 },
    ]);
});

it('pushes int16 jobs', function(){
    this.base
        .int16('int16')
        .int16le('int16le')
        .int16be('int16be')
        .uint16('uint16')
        .uint16le('uint16le')
        .uint16be('uint16be');

    expect(this.base.jobs).to.deep.equal([
        { name: 'int16', type: 'int16le', length: 2 },
        { name: 'int16le', type: 'int16le', length: 2 },
        { name: 'int16be', type: 'int16be', length: 2 },
        { name: 'uint16', type: 'uint16le', length: 2 },
        { name: 'uint16le', type: 'uint16le', length: 2 },
        { name: 'uint16be', type: 'uint16be', length: 2 },
    ]);
});

it('pushes int32 jobs', function(){
    this.base
        .int32('int32')
        .int32le('int32le')
        .int32be('int32be')
        .uint32('uint32')
        .uint32le('uint32le')
        .uint32be('uint32be');

    expect(this.base.jobs).to.deep.equal([
        { name: 'int32', type: 'int32le', length: 4 },
        { name: 'int32le', type: 'int32le', length: 4 },
        { name: 'int32be', type: 'int32be', length: 4 },
        { name: 'uint32', type: 'uint32le', length: 4 },
        { name: 'uint32le', type: 'uint32le', length: 4 },
        { name: 'uint32be', type: 'uint32be', length: 4 },
    ]);
});

it('pushes int64 jobs', function(){
    this.base
        .int64('int64')
        .int64le('int64le')
        .int64be('int64be')
        .uint64('uint64')
        .uint64le('uint64le')
        .uint64be('uint64be');

    expect(this.base.jobs).to.deep.equal([
        { name: 'int64', type: 'int64le', length: 8 },
        { name: 'int64le', type: 'int64le', length: 8 },
        { name: 'int64be', type: 'int64be', length: 8 },
        { name: 'uint64', type: 'uint64le', length: 8 },
        { name: 'uint64le', type: 'uint64le', length: 8 },
        { name: 'uint64be', type: 'uint64be', length: 8 },
    ]);
});

it('pushes float jobs', function(){
    this.base
        .float('float')
        .floatle('floatle')
        .floatbe('floatbe');

    expect(this.base.jobs).to.deep.equal([
        { name: 'float', type: 'floatle', length: 4 },
        { name: 'floatle', type: 'floatle', length: 4 },
        { name: 'floatbe', type: 'floatbe', length: 4 }
    ]);
});

it('pushes double jobs', function(){
    this.base
        .double('double')
        .doublele('doublele')
        .doublebe('doublebe');

    expect(this.base.jobs).to.deep.equal([
        { name: 'double', type: 'doublele', length: 8 },
        { name: 'doublele', type: 'doublele', length: 8 },
        { name: 'doublebe', type: 'doublebe', length: 8 }
    ]);
});

it('pushes options.endianness correct jobs', function(){
    let base = new Base({ endianness: 'be' });

    base
        .int8('int8')
        .uint8('uint8')
        .int16('int16')
        .uint16('uint16')
        .int32('int32')
        .uint32('uint32')
        .int64('int64')
        .uint64('uint64')
        .float('float')
        .double('double');

    expect(base.jobs).to.deep.equal([
        { name: 'int8', type: 'int8be', length: 1 },
        { name: 'uint8', type: 'uint8be', length: 1 },
        { name: 'int16', type: 'int16be', length: 2 },
        { name: 'uint16', type: 'uint16be', length: 2 },
        { name: 'int32', type: 'int32be', length: 4 },
        { name: 'uint32', type: 'uint32be', length: 4 },
        { name: 'int64', type: 'int64be', length: 8 },
        { name: 'uint64', type: 'uint64be', length: 8 },
        { name: 'float', type: 'floatbe', length: 4 },
        { name: 'double', type: 'doublebe', length: 8 },
    ]);
});

it('pushes blob jobs', function(){
    this.base
        .blob('blob1', 1)
        .blob('blob8', 8)
        .blob('blob16', 16)
        .blob('blob32', 32);

    expect(this.base.jobs).to.deep.equal([
        { name: 'blob1', type: 'blob', length: 1 },
        { name: 'blob8', type: 'blob', length: 8 },
        { name: 'blob16', type: 'blob', length: 16 },
        { name: 'blob32', type: 'blob', length: 32 }
    ]);
});

it('pushes string jobs', function(){
    this.base
        .string('string8default', 8)
        .string('string16ascii', 16, 'ascii')
        .string('string32utf8', 32, 'utf8')
        .string('string64ansi', 64, 'ansi');

    expect(this.base.jobs).to.deep.equal([
        { name: 'string8default', type: 'string', length: 8, encoding: this.base.options.encoding },
        { name: 'string16ascii', type: 'string', length: 16, encoding: 'ascii' },
        { name: 'string32utf8', type: 'string', length: 32, encoding: 'utf8' },
        { name: 'string64ansi', type: 'string', length: 64, encoding: 'ansi' }
    ]);
});

it('pushes push jobs', function(){
    this.base
        .push('object', fixture.object)
        .push('array', fixture.array);

    expect(this.base.jobs).to.deep.equal([
        { name: 'object', type: 'push', value: fixture.object },
        { name: 'array', type: 'push', value: fixture.array }
    ]);
});

it('pushes pop jobs', function(){
    this.base.pop();

    expect(this.base.jobs).to.deep.equal([
        { type: 'pop' }
    ]);
});

it('pushes skip jobs', function(){
    this.base
        .skip(16)
        .skip(32);

    expect(this.base.jobs).to.deep.equal([
        { type: 'skip', length: 16 },
        { type: 'skip', length: 32 }
    ]);
});

it('pushes loop jobs', function(){
    let noop = function(){};

    this.base
        .loop(noop)
        .loop('name', noop)
        .loop('name2', noop);

    expect(this.base.jobs).to.deep.equal([
        { type: 'loop', name: undefined, callback: noop, finished: false, discarded: false, iteration: 0, finish: this.base.jobs[0].finish, discard: this.base.jobs[0].discard },
        { type: 'loop', name: 'name', callback: noop, finished: false, discarded: false, iteration: 0, finish: this.base.jobs[1].finish, discard: this.base.jobs[1].discard },
        { type: 'loop', name: 'name2', callback: noop, finished: false, discarded: false, iteration: 0, finish: this.base.jobs[2].finish, discard: this.base.jobs[2].discard },
    ]);

    this.base.jobs[0].finish();
    this.base.jobs[1].finish(true);
    this.base.jobs[2].discard();

    expect(this.base.jobs[0].finished).to.be.true;
    expect(this.base.jobs[0].discarded).to.be.false;
    expect(this.base.jobs[1].finished).to.be.true;
    expect(this.base.jobs[1].discarded).to.be.true;
    expect(this.base.jobs[2].finished).to.be.false;
    expect(this.base.jobs[2].discarded).to.be.true;
});

it('pushes tap jobs', function(){
    let noop = function(){};

    this.base
        .tap(noop)
        .tap('name', noop)
        .tap('name2', noop, ['a', 'b'])
        .tap(noop, ['a', 'b']);

    expect(this.base.jobs).to.deep.equal([
        { type: 'tap', name: undefined, args: undefined, callback: noop },
        { type: 'tap', name: 'name', args: undefined, callback: noop },
        { type: 'tap', name: 'name2', args: ['a', 'b'], callback: noop },
        { type: 'tap', name: undefined, args: ['a', 'b'], callback: noop },
    ]);
});

it('pushes custom jobs', function(){
    this.base.pushJob('name', 'custom', 16, { key: 'value' });

    expect(this.base.jobs).to.deep.equal([
        { type: 'custom', name: 'name', length: 16, key: 'value' }
    ]);
});

it('queues and unqueues jobs', function(){
    this.base
        .uint8le('uint8le')
        .int64le('int64le');

    let unqueue = this.base.queueJobs();

    this.base
        .string('string', 16)
        .blob('blob', 16);

    unqueue();

    expect(this.base.jobs).to.deep.equal([
        { type: 'string', name: 'string', length: 16, encoding: this.base.options.encoding },
        { type: 'blob', name: 'blob', length: 16 },
        { type: 'uint8le', name: 'uint8le', length: 1 },
        { type: 'int64le', name: 'int64le', length: 8 }
    ]);
});

it('removes read jobs', function(){
    let noop = function(){};

    this.base
        .uint8le('uint8le')
        .string('string', 16)
        .blob('blob', 32)
        .int64le('int64le')
        .tap('tap', noop)
        .tap(noop)
        .loop('loop', noop)
        .loop(noop)
        .pop()
        .string('string128', 128);

    this.base.removeReadJobs();

    expect(this.base.jobs).to.deep.equal([
        { type: 'tap', name: undefined, args: undefined, callback: noop },
        { type: 'pop' }
    ]);
});
