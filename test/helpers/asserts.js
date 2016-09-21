require('buffer-safe');
const fs = require('fs');
const { expect } = require('chai');

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

module.exports.eqArray = function(arr, done, obj){
    let arrMiddle = Math.floor(arr.length / 2);
    let arrFirst = arr.slice(0, arrMiddle);
    let arrSecond = arr.slice(arrMiddle);
    let arrData = [arrFirst, arrSecond];

    arrData = arr.map(val => [val]);
    //module.exports.eqMultiArray.call(this, arrData, done, obj);
    module.exports.eqMultiArray.call(this, arrData, done, obj);
};

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
