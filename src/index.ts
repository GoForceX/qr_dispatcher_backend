import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import randomstring from 'randomstring'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'https://jmp.goforcex.top',
    methods: ['GET', 'POST'],
  },
})

io.on('connection', (socket) => {
  socket.on('join', (room: string) => {
    while (socket.rooms.size > 1) {
      const room = socket.rooms.values().next().value!
      socket.leave(room)
      console.log(`Socket ${socket.id} left room ${room}`)
    }
    socket.join(room)
    socket.emit('joined', room)
    console.log(`Socket ${socket.id} joined room ${room}`)
  })

  socket.on('leave', (room: string) => {
    socket.leave(room)
    socket.emit('left', room)
    console.log(`Socket ${socket.id} left room ${room}`)
  })

  socket.on('create', () => {
    while (socket.rooms.size > 1) {
      const room = socket.rooms.values().next().value!
      socket.leave(room)
      console.log(`Socket ${socket.id} left room ${room}`)
    }
    const room = randomstring.generate(8)
    socket.join(room)
    socket.emit('created', room)
    console.log(`Socket ${socket.id} created room ${room}`)
  })

  socket.on('send', (msg: string) => {
    // the first room is the socket's own room, the second room is the target room
    const roomIterator = socket.rooms.values()
    roomIterator.next()
    const room = roomIterator.next().value
    socket.rooms.forEach((r) => {
      console.log(`Socket ${socket.id} is in room ${r}`)
    })
    if (!room) {
      socket.emit('send err', 'You are not in a room')
      return
    }
    socket.to(room).emit('data', msg)
    socket.emit('sent', msg)
    console.log(`Socket ${socket.id} sent data to room ${room}`)
  })

  socket.on('disconnect', () => {
    while (socket.rooms.size > 1) {
      const room = socket.rooms.values().next().value!
      socket.leave(room)
      console.log(`Socket ${socket.id} left room ${room}`)
    }
    console.log(`Socket ${socket.id} disconnected`)
  })
})

httpServer.listen(3000)

module.exports = app
