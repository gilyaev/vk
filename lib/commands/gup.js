let fs = require('fs'),
    readline = require('readline'),
    _ = require('underscore'),
    wallDir = './data/command/wgrabber';

var yargs = require('yargs')
    .reset()
    .usage('Usage: $0 gup -g [number] -u [number]')
    .example(
        '$0 wgrabber -g [number] -u [number]',
        'Pick up user posts from the group wall.'
    ).option('group', {
        alias: 'g',
        describe: "vk group id",
        type: 'number',
        demand: true
    }).option('userId', {
        alias: 'u',
        type: 'number'
    }).option('targetYear', {
        alias: 'y',
        type: 'number'
    }).option('search', {
        alias: 's',
        type: 'string'
    }).option('comments', {
        alias: 'c',
        type: 'string'
    }).option('showlink', {
        alias: 'l',
        type: 'string'
    }).option('postNumber', {
        alias: 'n',
        type: 'number'
    }).help().argv;

module.exports = Command;

function Command(sdk) {
    this.sdk = sdk;
}

Command.prototype.run = function(args, callback) {
    let gid = yargs.group,
        uid = yargs.userId,
        self = this,
        count = 0,
        likes = 0,
        maxLikes = 0,
        maxLikesId,
        comments = 0,
        maxComments = 0,
        maxCommentsId,
        usersStat = {},
        tmpFile = `./data/tmp/gup_${gid}.txt`,
        filename = `${wallDir}/${gid}_all.txt`;

    try {
        fs.accessSync(filename, fs.R_OK);
    } catch (e) {
        console.log(`Group ${gid} not track \nRun \u001b[32;1m wgrabber -g ${gid} -f all \u001b[0m`);
        return;
    }

    try {
        fs.unlinkSync(tmpFile);
    } catch (e) {

    }

    const rd = readline.createInterface({
        input: fs.createReadStream(filename),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', (line) => {
        let post = JSON.parse(line),
            link = '',
            date = new Date(post.date * 1000),
            year = date.getFullYear(),
            commentsCount = 0,
            likesCount = 0;

        if (_.has(post, 'likes')) {
            likesCount = post.likes.count
        }

        if (_.has(post, 'comments')) {
            commentsCount = post.comments.count
        }

        if (!_.isUndefined(uid) && post.from_id !== uid) {
            return;
        }

        if (!_.isUndefined(yargs.targetYear) && yargs.targetYear != year) {
            return;
        }

        if (!_.isUndefined(yargs.comments) && yargs.comments >= commentsCount) {
            return;
        }

        if (!_.isUndefined(yargs.search) && post.text.search(new RegExp(yargs.search, 'i')) == -1) {
            return;
        }

        link = `https://vk.com/club${gid}?w=wall-${gid}_${post.id}`;
        if (!_.isUndefined(yargs.showlink)) {
            console.log(link);
        }

        if (!_.has(usersStat, post.from_id)) {
            usersStat[post.from_id] = 1;
        } else {
            usersStat[post.from_id] += 1;
        }
        

        if (maxComments < commentsCount) {
            maxComments = commentsCount;
            maxCommentsId = post.id;
        }

        if (maxLikes < likesCount) {
            maxLikes = likesCount;
            maxLikesId = post.id;
        }

        fs.appendFileSync(tmpFile, `${line}\n`, 'utf-8');

        likes += likesCount;
        comments += commentsCount;
        count++;
    });

    rd.on('close', () => {
        console.log(
            `Posts count: \u001b[32;1m${count}\u001b[0m
            \rLikes count: \u001b[32;1m${likes}\u001b[0m
            \rMax likes: \u001b[32;1m${maxLikes}\u001b[0m (https://vk.com/club${gid}?w=wall-${gid}_${maxLikesId})
            \rComments count: \u001b[32;1m${comments}\u001b[0m
            \rMax comments: \u001b[32;1m${maxComments}\u001b[0m (https://vk.com/club${gid}?w=wall-${gid}_${maxCommentsId})`
        );
    });
}