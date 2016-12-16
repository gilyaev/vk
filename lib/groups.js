var readStream = require('./readable-stream'),
	VkWall = require('./wall'),
	_ = require('underscore');

module.exports = Groups;

function Groups(sdk) {
	this.sdk = sdk;
}

Groups.prototype.getMembers = function (id, options) {
	var self  = this,
		options = options || {},
		batchSize = options.hasOwnProperty('batchSize') ? options.batchSize : 1000,
		offset = options.hasOwnProperty('offset') ? options.offset : 0,
		fields = options.hasOwnProperty('fields') ? options.fields : '',
		isLast = false;

	return new readStream(function() {
		var stream = this;
		if (isLast) return this.push(null);
		self.sdk.request(
			'groups.getMembers',
			{'group_id' : id, 'offset': offset, 'fields': fields, 'count' : batchSize},
			function(data) {
				var items = [];

				if (data.hasOwnProperty('error')) {
					stream.emit('error', data.error);
					return;
				}

				items = data.items;
				if (items.length === 0) {
					return stream.push(null);
				}
				isLast = ((offset + items.length) >= data.count);
				offset += batchSize;
				stream.push(items.map(function(value) {return JSON.stringify(value)}).join('\n') + '\n');
			}
		);

		//@todo: memory leak
		self.sdk.on('http-error', function(e) {
			stream.emit('error', e);
		});

		self.sdk.on('parse-error', function(e) {
			stream.emit('error', e);
		});
	});
}

Groups.prototype.getWall = function(id, options) {
	var wall = new VkWall(this.sdk),
		options = options || {};

	options['owner_id'] = '-' + id;

	return wall.get(options);
}

Groups.prototype.info = function(id, options) {
	var self  = this,
		options = options || {},
		fields = options.hasOwnProperty('fields') ? options.fields : '',
		isLast = false;

	return new readStream(function() {
		var stream = this;
		if (isLast) return this.push(null);
		self.sdk.request(
			'groups.getById',
			{'group_id' : id, 'fields': fields},
			function(data) {
				if (data.hasOwnProperty('error')) {
					stream.emit('error', data.error);
					return;
				}
				isLast = true;
				stream.push(data[0]);
			}
		);

		self.sdk.on('http-error', function(e) {
			stream.emit('error', e);
		});

		self.sdk.on('parse-error', function(e) {
			stream.emit('error', e);
		});
	}, {'objectMode':true});
}