/**
 * The most harsh, incomplete and unforgiving ID3v2.3-Parser, ever.
 *
 * includes image-extraction!
 * `npm i temp image-to-asci`
 * to enable it
 */
const Corrode = require('../dist');
const fs = require('fs');
const path = require('path');

const FILE_PATH = process.argv[process.argv.length - 1];

const TAG_FLAG_UNSYNCHRONISATION = 0b10000000;
const TAG_FLAG_EXTENDED_HEADER   = 0b01000000;
const TAG_FLAG_EXPERIMENTAL      = 0b00100000;
const TAG_FLAG_INVALID           = 0b00011111;
const TAG_SIZE_INVALID           = 0b10000000;
const TAG_SIZE_VALID             = 0b01111111;

const FRAME_FLAG_TAG_ALTER_PRESERVE  = 0b1000000000000000;
const FRAME_FLAG_FILE_ALTER_PRESERVE = 0b0100000000000000;
const FRAME_FLAG_READ_ONLY           = 0b0010000000000000;
const FRAME_FLAG_COMPRESSION         = 0b0000000010000000;
const FRAME_FLAG_ENCRYPTION          = 0b0000000001000000;
const FRAME_FLAG_GROUPING_IDENTITY   = 0b0000000000100000;
const FRAME_FLAG_INVALID             = 0b0001111100011111;

const FRAME_TYPE_TEXT         = /^(T[0-9A-WYZ]{3}|W[0-9A-WYZ]{3}|IPLS)/;
const FRAME_TYPE_PICTURE      = /^APIC$/;
const FRAME_TYPE_EXPERIMENTAL = /^[XYZ]/;

Corrode.addExtension('flagField', function flagField(src, flagsInvalidBitmask, flagsMap){
    const bits = this.vars[src];
    const destFlags = {};
    if((bits & flagsInvalidBitmask) > 0){
        throw new TypeError('ID3 File contains invalid flag, aborting mission.');
    }


    Object
        .keys(flagsMap)
        .map(flagName => destFlags[flagName] = (bits & flagsMap[flagName]) === flagsMap[flagName]);

    return destFlags;
});

Corrode.addExtension('id3frameHeader', function id3frameHeader(){
    this
        .string('id', 4)
        .uint32be('size')
        .uint16('flagmask')
        .ext.flagField('flags', 'flagmask', FRAME_FLAG_INVALID, {
            tagAlterPreserve: FRAME_FLAG_TAG_ALTER_PRESERVE,
            fileAlterPreserve: FRAME_FLAG_FILE_ALTER_PRESERVE,
            readOnly: FRAME_FLAG_READ_ONLY,
            compression: FRAME_FLAG_COMPRESSION,
            encryption: FRAME_FLAG_ENCRYPTION,
            groupingIdentity: FRAME_FLAG_GROUPING_IDENTITY
        })
        .tap(function(){
            this.vars.isExperimental = this.vars.id.match(FRAME_TYPE_EXPERIMENTAL) !== null;
        });
});

Corrode.addExtension('id3frameContent', function id3frameContent(header){
    if(header.id.match(FRAME_TYPE_TEXT)){
        this.string('content', header.size).map.callback('content', val => val.replace(/\u0000/g, ''));
    } else if(header.id.match(FRAME_TYPE_PICTURE)){
        this.tap('content', function(){
            this
                .uint8('encoding')
                .terminatedString('mimeType')
                .uint8('pictureType')
                .terminatedString('description')
                .tap(function(){
                    var remainingSize = header.size - this.vars.mimeType.length - this.vars.description.length - 4;
                    this.buffer('data', remainingSize);
                });
        });
    } else {
        this.buffer('content', header.size);
    }

    this.map.push('content');
});

let id3Parser = new Corrode();

// header
id3Parser
    .string('tag', 3)
    .assert.equal('tag', 'ID3')
    .uint8('version')
    .uint8('revision')
    .assert.equal('version', 3)
    .uint8('flagmask')
    .ext.flagField('flags', 'flagmask', TAG_FLAG_INVALID, {
        unsynchronisation: TAG_FLAG_UNSYNCHRONISATION,
        extendedHeader: TAG_FLAG_EXTENDED_HEADER,
        experimental: TAG_FLAG_EXPERIMENTAL
    });

// get tag-size
id3Parser.tap('size', function(){
    this
        .uint8('size1')
        .uint8('size2')
        .uint8('size3')
        .uint8('size4')
        .assert.bitmask('size1', TAG_SIZE_INVALID, false)
        .assert.bitmask('size2', TAG_SIZE_INVALID, false)
        .assert.bitmask('size3', TAG_SIZE_INVALID, false)
        .assert.bitmask('size4', TAG_SIZE_INVALID, false)
        .tap(function(){
            const size1 = this.vars.size1 & TAG_SIZE_VALID;
            const size2 = this.vars.size2 & TAG_SIZE_VALID;
            const size3 = this.vars.size3 & TAG_SIZE_VALID;
            const size4 = this.vars.size4 & TAG_SIZE_VALID;
            this.vars = size4 | (size3 << 7) | (size2 << 14) | (size1 << 22);
        });
});

// extended header
id3Parser.tap(function(){
    if(this.vars.flags.extendedHeader){
        throw new TypeError('ID3 contains extended header. Not supported, aborting mission.');
    }
});

// frames
id3Parser.loop('frames', function(end, discard, i){
    this
        .ext.id3frameHeader('header')
        .tap(function(){
            if(this.vars.header.size === 0){
                return end(true);
            }

            this.ext.id3frameContent('content', this.vars.header);
        });
});

fs.createReadStream(FILE_PATH)
    .pipe(id3Parser)
    .on('finish', () => {
        let id3info = id3Parser.vars.frames
            .map(frame => `${frame.header.id}: ${typeof frame.content === 'string' ? frame.content : 'Buffer'}`)
            .join('\n');

        console.log(id3info);

        // try printing images
        id3Parser.vars.frames
            .filter(frame => typeof frame.content.pictureType !== 'undefined')
            .forEach(frame => {
                try {
                    var path = require('temp').path({ suffix: '.jpg' });
                    require('fs').writeFileSync(path, frame.content.data);
                    require('image-to-ascii')(path, { bg: true }, (err, conv) => console.log(err || conv));
                } catch(e){}
            });
    });
