import VariableStack from './variable-stack';
import BufferList from 'bl';
import { Transform } from 'readable-stream';
import { cloneDeep, isPlainObject } from 'lodash';

const LITTLE_ENDIAN = 'LE';
const BIG_ENDIAN = 'BE';
const POW_32 = Math.pow(2, 32);
const LOOP_VAR_SYMBOL = Symbol('loop-variable');

/**
 * This class lies at the very base of this library.
 *
 * It's responsible for reading variables, looping and tapping values and other
 * more or less low-level stuff. It extends the {Transform}-stream, so you can
 * pipe other streams into your corrode instance. This makes corrode an efficient
 * library for even huge files. Unless necessary or explicitly wanted by the user,
 * corrode flushes it's internal buffer {@link Corrode#streamBuffer} asap.
 *
 * The library works not directly. If you call e.g. {@link Corrode#uint32be} there won't
 * be a direct read from a given buffer. Instead there will be a new *job*, added
 * to {@link Corrode#jobs}. This array is responsible for managing the work to be done
 * once data flows. This way, it's possible to insert new jobs and making for
 * an imperative way of using this library.
 *
 * Corrode will process the given stream as long as long as there's new chunks
 * and jobs. Once either of these drain, corrode will stop and clean possibly
 * remaining jobs (i.e. remove all read-jobs).
 */
export default class CorrodeBase extends Transform {

    /**
     * Defaults Object for available options
     * {@link CorrodeBase#constructor}
     * @access public
     * @type {Object}
     */
    static defaults = {
        endianness: LITTLE_ENDIAN,
        loopVarName: LOOP_VAR_SYMBOL,
        encoding: 'utf8',
        finishJobsOnEOF: true,
        anonymousLoopDiscardDeep: false,
        strictObjectMode: true
    };

    /**
     * static constant for little endian
     * @access public
     * @type {string}
     */
    static LITTLE_ENDIAN = LITTLE_ENDIAN;

    /**
     * static constant for big endian
     * @access public
     * @type {string}
     */
    static BIG_ENDIAN = BIG_ENDIAN;

    /**
     * array holding the jobs which are to be processed
     * @access public
     * @type {Array<Object>}
     */
    jobs = [];

    /**
     * the VariableStack holding the layers and variables of this instance
     * @access public
     * @type {VariableStack}
     */
    varStack = new VariableStack();

    /**
     * internal buffer for stream-chunks not yet processable
     * @access public
     * @type {BufferList}
     */
    streamBuffer = new BufferList();

    /**
     * offset in the whole piped stream
     * @access public
     * @type {Number}
     */
    streamOffset = 0;

    /**
     * offset in the current running chunk ({@link CorrodeBase#streamBuffer})
     * @access public
     * @type {Number}
     */
    chunkOffset = 0;

    /**
     * indicates whether only pops are getting processed
     * @access public
     * @type {Boolean}
     */
    isUnwinding = false;

    /**
     * indicates whether automatic flushes are disabled
     * @access public
     * @type {Boolean}
     */
    isSeeking = false;

    /**
     * available primitve jobs. these are the functions really reading data from
     * the buffer.
     * @access public
     * @type {Object}
     */
    primitveMap = {
        int8: () => this.streamBuffer.readInt8(this.chunkOffset),
        uint8: () => this.streamBuffer.readUInt8(this.chunkOffset),

        int16: job => this.streamBuffer[`readInt16${job.endianness}`](this.chunkOffset),
        uint16: job => this.streamBuffer[`readUInt16${job.endianness}`](this.chunkOffset),

        int32: job => this.streamBuffer[`readInt32${job.endianness}`](this.chunkOffset),
        uint32: job => this.streamBuffer[`readUInt32${job.endianness}`](this.chunkOffset),

        float: job => this.streamBuffer[`readFloat${job.endianness}`](this.chunkOffset),
        double: job => this.streamBuffer[`readDouble${job.endianness}`](this.chunkOffset),

        int64: job => {
            const lo = this.streamBuffer[`readUInt32${job.endianness}`](this.chunkOffset + (job.endianness === LITTLE_ENDIAN ? 0 : 4));
            const hi = this.streamBuffer[`read${job.type === 'uint64' ? 'U' : ''}Int32${job.endianness}`](this.chunkOffset + (job.endianness === LITTLE_ENDIAN ? 4 : 0));
            return (POW_32 * hi) + lo;
        },
        uint64: job => this.primitveMap.int64(job)
    };

    /**
     * get variables of the current stack
     * @return {Object|*} topmost value
     */
    get vars(){
        return this.varStack.value;
    }

    /**
     * replace the current value
     * @param  {Object|*} val new value
     */
    set vars(val){
        this.varStack.value = val;
    }

    /**
     * options default to {@link Corrode.defaults}, also accepts options
     * for {@link Transform#constructor}.
     * @param {string}  options.endianness=CorrodeBase#LITTLE_ENDIAN endianness, when none is explicitly given by the job
     * @param {*}       options.loopVarName=Symbol(loop-variable)    identifier of the temporary variable used internally for loops
     * @param {string}  options.encoding='utf8'                      default encoding, when none is explicitly given by the job
     * @param {boolean} options.finishJobsOnEOF=true                 whether to finish all remaining jobs on stream-end or leave the corrode-instance in an unfinished state with possibly many unresolved functions and unpredictable state (see tests)
     * @param {boolean} options.anonymousLoopDiscardDeep=false       when anonymous loop-jobs get discarded, the original state which gets restored is either a shallow copy or a deep copy of the original object (see tests)
     * @param {boolean} options.strictObjectMode=true                whether to prevent none-object values from being pushed onto {@link CorrodeBase#vars} (catches mistakes)
     */
    constructor(options){
        super({ ...options, objectMode: true, encoding: null });

        this.options = {
            ...CorrodeBase.defaults,
            ...options
        };
    }

    /**
     * add a new chunk to the internal buffer and process remaining jobs
     * this TransformStream won't call the push-method as it is not able
     * to guarantee correct ouptut while still reading data. this depends not on
     * corrode, but on the way you use it.
     * @implements {Transform#_transform}
     * @access private
     */
    _transform(chunk, encoding, done){
        this.streamBuffer.append(chunk);

        this.jobLoop();

        // isSeeking prevents internal flushes
        // (useful for going back to a previous chunk)
        if(!this.isSeeking){
            this.streamBuffer.consume(this.chunkOffset);
            this.chunkOffset = 0;
        }

        // the callback is called synchronously, meaning any errors
        // working up in the jobLoop (asserts, etc) get thrown in the main
        // event-loop. that's a bug:
        // @link https://github.com/screeny05/corrode/issues/24
        return done();
    }

    /**
     * finish remaining jobs if finishJobsOnEOF is enabled
     * @implements {Transform#_flush}
     * @access private
     */
    _flush(done){
        if(this.options.finishJobsOnEOF){
            this.finishRemainingJobs();
        }

        setImmediate(done);
    }

    /**
     * internal function to process the array of jobs still remaing.
     * this function is synchronous. this is due to the fact of keeping things
     * more simple. if you intend to use this library expecting taps and loops
     * to work async you're invited to create an issue to inform me of the
     * need for this kind of behaviour. Until then corrode should satisfy most use cases.
     *
     * if you desperately need async behaviour when parsing data, i'd recommend
     * doing that after corrode has finished parsing the buffer, separately.
     *
     * @throws {Error} assertion-errors, runtime-errors
     */
    jobLoop(){
        // {@link CorrodeBase#jobs} get's manipulated by {@link CorrodeBase#jobLoop}
        while(this.jobs.length > 0){
            const job = this.jobs[0];
            const remainingBuffer = this.streamBuffer.length - this.chunkOffset;

            if(job.type === 'push'){
                // in strictObjectMode the variable being pushed has to be a real object.
                // this prevents accidentaly pushing numbers, strings, etc.
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

                if(typeof job.name !== 'undefined'){
                    // if the tap has a name, push a new var-layer
                    this
                        .push(job.name)
                        .tap(job.callback, job.args)
                        .pop();

                } else {
                    // otherwise we continue working on the current layer
                    job.callback.apply(this, job.args);
                }

                unqueue();
                continue;

            } else if(job.type === 'loop'){
                // wait for more data before executing a loop on an empty buffer.
                // this way empty objects are not being added when the stream finishes
                if(remainingBuffer === 0){
                    break;
                }

                if(job.finished){
                    this.jobs.shift();
                    continue;
                }

                const loopVar = this.options.loopVarName;
                const unqueue = this.queueJobs();

                if(typeof job.name !== 'undefined'){
                    if(typeof this.vars[job.name] === 'undefined'){
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
                    // {@link CorrodeBase#options.anonymousLoopDiscardDeep}
                    if(this.options.anonymousLoopDiscardDeep){
                        job[loopVar] = cloneDeep(this.vars);
                    } else {
                        job[loopVar] = { ...this.vars };
                    }

                    this
                        .tap(job.callback, [job.finish, job.discard, job.iteration++])
                        .tap(function(){
                            if(job.discarded && typeof job[loopVar] !== 'undefined'){
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

            // break on unsufficient streamBuffer-length (wait if not unwinding yet)
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
                this._moveOffset(length);
                continue;

            } else if(job.type === 'string'){
                this.jobs.shift();
                this.vars[job.name] = this.streamBuffer.toString(job.encoding, this.chunkOffset, this.chunkOffset + length);
                this._moveOffset(length);
                continue;

            } else if(job.type === 'skip'){
                this.jobs.shift();
                if(this.streamOffset + length < 0){
                    throw new RangeError('cannot skip below 0');
                }
                this._moveOffset(length);
                continue;

            } else if(typeof this.primitveMap[job.type] === 'function'){
                this.vars[job.name] = this.primitveMap[job.type](job);
                this.jobs.shift();
                this._moveOffset(length);
            } else {
                throw new Error(`invalid job type '${job.type}'`);
            }
        }
    }

    /**
     * re-starts the jobLoop with the job-list cleaned from any read jobs
     * {@link CorrodeBase#removeReadJobs}
     * {@link CorrodeBase#isUnwinding}
     */
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

    /**
     * utility method to move both {@link CorrodeBase#chunkOffset} and
     * {@link CorrodeBase#streamOffset} by a given amount of bytes
     * @access private
     */
    _moveOffset(by){
        this.chunkOffset += by;
        this.streamOffset += by;
    }

    /**
     * remove all jobs from {@link CorrodeBase#jobs} with the ability to re-add them back later.
     * @returns {function} function to append all queued jobs back onto the jobs-array (borrowed from redux)
     */
    queueJobs(){
        const queuedJobs = this.jobs.slice();

        // empty jobs
        this.jobs.splice(0);

        // unqueue-method
        return () => this.jobs.push(...queuedJobs);
    }

    /**
     * utility method to push a new job onto the job-array
     * @access private
     * @return {CorrodeBase} this
     */
    _pushJob(name, type, length, endianness){
        this.jobs.push(typeof name === 'object' ? name : {
            name,
            type,
            length,
            endianness
        });
        return this;
    }

    /**
     * push a tap-job onto the job-array
     * a tap-job is a special kind of job allowing the developer to peek into
     * the current variables and creating more complex structures and behaviour
     * based on available information.
     * @param {string} [name] name of the new variable-layer. if none is provided, the current layer will be used
     * @param {function(...args: *)} callback called when this job is reached
     * @param {Array} args array of possible arguments being passed to the callback
     * @return {CorrodeBase} this
     */
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

    /**
     * push a loop-job onto the job-array
     * a loop-job is a special kind of job allowing the developer to create loops
     * in the current job-array. this allows for iteration, seeking and more
     * complex behaviours
     * @param {string} [name] name of the new variable-layer. if none is provided, the current layer will be used
     * @param {function(end: function, discard: function, i: number)} callback called until `end()` is called.
     *        `end(true)` can be used to end and discard the current loop.
     *        `discard()` can be used to reset the current layer ({@link CorrodeBase#options.anonymousLoopDiscardDeep}).
     *        `i` is the current iteration count
     * @return {CorrodeBase} this
     */
    loop(name, callback){
        if(typeof name === 'function'){
            callback = name;
            name = undefined;
        }

        const loopJob = {
            name,
            type: 'loop',
            callback,
            finished: false,
            discarded: false,
            iteration: 0
        };

        loopJob.finish = function(discard){
            loopJob.finished = true;
            loopJob.discarded = Boolean(discard);
        };

        loopJob.discard = function(){
            loopJob.discarded = true;
        };

        return this._pushJob(loopJob);
    }

    /**
     * push a skip-job onto the job-array
     * skip-jobs allow the developer to skip a given number of bytes.
     * If the amount of bytes exceeds the current available byte-count in the
     * internal buffer {@link CorrodeBase#streamBuffer} the job will wait for enough
     * data. If this data won't come the job gets aborted and corrode ends.
     * If you want to skip a negative amount of bytes you have to disable auto-flushing.
     * this can be done by setting {@link CorrodeBase#isSeeking} to `true`.
     * @param {number} length how many bytes to skip
     * @return {CorrodeBase} this
     */
    skip(length){
        return this._pushJob({
            type: 'skip',
            length
        });
    }

    /**
     * push a pop-job onto the job-array
     * the pop-job pops a layer from {@link CorrodeBase#varStack}.
     * this most probably doesn't have to get called manually, as
     * {@link CorrodeBase#tap} and {@link CorrodeBase#loop} will do this automatically
     * @return {CorrodeBase} this
     */
    pop(){
        return this._pushJob({
            type: 'pop'
        });
    }

    /**
     * push a push-job onto the job-array
     * the push-job pushes a new layer onto {@link CorrodeBase#varStack}.
     * this most probably doesn't have to get called manually, as
     * {@link CorrodeBase#tap} and {@link CorrodeBase#loop} will do this automatically
     * @param {string} name name of the new layer
     * @param {*} [value={}] value of the new layer (default is from {@link VariableStack})
     * @return {CorrodeBase} this
     */
    push(name, value){
        return this._pushJob({
            type: 'push',
            name,
            value
        });
    }

    /**
     * pushes a buffer-job onto the job-array
     * the buffer-job will read a buffer with the given length starting at the
     * current offset {@link CorrodeBase#bufferOffset}
     * @param {string} name name of the buffer-variable
     * @param {number} length length of the buffer in bytes
     * @return {CorrodeBase} this
     */
    buffer(name, length){
        return this._pushJob({
            name,
            type: 'buffer',
            length
        });
    }

    /**
     * pushes a string-job onto the job-array
     * the string-job will read a string with the given length starting at the
     * current offset {@link CorrodeBase#bufferOffset}
     * @param {string} name name of the string-variable
     * @param {number} length length of the string in bytes (_not characters_)
     * @param {string} [encoding=CorrodeBase#options.encoding] encoding encoding used to decode the string, defaults to 'utf8'.
     *                 available encodings can be found here https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings
     * @return {CorrodeBase} this
     */
    string(name, length, encoding = this.options.encoding){
        return this._pushJob({
            name,
            type: 'string',
            length,
            encoding
        });
    }

    /**
     * push a int8 (signed) job onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int8(name){ return this._pushJob(name, 'int8', 1, this.options.endianness); }

    /**
     * push a int8 (signed) job onto the job-array
     * @deprecated int8 needs no endianness, use int8() instead
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int8le(name){ return this._pushJob(name, 'int8', 1, LITTLE_ENDIAN); }

    /**
     * push a int8 (signed) job onto the job-array
     * @deprecated int8 needs no endianness, use int8() instead
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int8be(name){ return this._pushJob(name, 'int8', 1, BIG_ENDIAN); }

    /**
     * push a uint8 (unsigned) job onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint8(name){ return this._pushJob(name, 'uint8', 1, this.options.endianness); }

    /**
     * push a uint8 (unsigned) job onto the job-array
     * @deprecated uint8 needs no endianness, use uint8() instead
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint8le(name){ return this._pushJob(name, 'uint8', 1, LITTLE_ENDIAN); }

    /**
     * push a uint8 (unsigned) job onto the job-array
     * @deprecated uint8 needs no endianness, use uint8() instead
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint8be(name){ return this._pushJob(name, 'uint8', 1, BIG_ENDIAN); }


    /**
     * push a int16 (signed) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int16(name){ return this._pushJob(name, 'int16', 2, this.options.endianness); }

    /**
     * push a int16 (signed) job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int16le(name){ return this._pushJob(name, 'int16', 2, LITTLE_ENDIAN); }

    /**
     * push a int16 (signed) job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int16be(name){ return this._pushJob(name, 'int16', 2, BIG_ENDIAN); }

    /**
     * push a uint16 (unsigned) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint16(name){ return this._pushJob(name, 'uint16', 2, this.options.endianness); }

    /**
     * push a uint16 (unsigned) job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint16le(name){ return this._pushJob(name, 'uint16', 2, LITTLE_ENDIAN); }

    /**
     * push a uint16 (unsigned) job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint16be(name){ return this._pushJob(name, 'uint16', 2, BIG_ENDIAN); }


    /**
     * push a int32 (signed) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int32(name){ return this._pushJob(name, 'int32', 4, this.options.endianness); }

    /**
     * push a int32 (signed) job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int32le(name){ return this._pushJob(name, 'int32', 4, LITTLE_ENDIAN); }

    /**
     * push a int32 (signed) job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int32be(name){ return this._pushJob(name, 'int32', 4, BIG_ENDIAN); }

    /**
     * push a uint32 (unsigned) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint32(name){ return this._pushJob(name, 'uint32', 4, this.options.endianness); }

    /**
     * push a uint32 (unsigned) job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint32le(name){ return this._pushJob(name, 'uint32', 4, LITTLE_ENDIAN); }

    /**
     * push a uint32 (unsigned) job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint32be(name){ return this._pushJob(name, 'uint32', 4, BIG_ENDIAN); }


    /**
     * push a int64 (signed) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int64(name){ return this._pushJob(name, 'int64', 8, this.options.endianness); }

    /**
     * push a int64 (signed) job with little endianness onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int64le(name){ return this._pushJob(name, 'int64', 8, LITTLE_ENDIAN); }

    /**
     * push a int64 (signed) job with big endianness onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    int64be(name){ return this._pushJob(name, 'int64', 8, BIG_ENDIAN); }

    /**
     * push a uint64 (unsigned) job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint64(name){ return this._pushJob(name, 'uint64', 8, this.options.endianness); }

    /**
     * push a uint64 (unsigned) job with little endianness onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint64le(name){ return this._pushJob(name, 'uint64', 8, LITTLE_ENDIAN); }

    /**
     * push a uint64 (unsigned) job with big endianness onto the job-array
     * note that in64 may be unprecise, due to number-values being double in js
     * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    uint64be(name){ return this._pushJob(name, 'uint64', 8, BIG_ENDIAN); }


    /**
     * push a float job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    float(name){ return this._pushJob(name, 'float', 4, this.options.endianness); }

    /**
     * push a float job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    floatle(name){ return this._pushJob(name, 'float', 4, LITTLE_ENDIAN); }

    /**
     * push a float job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    floatbe(name){ return this._pushJob(name, 'float', 4, BIG_ENDIAN); }


    /**
     * push a double job with default endianness ({@link CorrodeBase#options.endianness}) onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    double(name){return this._pushJob(name, 'double', 8, this.options.endianness); }

    /**
     * push a double job with little endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    doublele(name){return this._pushJob(name, 'double', 8, LITTLE_ENDIAN); }

    /**
     * push a double job with big endianness onto the job-array
     * @param {string} name name of the variable to be created
     * @return {CorrodeBase} this
     */
    doublebe(name){return this._pushJob(name, 'double', 8, BIG_ENDIAN); }
}
