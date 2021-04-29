Using Multiple Nodes
When deploying multiple Socket.IO servers, there are two things to take care of:
    enabling sticky session, if HTTP long polling is enabled (which is the default)
    using the Redis adapter 

Sticky load balancing
If you plan to distribute the load of connections among different processes or machines, you have to make sure that all requests associated with a particular
session ID reach the process that originated them

Why is sticky-session required
This is because the HTTP long polling transport sends multiple HTTP requests during the lifetime of the Socket.IO session

The Websocket transport does not have this limitation, since it relies o a single TCP connectin for the whole session. If you disable the HTTP long polling
transport, you won't need sticky sessions


Passing events between nodes
The Redis Adapter
If you want to broadcast events to all clients (or to the clients in a certain room) you'll need some way of passing messages between processes or computers
The interface in charge of routing messages is what we call the Adapter. 
By running Socket.IO with the socket.io-redis adapter you can run multiple Socket.IO instances in differentprocesses or servers that can all broadcast and emit
events to and from each other 


How does Socket.IO-Redis work under the hood?
This adapter extends the in memory adapter that is included by default with the Socket.IO server
The in memory adapter stores the relationships between Sockets and Rooms in two Maps

When you run socket.join("room21"), here's what happens:
console.log(adapter.rooms); // Map { "room21" => Set { "mdpk4kxF5CmhwfCdAHD8" } }
console.log(adapter.sids); // Map { "mdpk4kxF5CmhwfCdAHD8" => Set { "mdpk4kxF5CmhwfCdAHD8", "room21" } }
// "mdpk4kxF5CmhwfCdAHD8" being the ID of the given socket

Those two Maps are used when broadcasting
    A broadcast to all sockets (io.emit()) loops through the sids Map, and send the packet to all sockets
    A broadcast to a given room (io.to("room21).emit()) loops through the Set in the rooms Map, and sends the packet to all matching sockets

The Redis adapter extends the broadcst function of the in memeory adapter: the packet is also published to a Redis channel

Each Socket.IO server receives this packet and broadcasts it to its own list of connected sockets

The room itself is persisted on Redis so when you ask for users, you don't actually ask it from the server (in-memory), but from Redis (persisted across servers)

No data is stored in Redis itself. Redis server only acts as a pub/sub server. 
Each emitted message is published to redis which is broadcast to other socket servers as well.




Redis PUB/SUB

Senders (publishers) are not programmed to send their messages to specific receviers (subscribers).
Rather, published messages are characterized into channels, without knowledge of what (if any) subscribers there may be. Subscribers express interest in one or
more channels, and only receive messsages that are of interest, without knowldege of what (if any) publishers there are. This decoupling of publishers and 
subscribers can allow for greater scalability and a more dynamic network topology

In order to subscribe to channels 'foo' and 'bar' the client issues a SUBSCRIBE providing the names of the channels:
SUBSCRIBE foo bar
Messages sent by other clients to these channels will be pushed by Redis to all the subscribed clients
A client subscribed to one or more channels should not issue commands, although it can subscribe and unsubscribe to and from other channels
The replies to subscription and unsubscription operations are sent in the form of messages, so that the client can just read a coherent stream of messages where
the first element indicates the type of message. 

Advantages 
Loose Coupling
Publishers are loosely coupled to subscribers, and need not even know of their existence. With the channel (topic) being the focus, publishers and subscribers are
allowed to remain ignorant of system topology. Each can continue to operate as per normal independently of each other. In the traditional tightly coupled
client-server paradigm, the client cannot post messages to the server while the server is not running, nor can the server receive messages unless the client
is running. Many pub/sub systems decouple not only the locations of the publishers and subscribers but also decouple them temporally. A common strategy used by
middleware analysts with such pub/sub systems is to take down a publisher to allow the subscribers to work through the backlog.
Scalability
Pub/sub provides the opportunity for better scalability than traditional client/server, through parallel operation, message caching, tree-based, or network based 
routing.
However, in certain types of tightly coupled, high volume enterprise environments, as systems scale up to become data centers with thousands of servers sharing 
the pub/sub infrastruce, current vendor systems often lose this benefit; scalability for pub/sub products under high load in these context is a research challenge
Outside of the interprise environment, on the other hand, the pub/sub paradigm has proven its scalability to volumes far beyond those of a single data center,
providing Internet wide distributed messaging through web syndication protocols such as RSS and Atom. These syndication protocols accept higher latency and lack of
delivery guarantees in exchange for the ability for even a low end web server to syndicate messages to (potentially) millions of subscriber nodes

Disadvantages
Message delivery issues
It's hard to know if the message is being consumed or not
The broker in a pub/sub system may be designed to deliver messages for a specified time, but then stop attempting delivery,
whether or not it has received confirmation of successful receipt of the message by all subscribers. A pub/sub system designed in this way cannot guarantee
delivery of messages to any applications that might require such assured delivery. 
Tighter coupling of the designs of such a publisher and subscriber pair must be enforced outside of the pub/sub architecture to accomplish such assured delivery
(e.g. by requiring the subscriber to publish receipt messages).

A publisher in a pub/sub system may assume that a subscriber is listening, when in fact it is not.
A factory may utilize a pub/sub system where equipment can publish problems or failures to a subscriber that displays and logs those problems.
If the logger fails (crashes), equipment problem publishers won't necessarily receive notice of the logger failure, and error messages will not be 
displayed or recorded by any equipment on the pub/sub system. 
This is also a design challenge for alternative messaging architectures, such as a client/server system.
In a client/server system, when an error logger fails, the system will receive an indication of the error logger (server) failure.
However, the client/server system will have to deal with that failure by having redundant logging servers online, or by dynamically spawning fallback 
logging servers.
This adds complexity to the client and server designs, as well as to the client/server architecture as a whole.
However, in a pub/sub system, redundant logging subscribers that are exact duplicates of the existing logger can be added to the system to increase 
logging reliability  without any impact to any other equipment on the system.
In a pub/sub system, the feature of assured error message logging can be added incrementally, subsequent to implementing the basic functionality of 
equipment problem message logging.

Complexity
Network Saturation
