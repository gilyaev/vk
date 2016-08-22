var da = require('diff-arrays'),
	fs = require('fs'),
    Promise = require('bluebird'),
    ProgressBar = require('progress'),
    logDir = './data/command/msub';

var yargs = require('yargs')
	.reset()
	.usage('Usage: $0 msub -g [num]')
	.example('$0 msub -g [num] -t', 'start track group members')
	.example('$0 msub -g [num]', 'Get information of new subscribers')
	.option('group', {
		alias: 'g',
		describe: "vk group id",
		demand: true
	})
	.option('track', {
		alias: 't',
		describe: "start track group members",
		type: "boolean",
		demand: false
	})
	.help()
	.argv;

module.exports = Command;

function Command(sdk) {
	this.sdk = sdk;
}

Command.prototype.run = function(args, callback) {
	var groupId,
		self = this,
		left = right =[],
		tmpFile;

	this.groupId = yargs.group;

	if(yargs.track) {
		this.sourceFile = logDir + '/' +  self.groupId + '.txt';
		this.getGroupInfo().then(function(data) {
			var total = Math.ceil(data.members_count/1000);
			return self.exportsGroupMembers(total, self.sourceFile);
		}).catch(function(e) {
			console.log(e)
		});
		return;
	}

	this.sourceFile = logDir + '/' + self.groupId + '.txt';
	try {
		fs.accessSync(this.sourceFile, fs.R_OK)
	} catch(e) {
		console.log('Group ' + this.groupId + ' not track');
		console.log('Run \u001b[32;1m msub --track=[group_id]\u001b[0m');
		return;
	}


	this.getGroupInfo().then(function(data) {
		var total = Math.ceil(data.members_count/1000);
		return self.exportsGroupMembers(total);
	}).then(function(filename) {
		tmpFile = filename;
		var newMembers = fs.readFileSync(filename, 'utf8'),
			oldMembers = fs.readFileSync(self.sourceFile, 'utf8'),
			diff = da(newMembers.split('\n'), oldMembers.split('\n')),
			reportFile = logDir + '/reports/' +  self.groupId + '.txt',
			membersFile = logDir + '/' +  self.groupId + '.txt',
			d = new Date();

		//save report
		try {
			fs.appendFileSync(reportFile, '************' + d.toString() + '************\n');
			fs.appendFileSync(reportFile, '****Unsubscribed members ***** \n');
			diff['rhs'].forEach(function(v) {
				fs.appendFileSync(reportFile, 'http://vk.com/id' + v + '\n');
			});
			fs.appendFileSync(reportFile, '\n');
			fs.appendFileSync(reportFile, '****Subscribed members ***** \n');
			diff['lhs'].forEach(function(v) {
				fs.appendFileSync(reportFile, 'http://vk.com/id' + v + '\n');
			});
			fs.appendFileSync(reportFile, '\n');
		} catch(e) {
			return console.log(e);
		}

		try {
			fs.renameSync(tmpFile, membersFile)
		} catch(e) {
			console.log(e);
		}
		return;
	}).catch(function(e) {
		console.log(e)
	});
}

Command.prototype.getGroupInfo = function() {
	var sb = new ProgressBar('[:bar] :percent \u001b[32;1m:process\u001b[0m', {
			total: 2,
			width:50
		}), 
		sdk  = this.sdk,
		self = this;

	sb.tick({'process': 'Getting general group information'});

	return new Promise(function(resolve, reject){
		var options = {
			'fields': 'members_count'
		};
		var info = sdk.groups().info(self.groupId, options).on('data', function(data) {
			sb.tick({'process': 'Resolving group info'});
			resolve(data);
		}).on('error', function(e) {
			reject(e);
		});
	});
}

Command.prototype.exportsGroupMembers = function(total, filename) {
	var sb = new ProgressBar('[:bar] :percent \u001b[32;1mFetch group members\u001b[0m', {
  		total: (total+2),
  		width:50
	}),
	self = this,
	filename = filename || './data/tmp/msub_' + self.groupId + '.txt',
	sdk  = this.sdk;
	sb.tick();

	return new Promise(function(resolve, reject){
		var options = {
			'fields': ''
		},
		groupsStream = sdk.groups().getMembers(self.groupId, options);

		groupsStream.pipe(fs.createWriteStream(filename)).on('error', function(e) {
			reject(e);
		});

		groupsStream.on('data', function() {
			sb.tick();
		});

		groupsStream.on('end', function(e) {
			sb.tick();
			resolve(filename);
		});

		groupsStream.on('error', function(e) {
			reject(e);
		});
  	});
}