const fs = require('fs');
const path = require('path');

/* describe() for each file with the filename */
fs.readdirSync('test').filter(file => file !== path.parse(__filename).base && file !== '.DS_Store' && fs.lstatSync(__dirname + '/' + file).isFile()).forEach(function(file){
    describe(path.parse(file).name, require.bind(null, './' + file));
});
