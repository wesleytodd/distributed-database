var KBucket = require('k-bucket');
var crypto = require('crypto');

// Number of nodes
var NUM_NODES = 5;
var NUM_ITEMS = 100;

// Make the routing table
var router = new KBucket();

// Make nodes in the k-bucket
for (var i = 0; i < NUM_NODES; i++) {
	router.add(createNode(i));
}

// Make some items and store them
for (var i = 0; i < NUM_ITEMS; i++) {
	saveItem('item' + i);
}

// Get some items and describe them
describeItem('item1');
describeItem('item123');
describeItem('item345');
describeItem('item567');

// Desribe a node and the data in it
describeNode('Bucket0');

// A node is a little in memory k/v store
function createNode(i) {
	var name = 'Bucket' + i;
	return {
		id: new Buffer(sha1(name)),
		name: name,
		_data: {},
		length: 0,
		put: function(hash, d) {
			if (!this._data[hash]) this.length++;
			this._data[hash] = d;
		},
		get: function(hash) {
			return this._data[hash];
		}
	};
}

// To save an item, pick the closest node, and put it there
function saveItem(item) {
	var hash = sha1(item);
	whichNode(hash).put(hash, item);
}

// Get an item is to find the closes node and get from it
function getItem(item) {
	var hash = sha1(item);
	return whichNode(hash).get(hash);
}

// Use the k-bucket router to find the closes node to an item
function whichNode(hash) {
	return router.closest({
		id: new Buffer(hash)
	}, 1)[0];
}

// helper to sha1 things
function sha1(d) {
	return crypto.createHash('sha1').update(d).digest('hex');
};

function describeItem(item) {
	var hash = sha1(item);
	var node = whichNode(hash);

	console.log('========================');
	console.log('Item Conent: ', node.get(hash));
	console.log('Node Name: ', node.name);
	console.log('Item Hash: ', hash);
}

function describeNode(name) {
	var hash = sha1(name);
	var node = whichNode(hash);
	var items = [];
	for (var i in node._data) {
		items.push(node._data[i]);
	}

	console.log('========================');
	console.log('Node Name: ', node.name);
	console.log('Items Stored In Node: ', node.length);
	console.log('Items In Node: \n', items);
}
