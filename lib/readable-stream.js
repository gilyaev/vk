var util     = require('util');
var Readable = require('stream').Readable;


module.exports = ReadableStream;
util.inherits(ReadableStream, Readable);

function ReadableStream(readFunction, options) {
	options = options || {};
	this.readFunction = readFunction;
	Readable.call(this, options);
}

ReadableStream.prototype._read = function(n) {
	this.readFunction.call(this, n);
}

