
#!/usr/bin/env node
var VKT = require('./lib/index.js'),
    vkt = new VKT({
        'mode'  : 'oauth',
        'appId' : 'xxxxxx',
        'appSecret' : 'xxxxxx,
        'token' : 'xxxxxxxx'
    });

vkt.command();