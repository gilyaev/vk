var VK       = require('vksdk'),
	util     = require('util'),
	through2 = require("through2"),
	VKGroups = require('./groups'),
	split    = require('split');


module.exports = VKTools;
util.inherits(VKTools, VK);

function VKTools(options) {
	options = options || {};
	VK.call(this, options);
	if(options.hasOwnProperty('token')) {
		this.setToken(options.token);
		this.setSecureRequests(true);
	}
}

VKTools.prototype.groups = function() {
	return new VKGroups(this);
}

VKTools.prototype.command = function(name, args) {
	var Command;
	var argv = require('yargs')
		.usage('Usage: $0 <command>')
		.command('gmfilter', 'Get filtered group members')
		.command('msub', 'Get information of new subscribers')
		.command('ganalitycs', 'Analize vk group')
		.command('wgrabber', 'Pick up all the posts from the wall')
		.demand(1)
		.argv;
	var name = argv._[0];

	try {
		Command = require('./commands/' + name);
	} catch(e) {
		return console.log('command ' + name + ' not found');
	}

	command = new Command(this);
	command.run();
}

VKTools.prototype.filter = function(fn) {
	return through2.obj(function(chunk, enc, done) {
		if (fn(chunk)) {
			this.push(chunk);
		}
		done();
	});
}

VKTools.prototype.count =  function(fn) {
	var count = 0;
	return through2.obj(function(chunk, enc, done) {
		++count;
		done();
	}, function(done) {
		this.push(count);
		done();
	});
}

VKTools.prototype.split = function() {
	var parser = function(row) {
		if (row.length) {
			return JSON.parse(row);
		}
		return void 0;
	}
	return split(parser);
}

VKTools.prototype.request = function(method, params, cb) {
	var self = this;
	VKTools.super_.prototype.request.call(this, method, params, function(responseObj) {
		responseObj = responseObj.response != void 0 ? responseObj.response : responseObj;
		return cb(responseObj);
	});
}