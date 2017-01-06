# Getting started

## Introduction
This document will guide you through most of the basic functionality of corrode by example.
Our goal is to parse a structured file for storing flat, arbitrary data.


## Data Structure
This will be the structure we are going to parse:

* Container - Little endian
    * Header
        * Magic Number [uint32 0xDEADBEEF]
        * File version
            * major[uint32]
            * minor[uint32]
        * File creation date[uint32 timestamp]
        * Data count[uint32]
    * Data Index (array)
        * Name[string<utf8>, terminated by 0x00]
        * Offset[uint32]
        * Length[uint32]
        * Flags[uint8]
            * Compression[0x80]
            * Encryption[0x40]
            * Read only[0x20]
        * Checksum [Buffer<32>]
    * Data (array)
        * Data[buffer<Length>]


## How we'll do this

To better structure our code, we will split it into three main parsers: Header, Index, Data.

For cases like this, there's `Corrode.addExtension`, which is let's us break down big pieces of code.

Apart from this function and the basic read-structures there are also assertions and mappers.

Assertions allow us to test the parsed data on whether or not it matches certain requirements. This helps in making sure, that the data we parse aligns with our specification. When an assertion is not met, corrode will throw an `Error` and halt execution.

Mappers provide us with a way to transform read data into something different, or mapping certain values to other ones.

The Header-parser will show you the basics of their usage.


## Let's get started

### The header parser
```javascript
/**
 * reads header data from our own specified format
 * @throws Error magic number doesn't match
 * @return {Object} header-data
 * @example
 * {
 *   magic: 0xDEADBEEF,
 *   version: { major: uint32, minor: uint32 },
 *   timestamp: Date,
 *   dataCount: uint32
 * }
 */
Corrode.addExtension('containerHeader', function containerHeaderParser(){
    this
        // read the magic number and compare it against a fixed value
        .uint32('magic')
        .assert.equal('magic', 0xDEADBEEF)

        // tap creates a new named object (version), into which we can write data
        // also it allows us to acces data, read up to this point of parsing
        .tap('version', function(){
            this
                .uint32('major')
                .uint32('minor');
        })

        // read the timestamp and convert it into a native Date object via a custom mapper
        .uint32('timestamp')
        .map.callback('timestamp' t => new Date(t))

        .uint32('dataCount');
});
```

This is all we need for parsing any header of this structure. See how this assert makes sure we have the correct file? And how we're able to convert an uint32 into a native js Date object? This is how we roll.


### The index parser
Let's spice things up a bit, by creating our index parser. It needs access to the parsed data of the header, because there's the data-count of the whole file.

Also, instead of just one we will create two extensions for parsing the index:
* One that parses the index itself
* Another one that parses each index-entry

#### The index entry parser
```javascript
/**
 * reads the data of an index-entry
 * @return {Object} index-entry
 * @example
 * {
 *   name: string,
 *   offset: uint32,
 *   length: uint32,
 *   flags: { isCompressed: bool, isEncrypted: bool, isReadOnly: bool },
 *   checksum: Buffer<32>
 * }
 */
Corrode.addExtension('containerIndexEntry', function containerIndexEntryParser(){
    this
        // parse a string terminated by 0x00 (default)
        .terminatedString('name')

        .uint32('offset')
        .uint32('length')

        // read the bits for the flags and parse them with bitwise opearators
        .uint8('flags')
        .map.callback('flags', bits => ({
            isCompressed: (bits & 0x80) === 0x80,
            isEncrypted: (bits & 0x40) === 0x40,
            isReadOnly: (bits & 0x20) === 0x20
        }))

        // we'll check this later, when parsing the data
        .buffer('checksum', 32);
});
```

#### The index parser itself
```javascript
/**
 * reads the data of the container-index
 * @param {Object<containerHeader>} header parsed header-data of the container-file
 * @return {Array<containerIndexEntry>} index
 */
Corrode.addExtension('containerIndex', function containerIndexParser(header){
    this
        .repeat('entries', header.dataCount, function(){
            this
                // call our indexEntry-extension and push the result into the
                // entries-array created by Corrode#repeat
                .ext.containerIndexEntry('entry')
                .map.push('entry');
        })

        // the push function replaces the current value in `this.vars` with the
        // one found under the given name. This way we're able to return an array
        // of entries here, instead of an object like this { entries: [...] }
        .map.push('entries');
});
```

As you can see, this is a rather simple extension. It executes the containerIndexEntry parser as many times as the header says there are files in the container. The `repeat`-function creates a new array in the current variable-layer (@TODO see Overview).

By using the `map.push`-function we replace the current variable-layer with our own value. So instead of returning an object containing an array of objects containing the data, we just get an array of index-entries.


### The data parser
We will also split the data-parser into two. Again there will be a parser for the entries and one for the data itself.

We don't do this because of technical limitations, but because i like to have clean and separate functions for everything. If you want to, you can still smooch the entry-parser into into the repeat.

#### The data-entry parser
```javascript
/**
 * reads the data of a data-entry
 * @throws Error callback doesn't match
 * @param {Object<containerIndexEntry>} indexEntry
 * @return {Buffer} data
 */
Corrode.addExtension('containerDataEntry', function containerDataEntryParser(indexEntry){
    this
        // jump to the offset of the entry
        .position(index.offset)

        // get buffer (it's a slice, not a copy)
        .buffer('data', index.length)

        // check, that the checksum of the data matches the one given
        .assert.callback('data', data => someChecksumFunction(data) === index.checksum, 'checksum')

        // only return the buffer
        .map.push('data');
});
```
Note that the position-function works in a slightly restricted way, in that it only allows skipping forward without any additional configuration. @TODO See `Corrode#isSeeking` for more info.

In the way there's a `map.callback` there's also a `assert.callback` taking a function by which it checks the incoming value.

#### The data parser itself
```javascript
/**
 * read container data
 * @param {Object<containerIndex>} index
 * @return {Array<containerDataEntry>} container-data
 */
Corrode.addExtension('containerData', function containerDataParser(index){
    this
        .repeat('entries', index.length, function(end, discard, i){
            const indexEntry = index[i];

            this
                .ext.containerDataEntry('entryData', indexEntry)
                .tap(function(){
                    const data = this.vars.entryData;
                    this.vars = indexEntry;

                    if(this.vars.flags.)
                    this.vars.data = data;
                });
        })
        .map.push('entries');
});
```


### Wiring everything together
```javascript
Corrode.addExtension('container', function containerParser(){
    this
        .ext.containerHeader('header')
        .tap(function(){
            this
                .ext.containerIndex('index', this.vars.header)
                .tap(function(){
                    this.ext.containerData('data', this.vars.index);
                });
        })
        .map.push('data');
});
```

## Parsing a file
```javascript
const parser = new Corrode();
parser
    .ext.container('container')
    .map.push('container');

const fstream = fs.createReadStream('./container');
fstream.pipe(parser);

parser.on('finish', () => {
    console.log(parser.vars);
});
```


## Escaping callback-hell
```javascript
Corrode.addExtension('containerIndex', function containerIndexParser(header){
    if(typeof header === 'string'){
        header = this.vars[header];
    }

    ...
});
```

```javascript
Corrode.addExtension('container', function containerParser(){
    this
        .ext.containerHeader('header')
        .ext.containerIndex('index', 'header')
        .ext.containerData('data', 'index')
        .map.push('data');
});
```

## Further reading
* Configuration
* Examples
