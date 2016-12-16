let fs = require('fs'),
    readline = require('readline'),
    Promise = require('bluebird');

module.exports = new FileHelper;

function FileHelper() {
}

FileHelper.prototype.lineCount = (file) => {
    let count = 0;
    const rd  = readline.createInterface({
        input: fs.createReadStream(file),
        output: process.stdout,
        terminal: false
    });

    return new Promise((resolve, reject) => {
        rd.on('line', (line) => {
            count++;
        });

        rd.on('close', () => {
            resolve(count)
        });
    });
}