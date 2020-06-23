const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 5000
const cors = require('cors')

server.use(cors())

// ROOM STORAGE
let ROOMS = {
    /*
    '/someName': {
        room: createRoom('/someName')
    }
    */
}


server.get('/:id', (req, res) => {
    let {id} = req.params
    // check if room exists
    if(!ROOMS[id]){
        console.log('CREATED ROOM:', id)
        ROOMS[id] = {
            room: createRoom(id)
        }
    }
    res.status(201)
})

// creates a new room where all socket interactions will be housed
function createRoom(room_id){
    let room = io
    .of(room_id)
    .on('connection', socket => {
        // CLIENT EVENTS
        socket.on('message', (message) =>           SendMessage(socket, message))
        socket.on('NewClient', () =>                CreateCLient(socket, room_id))
        socket.on('Offer', (offer, socket_id) =>    SendOffer(socket, offer, socket_id))
        socket.on('Answer', (data, socket_id) =>    SendAnswer(socket, data, socket_id))
        socket.on('disconnect', () =>               Disconnect(socket))

        // LOGGED EVENTS
        socket.on('connect_timeout', ()=>           console.log('==== CONNECTION TIMEOUT ===='))
        socket.on('connect_error', () =>            console.log('==== CONNECTION ERROR ===='))
        socket.on('reconnect', (count) =>           console.log('==== SUCCESSFUL RECONNECT COUNT: ', count))
        socket.on('reconnect_attempt', (count) =>   console.log('==== RECONNECT ATTEMPT: ', count))
        socket.on('reconnect_error', (err) =>       console.error('==== RECONNECTION ERROR: ', err))
        socket.on('reconnect_failed', ()=>          console.error('==== FAILED TO RECONNECT! ===='))
    })
    return room
}






/* ============= METHODS ============== */

function SendMessage(socket, message){
    console.log('NEW MESSAGE:', message)
    socket.broadcast.emit('message', message)
}

function CreateCLient(socket, id){
    console.log('===============')
    console.log('USER CONNECTED:', socket.id)
    console.log('CONNECTION PORT:', Object.keys(io.of(id).sockets).length)
    socket.broadcast.emit('CreatePeer', socket.id, socket.client.id)
}

function Disconnect(socket){
    console.log('USER DISCONNECTED:', socket.client.id)
    socket.broadcast.emit('Disconnect', socket.client.id)
}

function SendOffer(socket, offer, socket_id) {
    console.log('SENDING OFFER TO:', socket_id)
    socket.broadcast.to(socket_id).emit('BackendOffer', offer, socket.id, socket.client.id)
}

function SendAnswer(socket, data, socket_id) {
    console.log('SENDING ANSWER TO:', socket_id)
    socket.broadcast.to(socket_id).emit('BackendAnswer', data, socket.client.id)
}

http.listen(PORT, () => console.log('SERVER LISTENING ON PORT: ', PORT))

//                ms    s    m    h
let PURGE_TIME = 1000 * 60 * 60 * 5 //-> 5 hours
setInterval(() => {
    // perge the unused rooms every PURGE_TIME
    for(room in ROOMS){
        let socket_count = Object.keys(ROOMS[room].room.sockets).length
        if(!socket_count){
            // delete the room from server memory if empty on next purge
            delete ROOMS[room]
            console.log('=========================')
            console.log('==== DELETED ROOM:', room)
            console.log('=========================')
        }
    }
}, PURGE_TIME);


