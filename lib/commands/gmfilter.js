'use strict';

var da = require('diff-arrays'),
	fs = require('fs'),
    Promise = require('bluebird'),
    ProgressBar = require('progress'),
    logDir = './data/command/gmfilter';

var yargs = require('yargs')
   .reset()
   .usage('Usage: $0 gmfilter -g [num] -city [num]')
   .option('city', {
   		alias: 'c',
    	describe: "filter members by city id \n(https://vk.com/dev/database.getCities)",
    	demand: true
  	})
	.option('group', {
   		alias: 'g',
    	describe: "vk group id",
    	demand: true
  	})
   .help()
   .argv;

module.exports = Command;

function Command(sdk) {
	this.sdk = sdk;
}

Command.prototype.run = function (args, callback) {
	var self = this;
	
	this.groupId = yargs.group;
	this.city    = yargs.city;

	this.getGroupInfo().then(function(data) {
		var total = Math.ceil(data.members_count/1000);
		return self.exportsGroupMembers(total);
	}).then(function(filename) {
		return;
	}).catch(function(e) {
		console.log(e)
	});
}

Command.prototype.exportsGroupMembers = function(total, filename) {
	var sb = new ProgressBar('[:bar] :percent \u001b[32;1mFetch group members\u001b[0m', {
  		total: (total+2),
  		width:50
	}),
	self = this,
	filename = filename || './data/tmp/gmfilter_' + self.groupId + '.txt',
	sdk  = this.sdk;
	sb.tick();

	return new Promise(function(resolve, reject){
		var options = {
			'fields': 'sex, bdate, city, country, photo_50, photo_100, photo_200_orig, photo_200, photo_400_orig, photo_max, photo_max_orig, online, online_mobile, lists, domain, has_mobile, contacts, connections, site, education, universities, schools, can_post, can_see_all_posts, can_see_audio, can_write_private_message, status, last_seen, common_count, relation, relatives, counters'
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