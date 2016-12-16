var da = require('diff-arrays'),
    fs = require('fs'),
    Promise = require('bluebird'),
    ProgressBar = require('progress'),
    logDir = './data/command/wgrabber';

var yargs = require('yargs')
    .reset()
    .usage('Usage: $0 wgrabber -g [int]')
    .example(
        '$0 wgrabber -g [int] -f [string]', 
        'Pick up all the posts from the wall. see : https://vk.com/dev/wall.get'
    ).option('group', {
        alias: 'g',
        describe: "vk group id",
        type: 'number',
        demand: true
    }).option('filter', {
        alias: 'f',
        choices: ['suggests', 'postponed', 'owner', 'others', 'all'],
        default: 'others'
    }).help().argv;

module.exports = Command;

function Command(sdk) {
    this.sdk = sdk;
}

Command.prototype.run = function(args, callback) {
    var groupId = yargs.group,
        filter = yargs.filter,
        self = this,
        filename = logDir + '/' + groupId + '_' + filter + '.txt',
        stream = this.sdk.groups()
            .getWall(
                groupId, 
                {
                    filter:filter
                }
            );

        stream.pipe(fs.createWriteStream(filename))
        stream.on('api-error', function(e) {
            console.log(e);
        });
}

