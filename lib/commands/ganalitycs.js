var fs = require('fs'),
    Promise = require('bluebird'),
    ProgressBar = require('progress'),
    logDir = './data/command/ganalitycs';

var yargs = require('yargs')
	.reset()
	.usage('Usage: $0 ganalitycs -g [num]')
	.example('$0 ganalitycs -g [num]', 'Analize vk group')
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

Command.prototype.run = function(args, callback) {
	var groupInfo    = {},
		reports      = [],
		exportedFile = '',
		groupId,
		self = this;

	this.groupId = groupId = yargs.group;

	self.getGroupInfo().then(function(data) {
		var total = 0;
		groupInfo = data;
	 	total= Math.ceil(data.members_count/1000);
		reports.push('Name:' + groupInfo.name);
		reports.push('Members: ' + groupInfo.members_count);
		reports.push('Country: ' + (groupInfo.hasOwnProperty('country') ? groupInfo.country.title : '---'));
		reports.push('City: ' + (groupInfo.hasOwnProperty('city') ? groupInfo.city.title : '---'));
		reports.push('Type: ' + (groupInfo.is_closed == 0 ? 'Open' : 'Close'));
		return self.exportsGroupMembers(total);
	}).then(function(file) {
		exportedFile = file;
		return self.getDeactiveMembers(exportedFile);
	}).then(function(count) {
		var percent = (parseInt((count/groupInfo.members_count)*100)),
			color = percent < 10 ? 32 : 31;

		reports.push('\u001b['+color+';1mDeactived Users: ' + count + ' ('+percent+'%)\u001b[0m');
		return self.getRelevantFactors(exportedFile, groupInfo);
	}).then(function(relReport) {
		var mtrf     = relReport.MTRF,
			mtrfPercent = (parseInt((mtrf/groupInfo.members_count)*100)),
			mctf     = relReport.MCRF,
			mcrfPercent = (parseInt((mctf/groupInfo.members_count)*100)),
			mtrfColor = mtrfPercent > 50 ? 32 : 31,
			mcrfColor = mcrfPercent > 50 ? 32 : 31;

		reports.push('\u001b['+mcrfColor+';1mRelevance by country: ' + mctf + ' ('+mcrfPercent+'%)\u001b[0m');	
		reports.push('\u001b['+mtrfColor+';1mRelevance by city: ' + mtrf + ' ('+mtrfPercent+'%)\u001b[0m');

	}).then(function() {
		var reportFile = logDir + '/' +  self.groupId + '.txt',
			d = new Date();

		reports.unshift('*********** \u001b[32;1mRESULT\u001b[0m ***********');
		reports.forEach(function(value) {
			console.log(value);
		});

		try {
			fs.appendFileSync(reportFile, '************' + d.toString() + '************\n');
			reports.forEach(function(value) {
				var prepare = value.replace(/(\u001b\[[0-9]{0,3};*[0-9]*m)/gi, ''); 
				fs.appendFileSync(reportFile, prepare + '\n');
			});
			fs.appendFileSync(reportFile, '\n');
			fs.unlinkSync(exportedFile);
		}catch(e) {
			console.log(e);
		}
		
	}).catch(function(e) {
    	console.log(e);
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
			'fields': 'city,country,members_count,place,type'
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
	filename = filename || './data/tmp/ganalitycs_' + self.groupId + '.txt',
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

Command.prototype.getDeactiveMembers = function(file) {
	var self = this;
	return new Promise(function(resolve, reject){
		var rowsReadStream = fs.createReadStream(file).pipe(self.sdk.split());
		rowsReadStream.pipe(self.sdk.filter(function(row) {
			return row.hasOwnProperty('deactivated');
		})).pipe(self.sdk.count()).on('data', function(count){
			resolve(count)
		});
		rowsReadStream.on('error', function(e) {
			reject(e);
		});
	});
}

Command.prototype.getRelevantFactors = function(file, groupInfo) {
	var report = {
			'MTRF': 0,
			'MCRF': 0
		},
		self = this,
		cityId = groupInfo.hasOwnProperty('city') ? groupInfo.city.id : null,
		countryId = groupInfo.hasOwnProperty('country') ? groupInfo.country.id : null;

	return new Promise(function(resolve, reject){
		var rowsReadStream = fs.createReadStream(file).pipe(self.sdk.split());
		rowsReadStream.pipe(self.sdk.filter(function(row) {
			return !row.hasOwnProperty('deactivated');
		})).on('data', function(member) {
			if (cityId && member.hasOwnProperty('city') && member.city.id == cityId) {
				++report.MTRF;
			}

			if (countryId && member.hasOwnProperty('country') && member.country.id == countryId) {
				++report.MCRF;
			}

		}).on('end', function() {
			resolve(report)
		});
		rowsReadStream.on('error', function(e) {
			reject(e);
		});
	});	
}

Command.prototype.help = function() {
	console.log('Usage: ./command.js ganalitycs [groupid]');
	console.log('Usage: ./command.js ganalitycs [groupid]');
}