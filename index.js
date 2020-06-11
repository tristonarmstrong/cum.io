const server = require('express')()
const http = require('http').createServer(server)
const io = require('socket.io')(http)
const PORT = 3000

let clients = 0

io.sockets.setMaxListeners(11)

io.on('connection', socket => {

    socket.on('NewClient', () => {
        console.log(clients)
        if(clients < 2){
                socket.broadcast.emit('CreatePeer')
                clients++
                console.log(`New client esgtablished @ client: ${clients}`)
        }
        else{
            socket.broadcast.emit('SessionActive')
        }
    })

    socket.on('Offer', SendOffer)
    socket.on('Answer', SendAnswer)
    socket.on('disconnect', Disconnect)
    socket.on('stream', stream => {
        console.log('broadcasting stream')
        socket.broadcast.emit('stream', stream)
    })
})

function Disconnect(){
    if(clients>0) clients--
    this.broadcast.emit('Disconnect')
}

function SendOffer(offer) {
    console.log('sending offer')
    this.broadcast.emit('BackendOffer', offer)
}

function SendAnswer(data) {
    console.log(data)
    console.log('sending answer')
    this.broadcast.emit('BackendAnswer', data)
}

http.listen(PORT, () => console.log('Up and running'))