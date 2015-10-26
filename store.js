var levelup = require('levelup');
var crypto = require('crypto');

var Store = module.exports = function (loc, opts) {
	opts = opts || {};
	this.db = levelup(loc);
	this.hash = opts.hash || function(d) {
		return crypto.createHash('sha256').update(JSON.stringify(d)).digest('hex');
	};
};

Store.prototype.put = function(item, done) {
	var d = JSON.stringify(item);
	var h = this.hash(item);
	this.db.put(h, d, done);
	return h;
};

Store.prototype.get = function(h, done) {
	this.db.get(h, function(err, data) {
		if (err) {
			return done(err);
		}
		var d = JSON.parse(data);
		done(null, d);
	});
};

Store.prototype.del = function(h, done) {
	this.db.del(h, done);
};
