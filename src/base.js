import VariableStack from './variable-stack';
import BufferList from 'bl';
import { Transform } from 'readable-stream';
import { cloneDeep, isPlainObject } from 'lodash';

const LITTLE_ENDIAN = 'LE';
const BIG_ENDIAN = 'BE';
const POW_32 = Math.pow(2, 32);
const LOOP_VAR_SYMBOL = Symbol('loop-variable');

module.exports = class CorrodeBase extends Transform {
    static defaults = {
        endianness: LITTLE_ENDIAN,
        loopVarName: LOOP_VAR_SYMBOL,
        encoding: 'utf8',
        finishJobsOnEOF: true,
        anonymousLoopDiscardDeep: false,
        strictObjectMode: true
    };

    static LITTLE_ENDIAN = LITTLE_ENDIAN;
    static BIG_ENDIAN = BIG_ENDIAN;


    jobs = [];
    varStack = new VariableStack();
    streamBuffer = new BufferList();
    streamOffset = 0;
    chunkOffset = 0;
    isUnwinding = false;

    primitveMap = {
        int8: job => this.streamBuffer.readInt8(this.chunkOffset),
        uint8: job => this.streamBuffer.readUInt8(this.chunkOffset),

        int16: job => this.streamBuffer['readInt16' + job.endianness](this.chunkOffset),
        uint16: job => this.streamBuffer['readUInt16' + job.endianness](this.chunkOffset),

        int32: job => this.streamBuffer['readInt32' + job.endianness](this.chunkOffset),
        uint32: job => this.streamBuffer['readUInt32' + job.endianness](this.chunkOffset),

        float: job => this.streamBuffer['readFloat' + job.endianness](this.chunkOffset),
        double: job => this.streamBuffer['readDouble' + job.endianness](this.chunkOffset),

        int64: job => {
            const lo = this.streamBuffer['readUInt32' + job.endianness](this.chunkOffset + (job.endianness === LITTLE_ENDIAN ? 0 : 4));
            const hi = this.streamBuffer['read' + (job.type === 'uint64' ? 'U' : '') + 'Int32' + job.endianness](this.chunkOffset + (job.endianness === LITTLE_ENDIAN ? 4 : 0));
            return POW_32 * hi + lo;
        },
        uint64: job => this.primitveMap.int64(job)
    };

    get vars(){
        return this.varStack.value;
    }

    set vars(val){
        this.varStack.value = val;
    }

    constructor(options){
        super({ ...options, objectMode: true, encoding: null });

        this.options = {
            ...CorrodeBase.defaults,
            ...options
        };

        if(this.options.finishJobsOnEOF){
            this.on('finish', ::this.finishRemainingJobs);
        }
    }

    _transform(chunk, encoding, done){
        this.chunkOffset = 0;

        this.streamBuffer.append(chunk);

        this.jobLoop();

        super.push(null);
        this.streamBuffer.consume(this.chunkOffset);
        return done();
    }

    jobLoop(){
        while(this.jobs.length > 0){
            const job = this.jobs[0];
            const remainingBuffer = this.streamBuffer.length - this.chunkOffset;

            if(job.type === 'push'){
                if(this.options.strictObjectMode && typeof this.vars[job.name] !== 'undefined' && !isPlainObject(this.vars[job.name])){
                    throw new TypeError(`Can't push into a non-object value (${JSON.stringify(this.vars[job.name])}) in strictObjectMode`);
                }

                this.jobs.shift();
                this.varStack.push(job.name, job.value);
                continue;

            } else if(job.type === 'pop'){
                this.jobs.shift();
                this.varStack.pop();
                continue;

            } else if(job.type === 'tap'){
                this.jobs.shift();

                const unqueue = this.queueJobs();

                // if the tap has a name, we push a new var-layer
                if(job.name){
                    this
                        .push(job.name)
                        .tap(job.callback, job.args)
                        .pop()

                } else {
                    job.callback.apply(this, job.args);
                }

                unqueue();
                continue;

            } else if(job.type === 'loop'){
                // we wait for more data before executing a loop on an empty buffer.
                // this way we prevent empty objects being added, when the stream finishes.
                if(remainingBuffer === 0){
                    break;
                }

                if(job.finished){
                    this.jobs.shift();
                    continue;
                }

                const loopVar = this.options.loopVarName;
                const unqueue = this.queueJobs();


                if(job.name){
                    if(!this.vars[job.name]){
                        this.vars[job.name] = [];
                    }

                    this
                        .tap(loopVar, job.callback, [job.finish, job.discard, job.iteration++])
                        .tap(function(){
                            const loopResult = this.vars[loopVar];

                            // push vars only if job isn't discarded and yielded vars
                            // (no empty objects this way)
                            if(!job.discarded && (!isPlainObject(loopResult) || Object.keys(loopResult).length > 0)){
                                this.vars[job.name].push(loopResult);
                            }
                            job.discarded = false;
                            delete this.vars[loopVar];
                        });

                } else {
                    // make copy, in case the user discards the result
                    if(this.options.anonymousLoopDiscardDeep){
                        job[loopVar] = cloneDeep(this.vars);
                    } else {
                        job[loopVar] = { ...this.vars };
                    }

                    this
                        .tap(job.callback, [job.finish, job.discard, job.iteration++])
                        .tap(function(){
                            if(job.discarded && job[loopVar]){
                                this.vars = job[loopVar];
                            }
                            job.discarded = false;
                            delete job[loopVar];
                        });
                }

                unqueue();
                continue;
            }

            // determine length of next job
            const length = typeof job.length === 'string' ? this.vars[job.length] : job.length;

            // break on end of buffer (wait if we're not unwinding yet)
            if(this.streamBuffer.length - this.chunkOffset < length){
                if(this.isUnwinding && this.jobs.length > 0){
                    // unwind loop, by removing the loop job
                    this.removeReadJobs();
                    continue;
                }

                break;
            }

            if(job.type === 'buffer'){
                this.jobs.shift();
                this.vars[job.name] = this.streamBuffer.slice(this.chunkOffset, this.chunkOffset + length);
                this.moveOffset(length);
                continue;

            } else if(job.type === 'string'){
                this.jobs.shift();
                this.vars[job.name] = this.streamBuffer.toString(job.encoding, this.chunkOffset, this.chunkOffset + length);
                this.moveOffset(length);
                continue;

            } else if(job.type === 'skip'){
                this.jobs.shift();
                if(this.streamOffset + length < 0){
                    throw new RangeError('cannot skip below 0');
                }
                this.moveOffset(length);
                continue;

            } else if(typeof this.primitveMap[job.type] === 'function'){
                this.vars[job.name] = this.primitveMap[job.type](job);
                this.jobs.shift();
                this.moveOffset(length);
            } else {
                throw new Error(`invalid job type '${job.type}'`);
            }
        }
    }

    finishRemainingJobs(){
        this.isUnwinding = true;
        this.removeReadJobs();
        this.jobLoop();
        this.varStack.popAll();
    }

    /**
     * purges all jobs from the job-queue, which need to read from the stream
     */
    removeReadJobs(){
        const filteredJobs = this.jobs
            .slice()
            .filter(job => job.type === 'pop' || (job.type === 'tap' && !job.name));

        this.jobs.splice(0);
        this.jobs.push(...filteredJobs);
    }

    moveOffset(by){
        this.chunkOffset += by;
        this.streamOffset += by;
    }

    queueJobs(){
        const queuedJobs = this.jobs.slice();

        // empty jobs
        this.jobs.splice(0);

        // unqueue-method
        return () => this.jobs.push(...queuedJobs);
    }

    _pushJob(name, type, length, endianness){
        this.jobs.push(typeof name === 'object' ? name : { name, type, length, endianness });
        return this;
    }

    tap(name, callback, args){
        if(typeof name === 'function'){
            args = callback;
            callback = name;
            name = undefined;
        }

        return this._pushJob({
            name,
            type: 'tap',
            args,
            callback
        });
    }

    loop(name, callback){
        if(typeof name === 'function'){
            callback = name;
            name = undefined;
        }

        let loopJob = {
            name,
            type: 'loop',
            callback,
            finished: false,
            discarded: false,
            iteration: 0
        };

        loopJob.finish = function(discard){
            loopJob.finished = true;
            loopJob.discarded = !!discard;
        };

        loopJob.discard = function(){
            loopJob.discarded = true;
        };

        return this._pushJob(loopJob);
    }

    skip(length){
        return this._pushJob({
            type: 'skip',
            length
        });
    }

    pop(){
        return this._pushJob({
            type: 'pop'
        });
    }

    push(name, value){
        return this._pushJob({
            type: 'push',
            name,
            value
        });
    }

    buffer(name, length){
        return this._pushJob({
            name,
            type: 'buffer',
            length
        });
    }

    string(name, length, encoding = this.options.encoding){
        return this._pushJob({
            name,
            type: 'string',
            length,
            encoding
        });
    }

    int8(name){ return this._pushJob(name, 'int8', 1, this.options.endianness); }
    int8le(name){ return this._pushJob(name, 'int8', 1, LITTLE_ENDIAN); }
    int8be(name){ return this._pushJob(name, 'int8', 1, BIG_ENDIAN); }
    uint8(name){ return this._pushJob(name, 'uint8', 1, this.options.endianness); }
    uint8le(name){ return this._pushJob(name, 'uint8', 1, LITTLE_ENDIAN); }
    uint8be(name){ return this._pushJob(name, 'uint8', 1, BIG_ENDIAN); }

    int16(name){ return this._pushJob(name, 'int16', 2, this.options.endianness); }
    int16le(name){ return this._pushJob(name, 'int16', 2, LITTLE_ENDIAN); }
    int16be(name){ return this._pushJob(name, 'int16', 2, BIG_ENDIAN); }
    uint16(name){ return this._pushJob(name, 'uint16', 2, this.options.endianness); }
    uint16le(name){ return this._pushJob(name, 'uint16', 2, LITTLE_ENDIAN); }
    uint16be(name){ return this._pushJob(name, 'uint16', 2, BIG_ENDIAN); }

    int32(name){ return this._pushJob(name, 'int32', 4, this.options.endianness); }
    int32le(name){ return this._pushJob(name, 'int32', 4, LITTLE_ENDIAN); }
    int32be(name){ return this._pushJob(name, 'int32', 4, BIG_ENDIAN); }
    uint32(name){ return this._pushJob(name, 'uint32', 4, this.options.endianness); }
    uint32le(name){ return this._pushJob(name, 'uint32', 4, LITTLE_ENDIAN); }
    uint32be(name){ return this._pushJob(name, 'uint32', 4, BIG_ENDIAN); }

    int64(name){ return this._pushJob(name, 'int64', 8, this.options.endianness); }
    int64le(name){ return this._pushJob(name, 'int64', 8, LITTLE_ENDIAN); }
    int64be(name){ return this._pushJob(name, 'int64', 8, BIG_ENDIAN); }
    uint64(name){ return this._pushJob(name, 'uint64', 8, this.options.endianness); }
    uint64le(name){ return this._pushJob(name, 'uint64', 8, LITTLE_ENDIAN); }
    uint64be(name){ return this._pushJob(name, 'uint64', 8, BIG_ENDIAN); }

    float(name){ return this._pushJob(name, 'float', 4, this.options.endianness); }
    floatle(name){ return this._pushJob(name, 'float', 4, LITTLE_ENDIAN); }
    floatbe(name){ return this._pushJob(name, 'float', 4, BIG_ENDIAN); }

    double(name){return this._pushJob(name, 'double', 8, this.options.endianness); }
    doublele(name){return this._pushJob(name, 'double', 8, LITTLE_ENDIAN); }
    doublebe(name){return this._pushJob(name, 'double', 8, BIG_ENDIAN); }
}
