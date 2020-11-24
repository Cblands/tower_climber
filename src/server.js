let express = require('express');
let app = express();
let server = require('http').Server(app);
let io = require('socket.io').listen(server);
let players = {};
let PORT = process.env.PORT || 4200;

app.use(express.static(__dirname + '/client'));

app.get('/', function (req, res){
    res.sendFile(__dirname + '/index.html')
});

app.get('/game', function (req, res){
   res.sendFile(__dirname + '/client/game.html');
});

let roomno = 1;
io.on('connection', function (socket) {
   console.log("Connecting to room " + roomno);

   socket.join("room-"+roomno);

   // //Send this event to everyone in the room.
   // io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. " + roomno);

   console.log('User ' + socket.id + ' joined');
   /* Player information */
    players[socket.id] = {
        rotation: 0,
        x: Math.floor(Object.keys(players).length * 235) + 115,
        y: 1260,
        playerId: socket.id,
        roomNum: roomno
   };

   socket.emit('currentPlayers', players);
   socket.broadcast.to('room-' + players[socket.id].roomNum).emit('newPlayer', players[socket.id]);

   socket.on('disconnect', function(){
      console.log('User ' + socket.id + ' left');
      socket.leave('room-' + players[socket.id].roomNum);
      io.sockets.in("room-" + players[socket.id].roomNum).emit('disconnect', socket.id);
      delete players[socket.id];
   });

   socket.on('playerMovement', function (moveData){
      players[socket.id].x = moveData.x;
      players[socket.id].y = moveData.y;
      socket.broadcast.to('room-' + players[socket.id].roomNum).emit('playerMoved', players[socket.id]);

   });

   if(io.nsps['/'].adapter.rooms["room-" + roomno] && io.nsps['/'].adapter.rooms["room-" + roomno].length > 10) {
      roomno++;
   }
});

server.listen(PORT, function (){
   console.log(`Listening on ${PORT}`);
});