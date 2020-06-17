const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http)
const PORT = process.env.PORT
const cors = require('cors')
const { Socket } = require('dgram')

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
        socket.clients = 0

        socket.on('message', (message) => {
            console.log('message received: ', message)
            socket.broadcast.emit('message', message)
        })

        socket.on('NewClient', () => {
            if (socket.clients < 2) {
                socket.broadcast.emit('CreatePeer')
                socket.clients = socket.clients + 1
                console.log(`New client established @ client: ${socket.clients}`)
            } else {
                socket.emit('SessionActive')
            }
        })

        socket.on('Offer', (offer) => SendOffer(socket, offer))
        socket.on('Answer', (data) => SendAnswer(socket, data))
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