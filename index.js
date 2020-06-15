const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http)
const PORT = process.env.PORT || 3000

let clients = 0

server.get('/', (req, res) => res.send('Cant get, you dumb shit!'))

io.sockets.setMaxListeners(11)

io.on('connection', socket => {

    socket.on('message', (message) => {
        console.log('message received: ', message)
        socket.broadcast.emit('message', message)
    })

    socket.on('NewClient', () => {
        if(clients < 2){
            socket.broadcast.emit('CreatePeer')
            clients++
            console.log(`New client established @ client: ${clients}`)
        }else{
            socket.emit('SessionActive')
        }
    })

    socket.on('Offer', SendOffer)
    socket.on('Answer', SendAnswer)
    socket.on('disconnect', Disconnect)
})

function Disconnect(){
    if(clients>0) clients--
    this.broadcast.emit('Disconnect')
    console.log('User disconnected')
}

function SendOffer(offer) {
    console.log('sending offer')
    this.broadcast.emit('BackendOffer', offer)
}

function SendAnswer(data) {
    console.log('sending answer')
    this.broadcast.emit('BackendAnswer', data)
}

http.listen(PORT, () => console.log('Up and running you bitch'))