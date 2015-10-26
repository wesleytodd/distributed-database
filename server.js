var dnode = require('dnode');
var net = require('net');
var Store = require('./store');
var KBucket = require('k-bucket');
var crypto = require('crypto');

var Server = module.exports = function(loc, port, clusterPort) {
	this.db = new Store(loc);
	this.server = net.createServer(this.onConnection.bind(this));
	this.server.listen(port);
	this.host = 'localhost';
	this.port = port;

	this.cluster = new KBucket({
		arbiter: function(candidate, incumbent) {
			// always keeps the old one
			return incumbent;
		}
	});
	this.addToCluster({
		host: 'localhost',
		port: port,
		rpc: this
	});

	if (clusterPort) {
		this.joinCluster({
			host: 'localhost',
			port: clusterPort
		}, function() {
			// do something?
		});
	}
};

Server.prototype.onConnection = function(c) {
	c.pipe(dnode({
        put: this.put.bind(this),
        get: this.get.bind(this),
        del: this.del.bind(this),
        joinCluster: this._joinCluster.bind(this)
    })).pipe(c);
};

Server.prototype.put = function(item, done) {
	var nodes = this.cluster.closest({
		id: new Buffer(hashObj(item))
	}, 1);

	if (nodes[0].rpc === this) {
		var hash = this.db.put(item, function(err) {
			if (err) {
				console.error(err);
			}
			done(hash);
		});
	} else {
		nodes[0].rpc.put(item, function(hash) {
			done(hash);
		});
	}
};

Server.prototype.get = function(hash, done) {
	var nodes = this.cluster.closest({
		id: new Buffer(hash)
	}, 1);

	if (nodes[0].rpc === this) {
		this.db.get(hash, function(err, data) {
			if (err) {
				console.error(err);
			}
			done(data);
		});
	} else {
		nodes[0].rpc.get(hash, function(data) {
			done(data);
		});
	}
};

Server.prototype.del = function(hash, done) {
	var nodes = this.cluster.closest({
		id: new Buffer(hash)
	}, 1);

	if (nodes[0].rpc === this) {
		this.db.del(hash, function(err, data) {
			if (err) {
				console.error(err);
			}
			done(data);
		});
	} else {
		nodes[0].rpc.del(hash, function(data) {
			done(data);
		});
	}
};

Server.prototype._joinCluster = function(node, done) {
	// Dont add if it already exists
	var exists = this.cluster.get(serverId(node.host, node.port));
	if (exists) {
		return done();
	}

	this.joinCluster(node, function() {
		var nodes = this.cluster.toArray().map(function(n) {
			return {
				host: n.host,
				port: n.port
			};
		});
		done(JSON.stringify(nodes));
	}.bind(this));
};

Server.prototype.joinCluster = function(node, done) {
	// Create RPC connection
	var d = dnode();
	d.on('remote', function(rpc) {
		// Before informing them, add locally
		this.addToCluster({
			host: node.host,
			port: node.port,
			rpc: rpc
		});

		rpc.joinCluster({
			host: this.host,
			port: this.port
		}, function(others) {
			done();
		}.bind(this));
	}.bind(this));
	var c = net.connect(node.port);
	c.pipe(d).pipe(c);
};

Server.prototype.addToCluster = function(node) {
	this.cluster.add({
		id: serverId(node.host, node.port),
		host: node.host,
		port: node.port,
		rpc: node.rpc
	});
};

function serverId(host, port) {
	return new Buffer(hashObj({
		host: '' + host,
		port: '' + port
	}));
}

function hashObj(obj) {
	return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}
