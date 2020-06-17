const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 5000
const cors = require('cors')

server.use(cors())

// ROOM STORAGE
let ROOMS = {}

server.get('/:id', (req, res) => {
    let {id} = req.params

    // check if room exists
    if(!ROOMS.id){
        ROOMS[id] = createRoom(id)
    }
    res.status(201)
})

function createRoom(id){
    let room = io
    .of(id)
    .on('connection', socket => {
        console.log('connected')

        // MESSAGE CONNECTION
        socket.on('message', message => {
            console.log('message transmitted: ', message)
            socket.broadcast.emit('message', message)
        })

        // NEW CLIENT CONNECTION
        socket.on('NewClient', () => {
            socket.broadcast.emit('CreatePeer')
            console.log(`New client established @ client: ${socket.client.id}`)
        })

        // OFFER FROM FRONT
        socket.on('Offer', offer => SendOffer(socket, offer))
        // SEND ANSWER TO FRONT
        socket.on('Answer', data => SendAnswer(socket, data))
        // SEND DISCONNECT TO FRONT
        socket.on('disconnect', () => Disconnect(socket))
    })
    return room
}

function Disconnect(socket){
    if(socket.clients>0) socket.clients-=1
    socket.broadcast.emit('Disconnect')
    console.log('User disconnected')
}

function SendOffer(socket, offer) {
    console.log('sending offer')
    socket.broadcast.emit('BackendOffer', offer)
}

function SendAnswer(socket, data) {
    console.log('sending answer')
    socket.broadcast.emit('BackendAnswer', data)
}

http.listen(PORT, () => console.log('Up and running you bitch'))