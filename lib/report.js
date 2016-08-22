var fs = require('fs');

module.exports = Report;


function getPrefix() {
	var d = new Date();
	return d.getFullYear()+(d.getMonth()+1)+ d.getDate() + d.getHours() + d.getMinutes();
}

function Report(dir) {
	this.dir = dir || '../data';
}

Report.prototype.write = function(name, data) {
	
};

