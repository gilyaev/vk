var util     = require('util');
var Readable = require('stream').Readable;

module.exports = ReadableStream;

function ReadableStream(readFunction, options) {
	options = options || {};
	this.readFunction = readFunction;
	Readable.call(this, options);
}

util.inherits(ReadableStream, Readable);

ReadableStream.prototype._read = function(n) {
	this.readFunction.call(this, n);
}

