<p align="center">
  <img src="https://cdn.rawgit.com/screeny05/corrode/master/corrode.svg?raw=true" alt="∆ corrode" width="330"/>
</p>
---

[![MIT license](https://img.shields.io/npm/l/corrode.svg?style=flat-square)](./LICENSE)
[![NPM version](https://img.shields.io/npm/v/corrode.svg?style=flat-square)](https://www.npmjs.com/package/corrode)
[![dependencies](https://img.shields.io/david/screeny05/corrode.svg?style=flat-square)](https://david-dm.org/screeny05/corrode)
[![coverage](https://img.shields.io/coveralls/screeny05/corrode.svg?style=flat-square)](https://coveralls.io/github/screeny05/corrode)
[![build status](https://img.shields.io/travis/screeny05/corrode.svg?style=flat-square)](https://travis-ci.org/screeny05/corrode)
[![docs](https://doc.esdoc.org/github.com/screeny05/corrode/badge.svg)](https://doc.esdoc.org/github.com/screeny05/corrode/)

Corrode is a batteries-included library for reading binary data. It helps you converting that blob-mess into useable data.

Use it to parse _that one_ obscure binary-file with the help of JavaScript.

#### Install
```
$ npm install --save corrode
```

#### Tests
```
$ npm test
```

#### Offline Docs
```
$ npm run docs
$ open doc/index.html
```


## What's this?
corrode provides standard read-actions like uint8-uint64 for big & little endian, strings, buffers and control-structures like loops, skipping, etc. for your buffers and files.
Additionally you can use assertions to always be sure, the data you parse corresponds to a specified format.
The parsing is done not by a configuration-object, but by imperative code, allowing for far greater flexibility.

corrode is an abstraction on top of `TransformStream` and as such is pipeable to but also provides functions for more simple usage.

This library is not only heavily inspired by [dissolve](https://github.com/deoxxa/dissolve), it in fact can be seen as a total rewrite with even more features.
The code is written in ES7, fully documented and tested.


## Quick examples
```javascript
const Corrode = require('corrode');
const parser = new Corrode();

parser
    .uint8('val_1')
    .uint32('val_2')
    .int16be('val_3')
    .tap(function(){
        console.log(this.vars.val_1 * this.vars.val_3);
    })
    .repeat('array', 5, function(){
        this
            .uint32('array_val_1')
            .string('array_val_4', 5);
    });
```

#### Parse a buffer
```javascript
parser.fromBuffer(buffer, () => console.log(parser.vars));
```

#### Parse a filestream
```javascript
var stream = fs.createReadStream(file);
stream.pipe(parser);
parser.on('finish', () => console.log(parser.vars));
```

These are just some of the very basic operations supported by Corrode.


## Examples
All examples can be found in the examples/-folder. Included:
* ID3v2.3-Parser - strict, unforgiving parser for a subset of the standard used to store meta-data in mp3-files. It needs `npm i image-to-ascii temp` and can be run with `node examples/id3 test.mp3`.

If you'd like to include your own examples, just open a PR. I'm more than happy to not have to think about existing complex structured binary data to parse myself.


## Documentation & API Reference
* [Corrode Overview](https://doc.esdoc.org/github.com/screeny05/corrode/manual/overview.html)
* [API Reference](https://doc.esdoc.org/github.com/screeny05/corrode/identifiers.html)
* [Getting Started](https://doc.esdoc.org/github.com/screeny05/corrode/manual/tutorial.html)


## Why use corrode over dissolve
It solves most of the major shortcomings dissolve has:
* EOF terminates corrode. If not explicitly asked not to do so it will give you all variables, without you having to fiddle with its intestines.
* Loops get unwinded correctly.
* Thoroughly tested.
* As a js-library from 2016 it has all the swag you need.


## When not to use corrode
* Your data is too complex - If you need to apply black magic on your data, to retrieve meaningful values, corrode currently may not support your use-case.
* Your data is really simple - If you don't need to read structured data, but instead just numbers or strings you should simply use the built-in read-functions provided by `Buffer`.

Not yet included are additions like bignum-support for int64 and additional non-node-standard-encodings.

corrode is currently not tested for use in browsers.


## Used dependencies (3)
The following dependencies are installed when installing corrode:
* bl - used for buffering data, in case a job gets greedy or you don't want to auto-flush
* readable-streams - ensures consistent and stable behaviour of the underlying Transform-Stream
* lodash - several utility functions


## License
This library is issued under the [MIT license](./LICENSE).

The Logo is from The Noun Project, created by [Michael Senkow](https://thenounproject.com/mhsenkow/) and licensed under the [CC-BY-3.0](https://creativecommons.org/licenses/by/3.0/us/).
