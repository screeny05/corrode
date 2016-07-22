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

module.exports.eqArray = function(arr, obj){
    let arrMiddle = Math.floor(arr.length / 2);
    let arrFirst = arr.slice(0, arrMiddle);
    let arrSecond = arr.slice(arrMiddle);
    this.base.write(Buffer.from(arrFirst));
    this.base.end(Buffer.from(arrSecond));
    this.base.on('finish', () => {
        if(typeof obj === 'function'){
            return obj(this.base.vars);
        }
        expect(this.base.vars).to.deep.equal(obj);
    });
};
