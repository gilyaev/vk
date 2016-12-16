var readStream = require('./readable-stream'),
    _ = require('underscore');

module.exports = Wall;

function Wall(sdk) {
    this.sdk = sdk;
}

Wall.prototype.get = function (options) {
    var self  = this,
        options = options || {},
        batchSize = options.hasOwnProperty('batchSize') ? options.batchSize : 100,
        offset = options.hasOwnProperty('offset') ? options.offset : 0,
        isLast = false;

    return new readStream(function() {
        var stream = this;
        if (isLast) return this.push(null);
        options = _.extend(options, {'offset': offset, 'count' : batchSize});
        self.sdk.request(
            'wall.get',
            options,
            function(data) {
                var items = [];
                if (data.hasOwnProperty('error')) {
                    let error = new Error(data.error.error_msg);
                    error.context = data;
                    stream.emit('api-error', error);
                    return;
                }

                items = data.items;
                if (items.length === 0) {
                    return stream.push(null);
                }
                isLast = ((offset + items.length) >= data.count);
                console.log(`${offset + items.length}/${data.count}`);
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