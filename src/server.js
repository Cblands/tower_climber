const Room = require("./server/room.js");
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io').listen(server);
let rooms = {};

app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html')
});

app.get('/game', function (req, res){
   res.sendFile(__dirname + '/client/game.html');
});

let roomno = 1;
rooms[roomno.toString(10)] = new Room(roomno);

io.on('connection', function (socket) {
   console.log("Connecting to room " + roomno);

    rooms[roomno.toString(10)].addPlayerToRoom(socket);

   socket.on('disconnect', function(){
      for(const key in rooms) {
          if(rooms[key].checkIfPlayerInRoom(socket.id)) {
              rooms[key].removePlayerFromRoom(socket);
              break;
          }
      }
   });

   socket.on('playerMovement', function (moveData){
       for(const key in rooms) {
           if(rooms[key].checkIfPlayerInRoom(socket.id)) {
               rooms[key].updatePlayerMovement(socket, moveData);
               break;
           }
       }
   });

   if(rooms[roomno.toString(10)].getNumOfPlayers() >= 2) {
      roomno++;
      rooms[roomno.toString(10)] = new Room(roomno);
   }
});

server.listen(4200, function (){
   console.log(`Listening on ${server.address().port}`);
});
