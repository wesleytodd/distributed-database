var dnode = require('dnode');
var net = require('net');
var parallel = require('run-parallel');
var d = dnode();
d.on('remote', function (remote) {

	var puts = [];
	var gets = [];
	var dels = [];
	var hashes = [];
	for (var i = 0; i < 100; i++) {
		(function(i) {
			puts[i] = function(done) {
				remote.put({ value: i }, function(hash) {
					hashes[i] = hash;
					done(null, hash);
				});
			};
			gets[i] = function(done) {
				remote.get(hashes[i], function(val) {
					done(null, val);
				});
			};
			dels[i] = function(done) {
				remote.del(hashes[i], function() {
					done();
				});
			};
		})(i);
	}

	parallel(puts, function(err, hashes) {
		console.log('Hashes: ', hashes);

		parallel(gets, function(err, vals) {
			console.log('Values: ', vals);

			parallel(dels, function(err) {
				console.log('All Deleted');
				c.end();
			});
		});
	});

});

var c = net.connect(9754);
c.pipe(d).pipe(c);

