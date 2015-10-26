# Messing around with a distributed database on top of leveldb

Start a couple of servers:

```
$ ./bin/node
$ ./bin/node -d test1.db -p 9754 -c 9753
```

The `-c` options points the second database at the first, it notifies and joins with the cluster.

Then run the example script:

```
$ node index.js
```

You will see some output when it inserts, gets and then deletes the data.  What it does in the background is distributes the data on both of your nodes based on the Kademlia DHT algorithm.  This basic implementation knows about all of the nodes, but the idea is that you can traverse the network when the node count gets to high (that is what the Kademlia DHT is for).   I will probably add that node traversal to this example at some point.

Note: I didn't do the logic yet to run more than two nodes (this was just one days worth of work).  But the idea would be that when a node come online it notifies more than just the single node you pointed it at.
