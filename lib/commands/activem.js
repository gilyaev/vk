let fs = require('fs'),
    _ = require('underscore'),
    readline = require('readline'),
    file2016 = `./data/tmp/post2016_20802408.txt`;


module.exports = Command;

function Command(sdk) {
    this.sdk = sdk;
}

Command.prototype.run = function(args, callback) {
    let stat = [];

    try {
        fs.accessSync(file2016, fs.R_OK);
    } catch (e) {
        console.log("File not exist");
        return;
    }

    const rd = readline.createInterface({
        input: fs.createReadStream(file2016),
        output: process.stdout,
        terminal: false
    });

    rd.on('line', (line) => {
        let post = JSON.parse(line),
            likesCount = 0,
            commentsCount = 0,
            uid = `id${post.from_id}`;

        if (uid === 'id-20802408') {
            return;
        }

        if (_.has(post, 'likes')) {
            likesCount = post.likes.count;
        }

        if (_.has(post, 'comments')) {
            commentsCount = post.comments.count;
        }

        // let pattern = "клев был|ловил на|рыбалкой доволен|отчет с|был вчера|был сегодня|Были сегодня|резутатом доволен|время провели|Ездили сегодня|фото улова не|Результат на|На воде были|Вчера были|Вчера был";
        // //console.log(post.text);
        // if (post.text.search(new RegExp(pattern, 'i')) == -1) {
        //     return;
        // }

        let user = _.findWhere(stat, {
            id: uid
        });

        if (_.isUndefined(user)) {
            try {
                user = {
                    'id': uid,
                    'profile': `https://vk.com/${uid}`,
                    'postCount': 0,
                    'likes': 0
                };
            } catch (e) {
                console.log(e)
            }
            stat.push(user);
        }

        user.postCount += 1;
        user.likes += likesCount;
    });

    rd.on('close', () => {
        let top = _.filter(stat, (u) => u.postCount > 19);
        let r = _.chain(top).sortBy('postCount').reverse().value();
        _.each(r, (i) => console.log(`(${i.postCount}) ${i.profile}`))
        
    });
}