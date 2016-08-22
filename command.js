#!/usr/bin/env node
var VKT = require('./lib/index.js'),
	vkt = new VKT({
		'mode'  : 'oauth',
		'appId' : 'xxx',
		'appSecret' : 'xxx',
		'token' : 'xxxx'
	});

vkt.command();