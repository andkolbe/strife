const path = require('path')
const express = require('express');
const app = express();
const server = require('http').createServer(app) // pull the http server out from behind the curtain so we can add socket.io to it
const io = require('socket.io')(server);
const formatMessage = require('./utils/messages');
const { getCurrentUser, getRoomUsers, userJoin, userLeave } = require('./utils/users');

// Redis Adapter
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'Strife Bot';

// .emit means you send data to the other side
// you can send any number of arguments ans all serializable datastructures are supported
// there is no need to run JSON.stringify() on objects as it will be done for you

// .on means you receive data from the other side

// A room is an arbitrary channel that sockets can join and leave. It can be used to broadcast events to a subset of clients
// rooms are a server-only concept (i.e. the client does not have access to the list of rooms it has joined).

// socket.id - each new socket connection is assigned a random 20 character identifier. Each socket automatically joins a room identified by its own id

// Run when a client connects
io.on('connection', socket => {

    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room)

        socket.join(user.room); // use join to subscribe the user to a given room. Here it is user.room, room is provided from the client

        // Welcome current user
        socket.emit('message', formatMessage(botName, 'Welcome to Strife!')); // emit this message only to the user

        // Broadcast emits to everyone except the user that is connecting. This is a server only feature
        // use 'to' or 'in' (they are the same) when broadcasting or emitting to a specific room
        socket.broadcast.to(user.room) // we want to only emit to a specific room
            .emit('message', formatMessage(botName, `${user.username} has joined the chat`)); // This will emit to everyone except the user that is connecting

        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

    })

    // Listen for chatMessage from client 
    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        io.to(user.room).emit('message', formatMessage(user.username, msg))  // This will emit to everyone including the user that broadcast the message

    })

    // Runs when client disconnects. This has to be inside of the connection
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat`))

            // Send users and room info after a user left the chat
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }

    })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`)).on('error', err => {
    console.log(err);
    process.exit(1);
});



/*
The 'room' feature is implemented by what we call an Adapter. This Adapter is a server-side component which is responsible for
    Storing the relationships between the Socket instances and the rooms
    broadcasting events to all (or a subset of) clients

It consists in two ES6 Maps
    sids: Map<SocketId, Set<Room>>
    rooms: Map<Room, Set<SocketId>>

Calling socket.join('the-room') will result in:
    in the sids map, adding 'the-room' to the Set identified by the socket ID
    in the rooms map, adding the socket ID in the Set identified by the string 'the-room'

Those two maps are then used when broadcasting
    a broadcast to all sockets (io.emit()) loops through the sids Map, and sends the packet to all sockets
    a broadcast to a given room (io.to('room21').emit()) loops through the Set in the rooms map, and sends the packet to all matching sockets

You can access those objects with:
// main namespace
const rooms = io.of("/").adapter.rooms;
const sids = io.of("/").adapter.sids;
// custom namespace
const rooms = io.of("/my-namespace").adapter.rooms;
const sids = io.of("/my-namespace").adapter.sids;

Those objects are not meant to be directly modified, you should always use socket.join() and socket.leave instead

In a multi-server setup, the rooms and sids objects are not shared between the Socket.IO servers (a room may only exist on one server and not on another)
*/