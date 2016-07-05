'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _class, _temp;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var VariableStack = require('./variable-stack');
var BufferList = require('bl');

var _require = require('readable-stream');

var Transform = _require.Transform;


module.exports = (_temp = _class = function (_Transform) {
    _inherits(CorrodeBase, _Transform);

    _createClass(CorrodeBase, [{
        key: 'vars',
        get: function get() {
            return this.varStack.value;
        },
        set: function set(val) {
            this.varStack.value = val;
        }
    }]);

    function CorrodeBase(options) {
        _classCallCheck(this, CorrodeBase);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CorrodeBase).call(this, _extends({}, options, { objectMode: true, encoding: null })));

        _this.jobs = [];
        _this.varStack = new VariableStack();
        _this.buffer = new BufferList();
        _this.streamOffset = 0;
        _this.chunkOffset = 0;
        _this.isUnwinding = false;


        _this.options = _extends({}, CorrodeBase.defaults, options);

        if (_this.options.finishJobsOnEOF) {
            _this.on('finish', _this.finishRemainingJobs.bind(_this));
        }
        return _this;
    }

    _createClass(CorrodeBase, [{
        key: '_transform',
        value: function _transform(chunk, encoding, done) {
            this.chunkOffset = 0;

            this.buffer.append(chunk);

            this.jobLoop();

            _get(Object.getPrototypeOf(CorrodeBase.prototype), 'push', this).call(this, null);
            this.buffer.consume(this.chunkOffset);
            return done();
        }
    }, {
        key: 'jobLoop',
        value: function jobLoop() {
            var _this2 = this;

            var _loop = function _loop() {
                var job = _this2.jobs[0];

                if (job.type === 'push') {
                    _this2.jobs.shift();
                    _this2.varStack.push(job.name, job.value);
                    return 'continue';
                } else if (job.type === 'pop') {
                    _this2.jobs.shift();
                    _this2.varStack.pop();
                    return 'continue';
                } else if (job.type === 'tap') {
                    _this2.jobs.shift();

                    var unqueue = _this2.queueJobs();

                    // if the tap has a name, we push a new var-layer
                    if (job.name) {
                        _this2.push(job.name).tap(job.callback, job.args).pop();
                    } else {
                        job.callback.apply(_this2, job.args);
                    }

                    unqueue();
                    return 'continue';
                } else if (job.type === 'loop') {
                    if (job.finished) {
                        _this2.jobs.shift();
                        return 'continue';
                    }

                    var _unqueue = _this2.queueJobs();

                    if (job.name) {
                        if (!_this2.vars[job.name]) {
                            _this2.vars[job.name] = [];
                        }

                        _this2.tap(_this2.options.loopVarName, job.callback, [job.finish, job.discard]).tap(function () {
                            if (!job.discarded) {
                                this.vars[job.name].push(this.vars[this.options.loopVarName]);
                            }
                            job.discarded = false;
                            delete this.vars[this.options.loopVarName];
                        });
                    } else {
                        _this2.tap(job.callback, [job.finish, job.discard]);
                    }

                    _unqueue();
                    return 'continue';
                }

                // determine length of next job
                var length = void 0;
                if (typeof job.length === 'string') {
                    length = _this2.vars[job.length];
                } else {
                    length = job.length;
                }

                var remainingBuffer = _this2.buffer.length - _this2.chunkOffset;

                if (_this2.options.wrapOnEOC && remainingBuffer > 0 && remainingBuffer <= length && (job.type === 'blob' || job.type === 'string')) {
                    length = remainingBuffer;
                }

                // break on end of buffer (wait if we're not unwinding yet)
                if (_this2.buffer.length - _this2.chunkOffset < length) {

                    if (_this2.isUnwinding && _this2.jobs.length > 0) {
                        console.log('isUnwinding & bufferend');
                        // unwind loop, by removing the loop job
                        _this2.filterNonReadJobs();
                        return 'continue';
                    }
                    return 'break';
                }

                if (job.type === 'blob') {
                    _this2.jobs.shift();
                    _this2.vars[job.name] = _this2.buffer.slice(_this2.chunkOffset, _this2.chunkOffset + length);
                    _this2.moveOffset(length);
                    return 'continue';
                } else if (job.type === 'string') {
                    _this2.jobs.shift();
                    _this2.vars[job.name] = _this2.buffer.toString(job.encoding, _this2.chunkOffset, _this2.chunkOffset + length);
                    _this2.moveOffset(length);
                    return 'continue';
                } else if (job.type === 'skip') {
                    _this2.jobs.shift();
                    _this2.moveOffset(length);
                    return 'continue';
                } else {
                    switch (job.type) {
                        case "int8le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt8(_this2.chunkOffset);break;
                            }
                        case "int8be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt8(_this2.chunkOffset);break;
                            }
                        case "uint8le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt8(_this2.chunkOffset);break;
                            }
                        case "uint8be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt8(_this2.chunkOffset);break;
                            }

                        case "int16le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt16LE(_this2.chunkOffset);break;
                            }
                        case "int16be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt16BE(_this2.chunkOffset);break;
                            }
                        case "uint16le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt16LE(_this2.chunkOffset);break;
                            }
                        case "uint16be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt16BE(_this2.chunkOffset);break;
                            }

                        case "int32le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt32LE(_this2.chunkOffset);break;
                            }
                        case "int32be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readInt32BE(_this2.chunkOffset);break;
                            }
                        case "uint32le":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt32LE(_this2.chunkOffset);break;
                            }
                        case "uint32be":
                            {
                                _this2.vars[job.name] = _this2.buffer.readUInt32BE(_this2.chunkOffset);break;
                            }

                        case "int64le":
                            {
                                _this2.vars[job.name] = Math.pow(2, 32) * _this2.buffer.readInt32LE(_this2.chunkOffset + 4) + (_this2.buffer[_this2.chunkOffset + 4] & 0x80 === 0x80 ? 1 : -1) * _this2.buffer.readUInt32LE(_this2.chunkOffset);break;
                            }
                        case "int64be":
                            {
                                _this2.vars[job.name] = Math.pow(2, 32) * _this2.buffer.readInt32BE(_this2.chunkOffset) + (_this2.buffer[_this2.chunkOffset] & 0x80 === 0x80 ? 1 : -1) * _this2.buffer.readUInt32BE(_this2.chunkOffset + 4);break;
                            }
                        case "uint64le":
                            {
                                _this2.vars[job.name] = Math.pow(2, 32) * _this2.buffer.readUInt32LE(_this2.chunkOffset + 4) + _this2.buffer.readUInt32LE(_this2.chunkOffset);break;
                            }
                        case "uint64be":
                            {
                                _this2.vars[job.name] = Math.pow(2, 32) * _this2.buffer.readUInt32BE(_this2.chunkOffset) + _this2.buffer.readUInt32BE(_this2.chunkOffset + 4);break;
                            }

                        case "floatle":
                            {
                                _this2.vars[job.name] = _this2.buffer.readFloatLE(_this2.chunkOffset);break;
                            }
                        case "floatbe":
                            {
                                _this2.vars[job.name] = _this2.buffer.readFloatBE(_this2.chunkOffset);break;
                            }

                        case "doublele":
                            {
                                _this2.vars[job.name] = _this2.buffer.readDoubleLE(_this2.chunkOffset);break;
                            }
                        case "doublebe":
                            {
                                _this2.vars[job.name] = _this2.buffer.readDoubleBE(_this2.chunkOffset);break;
                            }
                        default:
                            {
                                return {
                                    v: done(new Error('invalid job type ' + job.type))
                                };
                            }
                    }

                    _this2.jobs.shift();
                    _this2.moveOffset(length);
                }
            };

            _loop2: while (this.jobs.length > 0) {
                var _ret = _loop();

                switch (_ret) {
                    case 'continue':
                        continue;

                    case 'break':
                        break _loop2;

                    default:
                        if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                }
            }
        }
    }, {
        key: 'finishRemainingJobs',
        value: function finishRemainingJobs() {
            this.isUnwinding = true;
            this.filterNonReadJobs();
            this.jobLoop();
        }

        /**
         * purges all jobs from the job-queue, which need to read from the stream
         */

    }, {
        key: 'filterNonReadJobs',
        value: function filterNonReadJobs() {
            var _jobs;

            var filteredJobs = this.jobs.slice().filter(function (job) {
                return job.type === 'pop' || job.type === 'tap' && !job.name;
            });

            this.jobs.splice(0);
            (_jobs = this.jobs).push.apply(_jobs, _toConsumableArray(filteredJobs));
        }
    }, {
        key: 'moveOffset',
        value: function moveOffset(by) {
            this.chunkOffset += by;
            this.streamOffset += by;
        }
    }, {
        key: 'pushJob',
        value: function pushJob(name, type, length, options) {
            this.jobs.push(_extends({ name: name, type: type, length: length }, options));
            return this;
        }
    }, {
        key: 'queueJobs',
        value: function queueJobs() {
            var _this3 = this;

            var queuedJobs = this.jobs.slice();
            // empty jobs
            this.jobs.splice(0);

            // unqueue-method
            return function () {
                var _jobs2;

                return (_jobs2 = _this3.jobs).push.apply(_jobs2, _toConsumableArray(queuedJobs));
            };
        }
    }, {
        key: 'tap',
        value: function tap(name, callback, args) {
            if (typeof name === 'function') {
                args = callback;
                callback = name;
                name = undefined;
            }

            this.jobs.push({
                name: name,
                type: 'tap',
                args: args,
                callback: callback
            });
            return this;
        }
    }, {
        key: 'loop',
        value: function loop(name, callback) {
            if (typeof name === 'function') {
                callback = name;
                name = undefined;
            }

            var loopJob = {
                name: name,
                type: 'loop',
                callback: callback,
                finished: false,
                discarded: false
            };

            loopJob.finish = function (discard) {
                loopJob.finished = true;
                loopJob.discarded = !!discard;
            };

            loopJob.discard = function () {
                loopJob.discarded = true;
            };

            this.jobs.push(loopJob);
            return this;
        }
    }, {
        key: 'skip',
        value: function skip(length) {
            this.jobs.push({
                type: 'skip',
                length: length
            });
            return this;
        }
    }, {
        key: 'pop',
        value: function pop() {
            this.jobs.push({
                type: 'pop'
            });
            return this;
        }
    }, {
        key: 'push',
        value: function push(name, value) {
            this.jobs.push({
                type: 'push',
                name: name,
                value: value
            });
            return this;
        }
    }, {
        key: 'blob',
        value: function blob(name, length) {
            return this.pushJob(name, 'blob', length);
        }
    }, {
        key: 'string',
        value: function string(name, length) {
            var encoding = arguments.length <= 2 || arguments[2] === undefined ? this.options.encoding : arguments[2];
            return this.pushJob(name, 'string', length, { encoding: encoding });
        }
    }, {
        key: 'int8',
        value: function int8(name) {
            return this.pushJob(name, 'int8' + this.options.endianness, 1);
        }
    }, {
        key: 'int8le',
        value: function int8le(name) {
            return this.pushJob(name, 'int8le', 1);
        }
    }, {
        key: 'int8be',
        value: function int8be(name) {
            return this.pushJob(name, 'int8be', 1);
        }
    }, {
        key: 'uint8',
        value: function uint8(name) {
            return this.pushJob(name, 'uint8' + this.options.endianness, 1);
        }
    }, {
        key: 'uint8le',
        value: function uint8le(name) {
            return this.pushJob(name, 'uint8le', 1);
        }
    }, {
        key: 'uint8be',
        value: function uint8be(name) {
            return this.pushJob(name, 'uint8be', 1);
        }
    }, {
        key: 'int16',
        value: function int16(name) {
            return this.pushJob(name, 'int16' + this.options.endianness, 2);
        }
    }, {
        key: 'int16le',
        value: function int16le(name) {
            return this.pushJob(name, 'int16le', 2);
        }
    }, {
        key: 'int16be',
        value: function int16be(name) {
            return this.pushJob(name, 'int16be', 2);
        }
    }, {
        key: 'uint16',
        value: function uint16(name) {
            return this.pushJob(name, 'uint16' + this.options.endianness, 2);
        }
    }, {
        key: 'uint16le',
        value: function uint16le(name) {
            return this.pushJob(name, 'uint16le', 2);
        }
    }, {
        key: 'uint16be',
        value: function uint16be(name) {
            return this.pushJob(name, 'uint16be', 2);
        }
    }, {
        key: 'int32',
        value: function int32(name) {
            return this.pushJob(name, 'int32' + this.options.endianness, 4);
        }
    }, {
        key: 'int32le',
        value: function int32le(name) {
            return this.pushJob(name, 'int32le', 4);
        }
    }, {
        key: 'int32be',
        value: function int32be(name) {
            return this.pushJob(name, 'int32be', 4);
        }
    }, {
        key: 'uint32',
        value: function uint32(name) {
            return this.pushJob(name, 'uint32' + this.options.endianness, 4);
        }
    }, {
        key: 'uint32le',
        value: function uint32le(name) {
            return this.pushJob(name, 'uint32le', 4);
        }
    }, {
        key: 'uint32be',
        value: function uint32be(name) {
            return this.pushJob(name, 'uint32be', 4);
        }
    }, {
        key: 'int64',
        value: function int64(name) {
            return this.pushJob(name, 'int64' + this.options.endianness, 8);
        }
    }, {
        key: 'int64le',
        value: function int64le(name) {
            return this.pushJob(name, 'int64le', 8);
        }
    }, {
        key: 'int64be',
        value: function int64be(name) {
            return this.pushJob(name, 'int64be', 8);
        }
    }, {
        key: 'uint64',
        value: function uint64(name) {
            return this.pushJob(name, 'uint64' + this.options.endianness, 8);
        }
    }, {
        key: 'uint64le',
        value: function uint64le(name) {
            return this.pushJob(name, 'uint64le', 8);
        }
    }, {
        key: 'uint64be',
        value: function uint64be(name) {
            return this.pushJob(name, 'uint64be', 8);
        }
    }, {
        key: 'float',
        value: function float(name) {
            return this.pushJob(name, 'float' + this.options.endianness, 4);
        }
    }, {
        key: 'floatle',
        value: function floatle(name) {
            return this.pushJob(name, 'floatle', 4);
        }
    }, {
        key: 'floatbe',
        value: function floatbe(name) {
            return this.pushJob(name, 'floatbe', 4);
        }
    }, {
        key: 'double',
        value: function double(name) {
            return this.pushJob(name, 'double' + this.options.endianness, 8);
        }
    }, {
        key: 'doublele',
        value: function doublele(name) {
            return this.pushJob(name, 'doublele', 8);
        }
    }, {
        key: 'doublebe',
        value: function doublebe(name) {
            return this.pushJob(name, 'doublebe', 8);
        }
    }]);

    return CorrodeBase;
}(Transform), _class.defaults = {
    endianness: 'le',
    loopVarName: '__loop_tmp',
    encoding: 'utf8',
    wrapOnEOC: false,
    finishJobsOnEOF: true
}, _temp);
//# sourceMappingURL=base.js.map