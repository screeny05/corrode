require('buffer-safe');
const fs = require('fs');
const { expect } = require('chai');

/**
 * parse a file and compare the result against a provided fixture
 * @param  {string}   file file-path
 * @param  {Function} done mocha-callback
 * @param  {object}   obj  expected result
 * @throws {Error} assertion error
 */
module.exports.eqFile = function(file, done, obj){
    fs.createReadStream(__dirname + '/../fixtures/' + file)
        .pipe(this.base)
        .on('finish', () => {
            if(typeof obj === 'function'){
                obj.call(this, this.base.vars);
            } else {
                expect(this.base.vars).to.deep.equal(obj);
            }
            done();
        });
};

/**
 * parse an array and compare the result against a provided fixture
 * @param  {Array}    arr array getting converted to buffer and fed to corrode
 * @param  {Function} done mocha-callback
 * @param  {object}   obj  expected result
 * @throws {Error} assertion error
 */
module.exports.eqArray = function(arr, done, obj){
    let arrMiddle = Math.floor(arr.length / 2);
    let arrFirst = arr.slice(0, arrMiddle);
    let arrSecond = arr.slice(arrMiddle);
    let arrData = [arrFirst, arrSecond];

    // uncomment this line to create a new buffer for each byte (may be overkill)
    //arrData = arr.map(val => [val]);
    module.exports.eqMultiArray.call(this, arrData, done, obj);
};


/**
 * parse an array of arrays and compare the result against a provided fixture
 * @param  {Array<Array>} arr array getting converted to buffer and fed to corrode
 * @param  {Function}     done mocha-callback
 * @param  {object}       obj  expected result
 * @throws {Error} assertion error
 */
module.exports.eqMultiArray = function(arrs, done, obj){
    // i sometimes forget to do this
    if(typeof done !== 'function'){
        throw new Error('done not given');
    }

    arrs.forEach(arr => this.base.write(Buffer.from(arr)));
    this.base.end();
    this.base.on('finish', () => {
        if(typeof obj === 'function'){
            obj(this.base.vars);
            return done();
        }
        expect(this.base.vars).to.deep.equal(obj);
        done();
    });
};
